import { uploadMemory, downloadMemory } from './0g-storage-client';

// In-memory active sessions (loaded from 0G on startup if crashed)
export const activeSessions = new Map<string, any>();

// Bug #8 fix: persist state to 0G Storage after every graph step
export async function persistSessionState(sessionId: string, state: any) {
  activeSessions.set(sessionId, state);
  const rootHash = await uploadMemory({ sessionId, state, timestamp: Date.now() });
  // In a full implementation, we'd write this rootHash to a local DB or 0G Chain registry
  // so we can recover it on reboot.
  console.log(`[Store] Session ${sessionId} saved to 0G: ${rootHash}`);
  return rootHash;
}

export async function recoverSessionState(rootHash: string) {
  const data = await downloadMemory(rootHash);
  if (data && data.sessionId) {
    activeSessions.set(data.sessionId as string, data.state);
  }
  return data;
}
