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
  const receipt = await client.waitForTransactionReceipt({
    hash: '0x9fe14006a2d996d5d9af20b3677621cc025096e98365ca527d3870620dc1fad0'
  });
  console.log('Status:', receipt.status);
  console.log('Gas Used:', receipt.gasUsed.toString());
  console.log('Logs:', receipt.logs.length);
}
main();
