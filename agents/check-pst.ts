import { createPublicClient, http, defineChain } from 'viem';
const ogTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
});
const client = createPublicClient({ chain: ogTestnet, transport: http() });
async function main() {
  const code = await client.getBytecode({ address: '0xBed23C151BA1e138B08DcD128dAaC587C2E1F124' });
  console.log('PoolSwapTest code length:', code?.length);
}
main();
