import { fetchCredentials } from "./credential-helper";

const KEEPERHUB_API_BASE = "https://app.keeperhub.com/api";
const WORKFLOW_ID = process.env.KEEPERHUB_WORKFLOW_ID || "6k8kkgb8v5gqh7gquriql";
const DISCORD_INTEGRATION_ID = process.env.KEEPERHUB_DISCORD_ID || "libp44j88ukrimww72zac";
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || "https://swarmex.onrender.com";

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1499859318776926410/SOsuh7YvCMzOSgQa0hv8QNTyKR4M6yEL8J6LMv8PKpqoihAWLLd0cdFtJFQLKz00s49T";

async function sendDiscordMessage(content: string): Promise<boolean> {
  try {
    const res = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    return res.ok;
  } catch (err: any) {
    console.error('[Discord] Webhook failed:', err.message);
    return false;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function notifyKeeperHubOfNewSession(sessionId: string): Promise<void> {
  // We no longer need to notify KeeperHub of the session start manually here, 
  // as server.ts handles the acknowledgment directly now.
  console.log(`[KeeperHub] New session registered: ${sessionId}`);
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

  console.log(`[Discord] Sending execution result to Webhook...`);
  await sendDiscordMessage(message);
}
