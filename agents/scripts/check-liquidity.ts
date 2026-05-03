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

  const usdcAddress  = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
  const poolManager  = '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408';

  const balanceAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);
  const balance = await publicClient.readContract({
    address:      usdcAddress as `0x${string}`,
    abi:          balanceAbi,
    functionName: 'balanceOf',
    args:         [poolManager as `0x${string}`],
  });

  console.log(`[Diagnostic] PoolManager USDC Balance: ${balance.toString()}`);
  console.log(`[Diagnostic] Is balance > 0? ${balance > 0n}`);
}

checkLiquidity();
