const KEEPERHUB_API_BASE = "https://app.keeperhub.com/api";
const WORKFLOW_ID = process.env.KEEPERHUB_WORKFLOW_ID || "6k8kkgb8v5gqh7gquriql";
const WEBHOOK_URL = process.env.KEEPERHUB_WEBHOOK_TRIGGER_URL || `${KEEPERHUB_API_BASE}/workflows/${WORKFLOW_ID}/webhook`;
const KEEPERHUB_API_KEY = process.env.KEEPERHUB_API;

async function triggerKeeperHubWebhook(payload: any) {
  if (!WEBHOOK_URL) {
    console.warn('[KeeperHub] No webhook URL configured, skipping notification.');
    return;
  }
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': KEEPERHUB_API_KEY ? `Bearer ${KEEPERHUB_API_KEY}` : ''
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error(`[KeeperHub] Webhook failed: ${res.status} ${await res.text()}`);
    }
  } catch (err: any) {
    console.error('[KeeperHub] Webhook error:', err.message);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function notifyKeeperHubOfNewSession(sessionId: string, intent?: string): Promise<void> {
  console.log(`[KeeperHub] Notifying of new session: ${sessionId}`);
  await triggerKeeperHubWebhook({
    type: 'session_start',
    sessionId,
    intent,
    message: `🚀 **SwarmEx Session Started**\nAnalyzing: \`${intent || 'Unknown'}\``
  });
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
    if (txHash) {
      lines.push(`⚡ **Uniswap v4 Swap (Base Sepolia)**`);
      lines.push(`https://sepolia.basescan.org/tx/${txHash}`);
      lines.push(``);
    }
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
    if (computeResult) {
      lines.push(`🧠 **0G Compute Inference**`);
      lines.push(`_Result: ${computeResult.slice(0, 500)}_`);
      lines.push(`https://chainscan-galileo.0g.ai/address/${process.env.OG_COMPUTE_PROVIDER}`);
      lines.push(``);
    }
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

  console.log(`[KeeperHub] Sending execution result to Webhook...`);
  await triggerKeeperHubWebhook({
    type: 'execution_result',
    sessionId,
    status,
    message
  });
}
