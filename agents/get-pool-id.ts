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
  const hash = '0x87803831b2247979495f3a2d11814fbc04d3f92613927fe70d934ffa1ae29b0e';
  const receipt = await client.getTransactionReceipt({ hash: hash as `0x${string}` });
  console.log('Logs found:', receipt.logs.length);
  if (receipt.logs[0]) {
    console.log('Topics:', receipt.logs[0].topics);
    console.log('PoolId (Topic 1):', receipt.logs[0].topics[1]);
  }
}
main();
