import { ethers } from 'ethers';
import { uploadMemory } from '../shared/0g-storage-client';
import { notifyKeeperHubOfExecution } from '../shared/keeperhub-client';

export async function runReporter(state: any) {
  try {
    const success = !state.error && !!state.txHash;
    const rootHash = await uploadMemory({ result: success, txHash: state.txHash, timestamp: Date.now() });

    // Notifying registry on 0G (REAL IMPLEMENTATION)
    if (!process.env.AGENT_PRIVATE_KEY) throw new Error("AGENT_PRIVATE_KEY is missing");
    if (!process.env.AGENT_REGISTRY_ADDRESS) throw new Error("AGENT_REGISTRY_ADDRESS is missing");

    const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai');
    const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
    
    const abi = ["function recordExecution(address agentWallet, bool success) external"];
    const registry = new ethers.Contract(process.env.AGENT_REGISTRY_ADDRESS, abi, wallet);
    
    // Using the current wallet as the reporter agent
    const tx = await registry.recordExecution(wallet.address, success);
    const receipt = await tx.wait();

    // Notify KeeperHub of success
    await notifyKeeperHubOfExecution(state.sessionId, 'success', { txHash: receipt.hash, rootHash });

    return {
      messages: [{ role: 'reporter', content: `Sync to 0G Chain complete. Tx: ${receipt.hash} | Storage Root: ${rootHash}` }]
    };
  } catch (err: any) {
    // Notify KeeperHub of failure
    await notifyKeeperHubOfExecution(state.sessionId, 'failed', { error: err.message });
    
    return { error: err.message, messages: [{ role: 'reporter', content: 'Sync failed: ' + err.message }] };
  }
}
