import { createPublicClient, http, defineChain, parseAbi } from 'viem';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ogTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
});

const client = createPublicClient({ chain: ogTestnet, transport: http() });

async function main() {
  const pm = process.env.POOL_MANAGER_ADDRESS_OG as `0x${string}`;
  const poolId = '0x59200ed99fbeb9bf4341acffcd4594567930bf6c6e149f41ec02a0c7032e6705' as `0x${string}`;
  
  const abi = parseAbi([
    'function pools(bytes32 id) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)'
  ]);

  try {
    const data = await client.readContract({
      address: pm,
      abi,
      functionName: 'pools',
      args: [poolId]
    });
    console.log('Pool State:', data);
  } catch (e: any) {
    console.error('pools() failed:', e.message);
  }
}
main();
