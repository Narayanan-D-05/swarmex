import { ethers } from 'ethers';

// Bug #15 fix: EXACT match to SwarmExecutorHook.sol
const domain = {
  name: 'SwarmExecutorHook',
  version: '1',
  chainId: BigInt(process.env.OG_CHAIN_ID || 16602),
  verifyingContract: process.env.HOOK_ADDRESS as `0x${string}` // Bug #20: Must be set!
};

const types = {
  RiskAttestation: [
    { name: 'sessionWallet', type: 'address' },
    { name: 'tokenIn', type: 'address' },
    { name: 'tokenOut', type: 'address' },
    { name: 'maxSlippageBps', type: 'uint256' },
    { name: 'maxAmountIn', type: 'uint256' },
    { name: 'expiresAt', type: 'uint256' },
    { name: 'swarmConsensusHash', type: 'bytes32' }
  ]
};

export async function signRiskAttestation(
  riskAgentPrivateKey: string,
  attestation: Record<string, any>
) {
  const wallet = new ethers.Wallet(riskAgentPrivateKey);
  return wallet.signTypedData(domain, types, attestation);
}
