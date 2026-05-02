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

const POOL_MANAGER = process.env.POOL_MANAGER_ADDRESS_OG!; // Correct PoolManager for 0G
const USDC = process.env.USDC_ADDRESS!;
const HOOK = process.env.HOOK_ADDRESS!;

async function main() {
  const poolKey = {
    currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    currency1: USDC as `0x${string}`,
    fee: 3000,
    tickSpacing: 120,
    hooks: HOOK as `0x${string}`
  };

  const POOL_MANAGER_ABI = [
    {
      "inputs": [{ "internalType": "PoolId", "name": "id", "type": "bytes32" }],
      "name": "getPoolState",
      "outputs": [
        { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
        { "internalType": "int24", "name": "tick", "type": "int24" },
        { "internalType": "uint24", "name": "protocolFee", "type": "uint24" },
        { "internalType": "uint24", "name": "lpFee", "type": "uint24" }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  try {
    // Correct PoolId calculation: keccak256(abi.encode(key))
    const { encodeAbiParameters, keccak256 } = await import('viem');
    const poolKeyTuple = [
        poolKey.currency0,
        poolKey.currency1,
        poolKey.fee,
        poolKey.tickSpacing,
        poolKey.hooks
    ];
    const poolId = keccak256(encodeAbiParameters(
        [
            { type: 'address' },
            { type: 'address' },
            { type: 'uint24' },
            { type: 'int24' },
            { type: 'address' }
        ],
        poolKeyTuple
    ));

    console.log('Calculated PoolId:', poolId);

    const [sqrtPriceX96, tick, protocolFee, lpFee] = await client.readContract({
      address: POOL_MANAGER as `0x${string}`,
      abi: POOL_MANAGER_ABI,
      functionName: 'getPoolState',
      args: [poolId]
    });

    console.log('Pool State:');
    console.log('sqrtPriceX96:', sqrtPriceX96.toString());
    console.log('tick:', tick);
    console.log('protocolFee:', protocolFee);
    console.log('lpFee:', lpFee);
    
    const minSqrtPrice = 4295128739n;
    if (sqrtPriceX96 <= minSqrtPrice + 1n) {
        console.log('WARNING: Pool is at MINIMUM price limit.');
    }
  } catch (err: any) {
    console.error('Failed to fetch pool state:', err.message);
  }
}
main();
