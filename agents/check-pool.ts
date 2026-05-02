import { createPublicClient, http, encodeAbiParameters, parseAbiParameters, keccak256 } from 'viem';
import { defineChain } from 'viem';
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

const poolKey = {
  currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  currency1: USDC,
  fee: 3000,
  tickSpacing: 60,
  hooks: HOOK
};

// Calculate Pool ID
const id = keccak256(encodeAbiParameters(
  parseAbiParameters('address, address, uint24, int24, address'),
  [poolKey.currency0, poolKey.currency1, BigInt(poolKey.fee), poolKey.tickSpacing, poolKey.hooks]
));

async function main() {
  console.log('Pool ID:', id);
  const pmAbi = [
    {
      "inputs": [{ "name": "id", "type": "bytes32" }],
      "name": "getSqrtPriceX96",
      "outputs": [{ "name": "sqrtPriceX96", "type": "uint160" }],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  try {
    const price = await client.readContract({
      address: POOL_MANAGER,
      abi: pmAbi,
      functionName: 'getSqrtPriceX96',
      args: [id]
    });
    console.log('SqrtPriceX96:', price.toString());
  } catch (e: any) {
    console.error('Pool not found or error:', e.message);
  }
}
main();
