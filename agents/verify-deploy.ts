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
  const c1 = await client.getBytecode({ address: '0xf4131cC0a6E8a482dfeF634001E43c07dD1f82f8' });
  const c2 = await client.getBytecode({ address: '0xBed23C151BA1e138B08DcD128dAaC587C2E1F124' });
  const c3 = await client.getBytecode({ address: '0x1c4cfBA34dF0bcab018d9f174aCDd2aeAb74A4f2' });
  console.log('MockUSDC length:', c1 ? c1.length : 'NULL');
  console.log('PoolSwapTest length:', c2 ? c2.length : 'NULL');
  console.log('PoolModifyLiquidityTest length:', c3 ? c3.length : 'NULL');
}
main();
