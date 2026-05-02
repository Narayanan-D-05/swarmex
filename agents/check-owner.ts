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
    const owner = await client.readContract({
        address: '0x0c3970a25d85Fb45BcFfB064223d69361de641D1',
        abi: [{ "name": "owner", "outputs": [{ "type": "address" }], "type": "function", "stateMutability": "view" }],
        functionName: 'owner'
    });
    console.log('Owner:', owner);
}
main();
