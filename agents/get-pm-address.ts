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
  const pst = process.env.POOL_SWAP_TEST_ADDRESS as `0x${string}`;
  console.log('PoolSwapTest:', pst);

  const pm = await client.readContract({
    address: pst,
    abi: parseAbi(['function manager() view returns (address)']),
    functionName: 'manager'
  });

  console.log('Real PoolManager Address:', pm);
}
main();
