export async function notifyKeeperHubOfNewSession(sessionId: string) {
  const webhookUrl = process.env.KEEPERHUB_WEBHOOK_TRIGGER_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        event: 'swarm_started', 
        sessionId,
        timestamp: new Date().toISOString(),
        message: `🚀 SwarmEx autonomous session started: ${sessionId}`
      })
    });
  } catch (err) {
    console.error(`[KeeperHub] Notification failed:`, err);
  }
}

export async function notifyKeeperHubOfExecution(sessionId: string, status: 'success' | 'failed', details: any) {
  const webhookUrl = process.env.KEEPERHUB_WEBHOOK_TRIGGER_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        event: 'execution_result', 
        sessionId,
        status,
        txHash: details.txHash,
        rootHash: details.rootHash,
        timestamp: new Date().toISOString(),
        message: status === 'success' 
          ? `✅ Trade Executed! Tx: ${details.txHash}` 
          : `❌ Trade Failed: ${details.error}`
      })
    });
    console.log(`[KeeperHub] Reported execution result to dashboard`);
  } catch (err) {
    console.error(`[KeeperHub] Execution report failed:`, err);
  }
}
