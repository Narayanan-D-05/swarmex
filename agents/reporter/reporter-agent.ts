import { ethers } from 'ethers';
import { uploadMemory } from '../shared/0g-storage-client';
import { notifyKeeperHubOfExecution } from '../shared/keeperhub-client';

const REGISTRY_ABI = [
  "function recordExecution(address agentWallet, bool success) external",
  "function agents(address) view returns (address inftAddress, uint256 tokenId, uint8 agentType, uint256 executionCount, uint256 successCount, uint256 reputationBps, bool isRegistered)",
];

export async function runReporter(state: any) {
  const tradeTxHash: string | null = state.txHash || null;
  const success = !state.error && !!tradeTxHash;
  let rootHash: string | null = null;

  // 1. Upload to 0G Storage (non-critical — never block the notification)
  try {
    rootHash = await uploadMemory({ result: success, txHash: tradeTxHash, timestamp: Date.now() });
    console.log(`[Reporter] 0G Storage upload complete. Root: ${rootHash}`);
  } catch (storageErr: any) {
    console.error(`[Reporter] 0G Storage upload failed (non-fatal): ${storageErr.message}`);
    // Continue — txHash is still valid even if storage failed
  }

  // 2. Update AgentRegistry on 0G Chain (non-critical)
  let registryTxHash: string | null = null;
  if (process.env.AGENT_PRIVATE_KEY && process.env.AGENT_REGISTRY_ADDRESS) {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai');
      const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
      const registry = new ethers.Contract(process.env.AGENT_REGISTRY_ADDRESS, REGISTRY_ABI, wallet);

      const agentRecord = await registry.agents(wallet.address);
      if (!agentRecord.isRegistered) {
        console.warn(`[Reporter] Agent ${wallet.address} not registered in AgentRegistry. Skipping recordExecution.`);
      } else {
        const tx = await registry.recordExecution(wallet.address, success);
        const receipt = await tx.wait();
        registryTxHash = receipt.hash;
        console.log(`[Reporter] AgentRegistry updated on 0G Chain. Tx: ${registryTxHash}`);
      }
    } catch (registryErr: any) {
      console.error(`[Reporter] AgentRegistry update failed (non-fatal): ${registryErr.message}`);
    }
  }

  // 3. Always notify KeeperHub with all available data (this must never fail silently)
  try {
    await notifyKeeperHubOfExecution(
      state.sessionId,
      success ? 'success' : 'failed',
      {
        txHash: tradeTxHash ?? registryTxHash ?? undefined,
        rootHash: rootHash ?? undefined,
        error: state.error
      }
    );
  } catch (notifyErr: any) {
    console.error(`[Reporter] KeeperHub notification failed: ${notifyErr.message}`);
  }

  const summaryParts = [
    tradeTxHash ? `Trade Tx: ${tradeTxHash}` : '',
    rootHash ? `Storage Root: ${rootHash}` : '',
    registryTxHash ? `Registry Tx: ${registryTxHash}` : ''
  ].filter(Boolean);

  return {
    messages: [{ role: 'reporter', content: summaryParts.join(' | ') || 'Reporter completed.' }]
  };
}
