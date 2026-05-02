/**
 * register-agent.ts
 * One-time setup: registers the AGENT_PRIVATE_KEY wallet in the AgentRegistry contract.
 * The agent wallet IS the contract owner, so it can call registerAgent() on itself.
 * Run: npx tsx --env-file=../.env scripts/register-agent.ts
 */
import { ethers } from 'ethers';

const REGISTRY_ABI = [
  "function registerAgent(address agentWallet, address inftAddress, uint256 tokenId, uint8 agentType) external",
  "function agents(address) view returns (address inftAddress, uint256 tokenId, uint8 agentType, uint256 executionCount, uint256 successCount, uint256 reputationBps, bool isRegistered)",
  "function owner() view returns (address)",
];

// AgentType enum from AgentRegistry.sol
const AgentType = {
  Orchestrator: 0,
  Research: 1,
  Backtester: 2,
  RiskGuard: 3,
  Executor: 4,
  Reporter: 5,
};

async function main() {
  if (!process.env.AGENT_PRIVATE_KEY) throw new Error('AGENT_PRIVATE_KEY missing');
  if (!process.env.AGENT_REGISTRY_ADDRESS) throw new Error('AGENT_REGISTRY_ADDRESS missing');

  const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai');
  const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
  const registry = new ethers.Contract(process.env.AGENT_REGISTRY_ADDRESS, REGISTRY_ABI, wallet);

  const agentNftAddress = process.env.AGENT_NFT_ADDRESS || ethers.ZeroAddress;
  const agentWallet = wallet.address;

  console.log('=== SwarmEx Agent Registration ===');
  console.log('Registry:', process.env.AGENT_REGISTRY_ADDRESS);
  console.log('Agent Wallet:', agentWallet);
  console.log('Owner:', await registry.owner());

  // Check current status
  const current = await registry.agents(agentWallet);
  if (current.isRegistered) {
    console.log('\n✅ Agent is ALREADY registered.');
    console.log('   Reputation:', current.reputationBps.toString(), 'bps');
    console.log('   Executions:', current.executionCount.toString());
    return;
  }

  console.log('\n⏳ Registering agent as Orchestrator (type 0)...');
  
  // Register the agent wallet as Orchestrator (tokenId=0, no NFT required for testnet)
  const tx = await registry.registerAgent(
    agentWallet,          // agentWallet = the executor wallet
    agentNftAddress,      // inftAddress (use zero address if no NFT minted)
    0n,                   // tokenId = 0 for testnet
    AgentType.Orchestrator
  );

  console.log('Transaction submitted:', tx.hash);
  console.log('Waiting for confirmation...');
  const receipt = await tx.wait();
  console.log('\n✅ Agent registered successfully!');
  console.log('   Block:', receipt.blockNumber);
  console.log('   Tx Hash:', receipt.hash);

  // Verify
  const after = await registry.agents(agentWallet);
  console.log('\nVerification:');
  console.log('   isRegistered:', after.isRegistered);
  console.log('   reputationBps:', after.reputationBps.toString(), '(5000 = 50% starting reputation)');
}

main().catch(console.error);
