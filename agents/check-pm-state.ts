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
  try {
      const isEnabled = await client.readContract({
        address: POOL_MANAGER,
        abi: [{ "name": "protocolFeesEnabled", "outputs": [{ "type": "bool" }], "type": "function", "stateMutability": "view" }],
        functionName: 'protocolFeesEnabled'
      });
      console.log('Protocol Fees Enabled:', isEnabled);
  } catch(e) {
      console.log('protocolFeesEnabled not found or error');
  }
}
main();
