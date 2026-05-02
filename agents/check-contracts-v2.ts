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

const POOL_MANAGER = process.env.POOL_MANAGER_ADDRESS_OG as `0x${string}`;
const USDC = process.env.USDC_ADDRESS as `0x${string}`;

async function main() {
  const pmBytecode = await client.getBytecode({ address: POOL_MANAGER });
  const usdcBytecode = await client.getBytecode({ address: USDC });
  console.log('PoolManager Address:', POOL_MANAGER);
  console.log('PoolManager Bytecode length:', pmBytecode ? pmBytecode.length : 'NULL');
  console.log('USDC Address:', USDC);
  console.log('USDC Bytecode length:', usdcBytecode ? usdcBytecode.length : 'NULL');
}
main();
