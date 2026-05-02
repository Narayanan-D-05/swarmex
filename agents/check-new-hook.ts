import { createPublicClient, http, defineChain } from 'viem';

const ogTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
});
const client = createPublicClient({ chain: ogTestnet, transport: http() });

async function main() {
  const code = await client.getBytecode({ address: '0x45748D4a3f037a21F32A00F455e2C026436d80c0' });
  console.log('Hook bytecode length:', code?.length ?? 'NOT DEPLOYED');
  
  const receipt = await client.getTransactionReceipt({ hash: '0xa5549cd9e03c4207f9e5ce617c2dd835108351e3ceb7b7d7b2a1c15c1be7fd6e' });
  console.log('Deploy TX status:', receipt.status);
}
main();
