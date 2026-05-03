const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
import { createPublicClient, createWalletClient, http, defineChain, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const baseSepolia = defineChain({
  id: 84532, name: 'Base Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] } },
});

const POOL_MANAGER = '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408' as `0x${string}`;
const NATIVE_ETH = '0x0000000000000000000000000000000000000000' as `0x${string}`;
const USDC_ADDR = (process.env.SEPOLIA_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`;
const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);

const POOL_MANAGER_ABI = parseAbi([
  'function initialize((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96, bytes hookData) external returns (int24 tick)'
]);

async function sim() {
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

  const currency0 = NATIVE_ETH < USDC_ADDR.toLowerCase() ? NATIVE_ETH : USDC_ADDR;
  const currency1 = NATIVE_ETH < USDC_ADDR.toLowerCase() ? USDC_ADDR : NATIVE_ETH;

  const poolKey = {
    currency0,
    currency1,
    fee: 3000,
    tickSpacing: 60,
    hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`
  };

  const sqrtPriceX96 = 79228162514264337593543950336n;

  try {
    const sim = await publicClient.simulateContract({
      address: POOL_MANAGER,
      abi: POOL_MANAGER_ABI,
      functionName: 'initialize',
      args: [poolKey, sqrtPriceX96, '0x' as `0x${string}`],
      account
    });
    console.log("Simulation succeeded!", sim.result);
  } catch (err: any) {
    console.log("Simulate failed:", err.message);
    if (err.walk) {
      console.log("Inner message:", err.walk().message);
    }
  }
}
sim().catch(console.error);
