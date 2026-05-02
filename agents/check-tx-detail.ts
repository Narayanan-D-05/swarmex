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
  const tx = await client.getTransaction({ hash: '0x3210ebf41c21b6e07bdc5d9c2e0a0728cafdb29d142e4ad5dbb8fa1ddc3a395d' });
  console.log('TX To:', tx.to);
  console.log('TX Nonce:', tx.nonce);
}
main();
