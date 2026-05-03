const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
import { createPublicClient, http, defineChain, parseAbi } from 'viem';

const baseSepolia = defineChain({
  id: 84532, name: 'Base Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] } },
});

const POOL_MANAGER = (process.env.POOL_MANAGER_ADDRESS || '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408') as `0x${string}`;
const NATIVE_ETH   = '0x0000000000000000000000000000000000000000' as `0x${string}`;
const USDC_ADDR    = (process.env.SEPOLIA_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`;
const WETH_ADDR    = '0x4200000000000000000000000000000000000006' as `0x${string}`;

const POOL_MANAGER_ABI = parseAbi([
  'function getPoolId((address,address,uint24,int24,address)) pure returns (bytes32)',
  'function getSlot0(bytes32 id) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)'
]);

async function checkPools() {
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

  const currencyPairs = [
    { name: 'ETH / USDC', c0: NATIVE_ETH, c1: USDC_ADDR },
    { name: 'WETH / USDC', c0: USDC_ADDR, c1: WETH_ADDR }, // Lexicographical sort: USDC is 0x036, WETH is 0x420
    { name: 'WETH / ETH', c0: NATIVE_ETH, c1: WETH_ADDR }
  ];
  const fees = [
    { fee: 100, tickSpacing: 1 },
    { fee: 500, tickSpacing: 10 },
    { fee: 3000, tickSpacing: 60 },
    { fee: 10000, tickSpacing: 200 }
  ];

  for (const pair of currencyPairs) {
    for (const f of fees) {
      const poolKey = {
        currency0: pair.c0,
        currency1: pair.c1,
        fee: f.fee,
        tickSpacing: f.tickSpacing,
        hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      };
      
      try {
        const poolId = await publicClient.readContract({
          address: POOL_MANAGER,
          abi: POOL_MANAGER_ABI,
          functionName: 'getPoolId',
          args: [poolKey]
        });

        const slot0 = await publicClient.readContract({
          address: POOL_MANAGER,
          abi: POOL_MANAGER_ABI,
          functionName: 'getSlot0',
          args: [poolId]
        });

        const sqrtPriceX96 = slot0[0];
        if (sqrtPriceX96 > 0n) {
          console.log(`✅ INITIALIZED: ${pair.name} | fee: ${f.fee} | poolId: ${poolId} | sqrtPriceX96: ${sqrtPriceX96}`);
        } else {
          // Uninitialized
        }
      } catch (err) {
        // Error
      }
    }
  }
  console.log("Check complete.");
}

checkPools().catch(console.error);
