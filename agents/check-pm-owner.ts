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
  const pm = process.env.POOL_MANAGER_ADDRESS_OG as `0x${string}`;
  console.log('Checking PM:', pm);

  try {
    const owner = await client.readContract({
      address: pm,
      abi: parseAbi(['function owner() view returns (address)']),
      functionName: 'owner'
    });
    console.log('PM Owner:', owner);
    
    const user = '0x7Eb0A26Dc2422675a53DbFcC9CF72EAb4570f620';
    console.log('Current Executor:', user);
    console.log('Is Owner?', owner.toLowerCase() === user.toLowerCase());
  } catch (e: any) {
    console.log('PM has no owner() function or call failed:', e.message.slice(0, 50));
  }
}
main();
