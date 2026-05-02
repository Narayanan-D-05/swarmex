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

const HOOK = process.env.HOOK_ADDRESS as `0x${string}`;

async function main() {
  const bytecode = await client.getBytecode({ address: HOOK });
  console.log('Hook Address:', HOOK);
  console.log('Hook Bytecode length:', bytecode ? bytecode.length : 'NULL');
}
main();
