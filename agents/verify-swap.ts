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
    hash: '0x5e0a2ad1eafc2ff3e6e9ec326227ebc42efcdb00b138ab341903c7cf30783081'
  });
  console.log('=== SWAP TX RESULT ===');
  console.log('Status:', receipt.status);
  console.log('Block:', receipt.blockNumber.toString());
  console.log('Gas Used:', receipt.gasUsed.toString());
  console.log('Logs count:', receipt.logs.length);
  if (receipt.status === 'success') {
    console.log('\n✅ SWAP CONFIRMED ON-CHAIN!');
  } else {
    console.log('\n❌ SWAP REVERTED ON-CHAIN');
  }
}
main();
