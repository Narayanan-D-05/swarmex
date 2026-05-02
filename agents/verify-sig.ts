import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  console.log('=== DOMAIN VERIFICATION ===');
  console.log('HOOK_ADDRESS in .env:', process.env.HOOK_ADDRESS);
  console.log('OG_CHAIN_ID:', process.env.OG_CHAIN_ID);
  
  const domain = {
    name: 'SwarmExecutorHook',
    version: '1',
    chainId: BigInt(process.env.OG_CHAIN_ID || 16602),
    verifyingContract: process.env.HOOK_ADDRESS as string
  };
  
  console.log('Domain verifyingContract:', domain.verifyingContract);
  
  // Build attestation
  const amountIn = parseEther('0.001');
  const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);
  const attestation = {
    sessionWallet: account.address,
    tokenIn: '0x0000000000000000000000000000000000000000',
    tokenOut: process.env.USDC_ADDRESS,
    maxSlippageBps: 100,
    maxAmountIn: amountIn.toString(),
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    swarmConsensusHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
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
  
  const wallet = new ethers.Wallet(process.env.RISK_AGENT_PRIVATE_KEY!);
  console.log('Risk agent address:', wallet.address);
  
  const sig = await wallet.signTypedData(domain, types, attestation);
  console.log('Signature:', sig.slice(0, 30) + '...');
  
  // Now recover it locally using ethers
  const recovered = ethers.verifyTypedData(domain, types, attestation, sig);
  console.log('Recovered address (local):', recovered);
  console.log('Matches risk agent?', recovered.toLowerCase() === wallet.address.toLowerCase());
}
main();
