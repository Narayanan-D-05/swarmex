// Bug #11 fix: KeeperHub does not currently have a REST API for programmatic workflow creation.
// Workflows must be manually created at https://app.keeperhub.com.
// This client triggers the created webhook manually if needed, or notifies the system.

export async function notifyKeeperHubOfNewSession(sessionId: string) {
  const webhookUrl = process.env.KEEPERHUB_WEBHOOK_TRIGGER_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'swarm_started', sessionId })
    });
    console.log(`[KeeperHub] Notified webhook of new session: ${sessionId}`);
  } catch (err) {
    console.error(`[KeeperHub] Webhook failed:`, err);
  }
}
