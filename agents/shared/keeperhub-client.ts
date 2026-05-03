import { fetchCredentials } from "./credential-helper";

const KEEPERHUB_API_BASE = "https://app.keeperhub.com/api";
const WORKFLOW_ID = process.env.KEEPERHUB_WORKFLOW_ID || "6k8kkgb8v5gqh7gquriql";
const DISCORD_INTEGRATION_ID = process.env.KEEPERHUB_DISCORD_ID || "libp44j88ukrimww72zac";
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || "https://swarmex.onrender.com";

// We dynamically update the KeeperHub workflow right before triggering it.
// This bypasses KeeperHub's broken variable interpolation engine while
// ensuring KeeperHub is the one actually sending the Discord message.
async function patchKeeperHubWorkflowAndTrigger(message: string, sessionId: string): Promise<boolean> {
  const KEEPERHUB_API_KEY = process.env.KEEPERHUB_API; // kh_ key (for patching)
  const KEEPERHUB_WEBHOOK_KEY = process.env.KEEPERHUB_API_USER; // wfb_ key (for triggering)

  if (!KEEPERHUB_API_KEY || !KEEPERHUB_WEBHOOK_KEY) {
    console.error('[KeeperHub] Missing KEEPERHUB_API or KEEPERHUB_API_USER in .env');
    return false;
  }

  // 1. PATCH the workflow with the dynamic message
  console.log(`[KeeperHub] Patching workflow Discord action node...`);
  const patchPayload = {
    nodes: [
      { id: "webhook-trigger", type: "trigger", data: { type: "trigger", label: "SwarmEx Trade Event", config: { triggerType: "Webhook" }, status: "idle" }, position: { x: 100, y: 100 } },
      {
        id: "discord-action", type: "action",
        data: {
          type: "action", label: "Discord Trade Alert", status: "idle",
          config: {
            actionType: "discord/send-message",
            integrationId: DISCORD_INTEGRATION_ID,
            discordMessage: message // Injecting the EXACT message here
          }
        },
        position: { x: 400, y: 100 }
      },
      { id: "schedule-trigger", type: "trigger", data: { type: "trigger", label: "5-Min Heartbeat", config: { schedule: "*/5 * * * *", triggerType: "Schedule" }, status: "idle" }, position: { x: 100, y: 380 } },
      { id: "wake-action", type: "action", data: { type: "action", label: "Wake SwarmEx Agents", status: "idle", config: { actionType: "HTTP Request", endpoint: `${RENDER_URL}/orchestrator/wake`, httpBody: '{"source":"keeperhub","action":"wake"}', httpMethod: "POST", httpHeaders: '{"Content-Type":"application/json"}' } }, position: { x: 400, y: 380 } }
    ],
    edges: [
      { id: "e1", source: "webhook-trigger", target: "discord-action" },
      { id: "e2", source: "schedule-trigger", target: "wake-action" }
    ]
  };

  try {
    const patchRes = await fetch(`${KEEPERHUB_API_BASE}/workflows/${WORKFLOW_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KEEPERHUB_API_KEY}`
      },
      body: JSON.stringify(patchPayload)
    });
    
    if (!patchRes.ok) {
      const text = await patchRes.text();
      throw new Error(`PATCH failed ${patchRes.status}: ${text}`);
    }

    // 2. TRIGGER the workflow (KeeperHub reads the node and sends to Discord)
    console.log(`[KeeperHub] Triggering workflow execution...`);
    const triggerRes = await fetch(`${KEEPERHUB_API_BASE}/workflows/${WORKFLOW_ID}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KEEPERHUB_WEBHOOK_KEY}`
      },
      body: JSON.stringify({ event: 'swarm_event', sessionId })
    });

    const triggerText = await triggerRes.text();
    if (!triggerRes.ok) throw new Error(`TRIGGER failed ${triggerRes.status}: ${triggerText}`);
    
    let data: any = {};
    try { data = JSON.parse(triggerText); } catch {}
    console.log(`[KeeperHub] ✅ Success! ExecutionId: ${data.executionId}`);
    return true;

  } catch (err: any) {
    console.error('[KeeperHub] ❌ Operation failed:', err.message);
    return false;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function notifyKeeperHubOfNewSession(sessionId: string): Promise<void> {
  const message = `🚀 **SwarmEx Session Started**\nSession: \`${sessionId}\``;
  await patchKeeperHubWorkflowAndTrigger(message, sessionId);
}

export async function notifyKeeperHubOfExecution(
  sessionId: string,
  status: 'success' | 'failed',
  details: { txHash?: string; rootHash?: string; storageTxHash?: string; registryTxHash?: string; computeResult?: string; error?: string }
): Promise<void> {
  const isSuccess = status === 'success';
  const { txHash, rootHash, storageTxHash, registryTxHash, computeResult } = details;

  let message: string;
  if (isSuccess) {
    const lines = [
      `✅ **SwarmEx Trade Executed**`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `**Session:** \`${sessionId}\``,
      ``,
    ];
    // Link 1: Uniswap v4 swap on Base Sepolia
    if (txHash) {
      lines.push(`⚡ **Uniswap v4 Swap (Base Sepolia)**`);
      lines.push(`https://sepolia.basescan.org/tx/${txHash}`);
      lines.push(``);
    }
    // Link 2: 0G Storage proof
    if (storageTxHash) {
      lines.push(`🗄 **0G Storage Proof Transaction**`);
      lines.push(`https://chainscan-galileo.0g.ai/tx/${storageTxHash}`);
      if (rootHash) lines.push(`*Root Hash: \`${rootHash}\`*`);
      lines.push(``);
    } else if (rootHash) {
      lines.push(`🗄 **0G Storage Proof**`);
      lines.push(`https://storagescan-galileo.0g.ai/`);
      lines.push(`*Root Hash: \`${rootHash}\`*`);
      lines.push(``);
    }
    // Link 3: 0G Compute
    if (computeResult) {
      lines.push(`🧠 **0G Compute Inference**`);
      lines.push(`_Result: ${computeResult.slice(0, 500)}_`);
      lines.push(`https://chainscan-galileo.0g.ai/address/${process.env.OG_COMPUTE_PROVIDER}`);
      lines.push(``);
    }
    // Link 4: Agent Registry
    if (registryTxHash) {
      lines.push(`🛡 **0G Agent Registry (0G Galileo)**`);
      lines.push(`https://chainscan-galileo.0g.ai/tx/${registryTxHash}`);
      lines.push(``);
    }

    lines.push(`_SwarmEx · Base Sepolia · Uniswap v4 · 0G Storage · 0G Compute_`);
    message = lines.join('\n');
  } else {
    message = [
      `❌ **SwarmEx Trade Failed**`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `**Session:** \`${sessionId}\``,
      `**Error:** ${details.error || 'Unknown execution error'}`,
      ``,
      `_SwarmEx Execution Engine_`,
    ].join('\n');
  }

  console.log(`[KeeperHub] Sending execution result to Discord...`);
  await patchKeeperHubWorkflowAndTrigger(message, sessionId);
}
