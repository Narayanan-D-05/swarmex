import { createPublicClient, http } from 'viem';

const client = createPublicClient({ transport: http('https://evmrpc-testnet.0g.ai') });

async function main() {
  const hash = process.argv[2] as `0x${string}`;
  if (!hash) {
    console.log('Provide a hash');
    return;
  }
  const receipt = await client.getTransactionReceipt({ hash });
  console.log(receipt);
}
main();
