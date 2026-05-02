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
  const usdc = '0xf4131cC0a6E8a482dfeF634001E43c07dD1f82f8';
  const user = '0x7eb0a26dc2422675a53dbfcc9cf72eab4570f620';
  const router = '0x1c4cfBA34dF0bcab018d9f174aCDd2aeAb74A4f2';
  const abi = parseAbi(['function allowance(address, address) view returns (uint256)']);
  const allowance = await client.readContract({ address: usdc as `0x${string}`, abi, functionName: 'allowance', args: [user as `0x${string}`, router as `0x${string}`] });
  console.log('Allowance:', allowance.toString());
}
main();
