import { createPublicClient, http } from 'viem';
const client = createPublicClient({ transport: http('https://evmrpc-testnet.0g.ai') });
async function main() {
  const receipt = await client.getTransactionReceipt({ hash: '0x7b41d8ae77bb396b9de527d0f14e81d2fe1d9d62fc3a2e5f9621088da095f6d9' });
  console.log('Status:', receipt.status);
}
main();
