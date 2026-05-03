import { createPublicClient, http, parseAbi, defineChain } from 'viem';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] },
  },
});

async function checkLiquidity() {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
  });

  const usdcAddress  = process.env.SEPOLIA_USDC_ADDRESS;
  const poolManager  = process.env.POOL_MANAGER_ADDRESS;

  if (!usdcAddress || !poolManager) {
    console.log("Missing env vars!");
    return;
  }

  const balanceAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);
  try {
    const balance = await publicClient.readContract({
      address:      usdcAddress as `0x${string}`,
      abi:          balanceAbi,
      functionName: 'balanceOf',
      args:         [poolManager as `0x${string}`],
    });
    console.log(`[Diagnostic] Using addresses from .env:`);
    console.log(`USDC: ${usdcAddress}`);
    console.log(`PoolManager: ${poolManager}`);
    console.log(`Balance: ${balance.toString()}`);
  } catch (err: any) {
    console.log(`[Diagnostic] FAILED with .env addresses: ${err.message}`);
  }
}

checkLiquidity();
