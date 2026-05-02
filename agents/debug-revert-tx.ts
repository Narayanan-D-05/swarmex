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
  const hash = '0x91be4bb845dcf06429723a64612d11befff3b4428f822d2d8ed0260ca9883765';
  console.log('Fetching tx:', hash);
  
  try {
    const tx = await client.getTransaction({ hash });
    console.log('Simulating tx...');
    await client.call({
      account: tx.from,
      data: tx.input,
      to: tx.to,
      value: tx.value,
      blockNumber: tx.blockNumber - 1n
    });
    console.log('Simulation success (unexpected!)');
  } catch (e: any) {
    console.error('Simulation failed with error:');
    console.error(e.message);
    const data = e.data || e.error?.data || e.details?.data;
    if (data) {
      console.log('Revert Data:', data);
    } else {
      // Try to get data via eth_call
      try {
        await client.call({
          account: tx.from,
          data: tx.input,
          to: tx.to,
          value: tx.value,
          blockNumber: tx.blockNumber - 1n
        });
      } catch (callErr: any) {
         console.log('Call Error Data:', callErr.data || callErr.error?.data);
      }
    }
  }
}
main();
