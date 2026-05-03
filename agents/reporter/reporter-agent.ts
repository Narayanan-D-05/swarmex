import { ethers } from 'ethers';
import { uploadMemory } from '../shared/0g-storage-client';
import { notifyKeeperHubOfExecution } from '../shared/keeperhub-client';

const REGISTRY_ABI = [
  'function recordExecution(address agentWallet, bool success) external',
  'function agents(address) view returns (address inftAddress, uint256 tokenId, uint8 agentType, uint256 executionCount, uint256 successCount, uint256 reputationBps, bool isRegistered)',
];

// Explorer URLs
const BASE_SEPOLIA_SCAN = 'https://sepolia.basescan.org/tx';
const OG_SCAN           = 'https://chainscan-galileo.0g.ai/tx';
const OG_STORAGE_SCAN   = 'https://storagescan-galileo.0g.ai';

export async function runReporter(state: any) {
  const tradeTxHash: string | null = state.txHash || null;
  const chain:       string         = state.chain  || 'base-sepolia';
  const success = !state.error && !!tradeTxHash;
  let rootHash:       string | null = null;
  let storageTxHash:  string | null = null;
  let registryTxHash: string | null = null;

  // ── 1. Upload execution log to 0G Storage ────────────────────────────────
  try {
    const uploadRes = await uploadMemory({
      result:      success,
      txHash:      tradeTxHash,
      chain,
      timestamp:   Date.now(),
      intent:      state.intent,
      parsedIntent: state.parsedIntent,
      riskParams:  state.learningParams,
    });
    rootHash = uploadRes.rootHash;
    storageTxHash = uploadRes.txHash;
    console.log(`[Reporter] 0G Storage upload complete. Root hash: ${rootHash}`);
  } catch (storageErr: any) {
    console.error(`[Reporter] 0G Storage upload failed (non-fatal): ${storageErr.message}`);
  }

  // ── 2. Record execution on 0G Agent Registry ─────────────────────────────
  if (process.env.AGENT_PRIVATE_KEY && process.env.AGENT_REGISTRY_ADDRESS) {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai');
      const wallet   = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
      const registry = new ethers.Contract(process.env.AGENT_REGISTRY_ADDRESS, REGISTRY_ABI, wallet);

      const agentRecord = await registry.agents(wallet.address);
      if (!agentRecord.isRegistered) {
        console.warn(`[Reporter] Agent not registered in AgentRegistry. Skipping recordExecution.`);
      } else {
        const tx    = await registry.recordExecution(wallet.address, success);
        const receipt = await tx.wait();
        registryTxHash = receipt.hash;
        console.log(`[Reporter] AgentRegistry updated on 0G Chain. Tx: ${registryTxHash}`);
      }
    } catch (registryErr: any) {
      console.error(`[Reporter] AgentRegistry update failed (non-fatal): ${registryErr.message}`);
    }
  }

  // ── 3. Notify KeeperHub (fires Discord with links) ────────────────────────
  try {
    const computeStr = state.parsedIntent ? JSON.stringify(state.parsedIntent) : undefined;
    await notifyKeeperHubOfExecution(
      state.sessionId,
      success ? 'success' : 'failed',
      {
        txHash:          tradeTxHash ?? undefined,
        rootHash:        rootHash    ?? undefined,
        storageTxHash:   storageTxHash ?? undefined,
        registryTxHash:  registryTxHash ?? undefined,
        computeResult:   computeStr,
        error:           state.error,
      },
    );
  } catch (notifyErr: any) {
    console.error(`[Reporter] KeeperHub notification failed: ${notifyErr.message}`);
  }

  // ── 4. Build summary with 3 verifiable links ─────────────────────────────
  const summaryParts: string[] = [];

  if (tradeTxHash) {
    // Link 1: The actual swap on Base Sepolia (Uniswap v4)
    summaryParts.push(`Swap confirmed on Uniswap v4 (Base Sepolia): ${BASE_SEPOLIA_SCAN}/${tradeTxHash}`);
  }
  if (rootHash) {
    // Link 2: 0G decentralized storage proof
    summaryParts.push(`0G Storage proof (execution log): ${OG_STORAGE_SCAN} | Root hash: ${rootHash}`);
  }
  if (registryTxHash) {
    // Link 3: 0G Agent Registry update
    summaryParts.push(`0G Agent Registry updated: ${OG_SCAN}/${registryTxHash}`);
  }

  const summaryContent = summaryParts.length > 0
    ? summaryParts.join('\n')
    : success
      ? 'Trade completed successfully.'
      : `Execution failed: ${state.error || 'unknown error'}`;

  return {
    txHash:    tradeTxHash,
    chain,
    rootHash,
    storageTxHash,
    registryTxHash,
    messages: [{ role: 'reporter', content: summaryContent }],
  };
}
