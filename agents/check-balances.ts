import { createPublicClient, http, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const client = createPublicClient({ transport: http('https://evmrpc-testnet.0g.ai') });

const pks = [
  '0x06a900f1264a19c5a238503b05e43d70ed8cc19e58283f5073b2204f962ed45d',
  '0xcfde19b7da414b606576198b2fa4fd4ae5ca5ce2a68b9a2ad875dda1b099756c',
  '0x87922ab94b9196a9ce7236703d1aedf2b3d7d62d8536485efa09ac2ad6182742'
];

async function main() {
  for (const pk of pks) {
    const acc = privateKeyToAccount(pk as `0x${string}`);
    const bal = await client.getBalance({ address: acc.address });
    console.log(`${acc.address}: ${formatEther(bal)} 0G`);
  }
}
main();
