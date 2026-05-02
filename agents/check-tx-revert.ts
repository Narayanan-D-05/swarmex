import { createPublicClient, http } from 'viem';
const client = createPublicClient({ transport: http('https://evmrpc-testnet.0g.ai') });
async function main() {
  const tx = await client.getTransaction({ hash: '0x7b41d8ae77bb396b9de527d0f14e81d2fe1d9d62fc3a2e5f9621088da095f6d9' });
  try {
    await client.call({
      account: tx.from,
      to: tx.to,
      data: tx.input,
      value: tx.value,
      gasPrice: tx.gasPrice
    });
    console.log("Call succeeded?!");
  } catch(e) {
    console.log("Revert reason:", e.message);
  }
}
main();
