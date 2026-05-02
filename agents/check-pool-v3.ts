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
const USDC = process.env.USDC_ADDRESS as `0x${string}`;
const HOOK = process.env.HOOK_ADDRESS as `0x${string}`;

async function main() {
    const pmAbi = [{
        "inputs": [{ "name": "id", "type": "bytes32" }],
        "name": "getSqrtPriceX96",
        "outputs": [{ "name": "sqrtPriceX96", "type": "uint160" }],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [
            { "name": "currency0", "type": "address" },
            { "name": "currency1", "type": "address" },
            { "name": "fee", "type": "uint24" },
            { "name": "tickSpacing", "type": "int24" },
            { "name": "hooks", "type": "address" }
        ],
        "name": "getPoolId",
        "outputs": [{ "name": "id", "type": "bytes32" }],
        "stateMutability": "pure",
        "type": "function"
    }];

    try {
        const id = await client.readContract({
            address: POOL_MANAGER,
            abi: pmAbi,
            functionName: 'getPoolId',
            args: ['0x0000000000000000000000000000000000000000', USDC, 3000, 60, HOOK]
        });
        console.log('Pool ID:', id);

        const price = await client.readContract({
            address: POOL_MANAGER,
            abi: pmAbi,
            functionName: 'getSqrtPriceX96',
            args: [id]
        });
        console.log('SqrtPriceX96:', price.toString());
    } catch (e: any) {
        console.log('Error or not initialized:', e.message);
    }
}
main();
