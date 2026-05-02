import { createPublicClient, http, defineChain } from 'viem';

const ogTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
});

const client = createPublicClient({ chain: ogTestnet, transport: http() });

async function main() {
  const hash = process.argv[2] as `0x${string}`;
  if (!hash) {
    console.log('Provide a hash');
    return;
  }

  const tx = await client.getTransaction({ hash });
  
  try {
    await client.call({
      account: tx.from,
      to: tx.to,
      data: tx.input,
      value: tx.value,
      blockNumber: tx.blockNumber ? tx.blockNumber - 1n : undefined
    });
    console.log('Call succeeded in simulation! This is strange if it reverted on-chain.');
  } catch (e: any) {
    console.log('Revert Reason:', e.message);
    if (e.data) console.log('Revert Data:', e.data);
  }
}
main();
