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
  // Get a recent block to check block gas limit
  const block = await client.getBlock({ blockTag: 'latest' });
  console.log('Block gas limit:', block.gasLimit.toString());
  console.log('Block gas used:', block.gasUsed.toString());
  
  // Get the full transaction to see what gasLimit was submitted
  const tx = await client.getTransaction({ 
    hash: '0x8ff4e74a303d1bdd97a55df3e97306302d937b8d8cbdf0d9dcf6f0daf6ce5c73' 
  });
  console.log('\nTransaction gasLimit (what was sent):', tx.gas?.toString());
  console.log('Transaction gasPrice:', tx.gasPrice?.toString());
  console.log('Transaction type:', tx.type);
}
main();
