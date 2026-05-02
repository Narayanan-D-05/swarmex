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

const POOL_MANAGER = process.env.POOL_MANAGER_ADDRESS_OG as `0x${string}`;

async function main() {
  try {
    const price = await client.readContract({
        address: POOL_MANAGER,
        abi: [{
            "inputs": [{ "name": "id", "type": "bytes32" }],
            "name": "getSqrtPriceX96",
            "outputs": [{ "name": "sqrtPriceX96", "type": "uint160" }],
            "stateMutability": "view",
            "type": "function"
        }],
        functionName: 'getSqrtPriceX96',
        args: ['0xb885647f572735c01c507d1f579350482cb5c6c4dad1d0c840bed52fbd0fffec']
    });
    console.log('SqrtPriceX96:', price.toString());
  } catch (e: any) {
    console.log('Price check failed:', e.message);
  }
}
main();
