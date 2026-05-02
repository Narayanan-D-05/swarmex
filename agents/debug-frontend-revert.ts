import { createPublicClient, http, defineChain, decodeErrorResult } from 'viem';
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

const WrappedErrorABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "target", "type": "address" },
      { "internalType": "bytes4", "name": "selector", "type": "bytes4" },
      { "internalType": "bytes", "name": "reason", "type": "bytes" }
    ],
    "name": "WrappedError",
    "type": "error"
  }
];

async function main() {
  const hash = '0xe236c03e3778f4061553bc3811275e5f22d05b37b15a7086728573f22a4097cc';
  const tx = await client.getTransaction({ hash });
  
  try {
    const callData = {
      account: tx.from,
      to: tx.to as `0x${string}`,
      data: tx.input,
      value: tx.value,
    };
    await client.call(callData);
    console.log('Simulation succeeded? That is unexpected.');
  } catch (e: any) {
    const errorData = e.data || e.walk?.()?.data || e.error?.data;
    console.log('Error Data:', errorData);
    if (errorData) {
      try {
        const decoded = decodeErrorResult({
          abi: WrappedErrorABI,
          data: errorData
        });
        console.log('Decoded WrappedError:');
        console.log('Target:', decoded.args[0]);
        console.log('Selector:', decoded.args[1]);
        const reason = decoded.args[2] as `0x${string}`;
        if (reason.startsWith('0x08c379a0')) {
             console.log('Inner Reason (Hex):', reason);
        } else {
             console.log('Inner Reason (Hex):', reason);
        }
      } catch (err) {
        console.log('Failed to decode as WrappedError:', err);
      }
    }
  }
}
main();
