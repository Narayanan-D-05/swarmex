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
  const hook = process.env.HOOK_ADDRESS as `0x${string}`;
  const abi = parseAbi(['function poolManager() view returns (address)']);
  
  try {
    const pm = await client.readContract({
      address: hook,
      abi: parseAbi(['function manager() view returns (address)']),
      functionName: 'manager'
    });
    console.log(`Hook's PoolManager: ${pm}`);
    console.log(`Env's PoolManager: ${process.env.POOL_MANAGER_ADDRESS_OG}`);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}
main();
