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

const POOL_MANAGER = process.env.POOL_MANAGER_ADDRESS_OG;

async function main() {
  const manager = await client.readContract({
    address: '0xBed23C151BA1e138B08DcD128dAaC587C2E1F124',
    abi: [{ "name": "manager", "outputs": [{ "type": "address" }], "type": "function", "stateMutability": "view" }],
    functionName: 'manager'
  });
  console.log('PST Manager:', manager);
  console.log('Expected Manager:', POOL_MANAGER);
}
main();
