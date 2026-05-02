import { createPublicClient, http, defineChain } from 'viem';
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
  const hook = process.env.HOOK_ADDRESS;
  const pm = process.env.POOL_MANAGER_ADDRESS_OG;
  const pst = process.env.POOL_SWAP_TEST_ADDRESS;
  const usdc = process.env.USDC_ADDRESS;

  console.log('--- Bytecode Check ---');
  for (const [name, addr] of Object.entries({ Hook: hook, PM: pm, PST: pst, USDC: usdc })) {
    const code = await client.getBytecode({ address: addr as `0x${string}` });
    console.log(`${name} (${addr}): ${code ? 'HAS CODE' : 'EMPTY'}`);
  }
}
main();
