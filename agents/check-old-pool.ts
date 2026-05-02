import { createPublicClient, http, defineChain, parseAbi } from 'viem';
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
  const pm = '0x0c3970a25d85Fb45BcFfB064223d69361de641D1';
  const usdc = '0x752E55F5EB2f1Cf5043a950f5E11AE513FCb475d';
  const hook = '0x12d2e176F68b51C129679429f4D995cFE62C80C0';
  
  const poolKey = {
    currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    currency1: usdc as `0x${string}`,
    fee: 3000,
    tickSpacing: 120,
    hooks: hook as `0x${string}`
  };

  const poolId = '0x81518f8e089228801d0001007812d2e176f68b51c129679429f4d995cfe62c80c0'; // This needs to be calculated correctly

  console.log('Checking Pool:', poolId);
  try {
    const slot0 = await client.readContract({
      address: pm as `0x${string}`,
      abi: parseAbi(['function pools(bytes32) view returns (uint160, int24, uint24, uint24)']),
      functionName: 'pools',
      args: [poolId as `0x${string}`]
    });
    console.log('Slot0:', slot0);
  } catch (e: any) {
    console.log('Read failed:', e.message.slice(0, 100));
  }
}
main();
