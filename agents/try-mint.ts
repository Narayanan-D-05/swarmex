const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
import { createPublicClient, createWalletClient, http, defineChain, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const baseSepolia = defineChain({
  id: 84532, name: 'Base Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] } },
});

const USDC_ADDR = (process.env.SEPOLIA_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`;
const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);

const abi = parseAbi([
  'function mint(address to, uint256 amount) returns (bool)',
  'function mint(uint256 amount)',
  'function faucet()',
  'function owner() view returns (address)',
  'function symbol() view returns (string)',
]);

async function tryMint() {
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() });

  console.log('Testing USDC at:', USDC_ADDR);
  
  try {
    const symbol = await publicClient.readContract({ address: USDC_ADDR, abi, functionName: 'symbol' });
    console.log('Symbol:', symbol);
  } catch (e) {
    console.log('Not a standard token?', e.message);
  }

  // Try standard mint(address, uint)
  try {
    const sim = await publicClient.simulateContract({
      address: USDC_ADDR, abi, functionName: 'mint', args: [account.address, 1000000000n], account
    });
    console.log('Simulation passed for mint(address, uint)');
    const tx = await walletClient.writeContract(sim.request);
    console.log('Mint tx:', tx);
    return;
  } catch (e) {
    console.log('Failed mint(address, uint):', e.message.substring(0, 50));
  }
}
tryMint().catch(console.error);
