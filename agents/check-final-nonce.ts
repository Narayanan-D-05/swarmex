import { createPublicClient, http, defineChain } from 'viem';
const ogTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
});
const client = createPublicClient({ chain: ogTestnet, transport: http() });
async function main() {
  const nonce = await client.getTransactionCount({ address: '0x7Eb0A26Dc2422675a53DbFcC9CF72EAb4570f620' });
  console.log('Final Nonce:', nonce);
}
main();
