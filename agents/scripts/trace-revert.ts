import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

async function traceTx() {
  const hash = '0x83e91b76be390ee80cc821b56212d16d6e4b9b07b0e1d89c6684f237d56a0265';
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
  try {
    const tx = await client.getTransaction({ hash: hash as `0x${string}` });
    console.log('TX found');
    const call = await client.call({
      account: tx.from,
      to: tx.to!,
      data: tx.input,
      value: tx.value,
      blockNumber: tx.blockNumber! - 1n
    });
    console.log('Call result:', call);
  } catch (e: any) {
    console.error('Revert reason:', e.message);
  }
}

traceTx();
