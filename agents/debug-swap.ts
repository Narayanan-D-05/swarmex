import { createPublicClient, createWalletClient, http, defineChain, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
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
const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({ account, chain: ogTestnet, transport: http() });

const POOL_SWAP_TEST = process.env.POOL_SWAP_TEST_ADDRESS as `0x${string}`;
const USDC = process.env.USDC_ADDRESS as `0x${string}`;
const HOOK = process.env.HOOK_ADDRESS as `0x${string}`;

const PoolSwapTestABI = [
  {
    "inputs": [
      {
        "components": [
          { "name": "currency0", "type": "address" },
          { "name": "currency1", "type": "address" },
          { "name": "fee", "type": "uint24" },
          { "name": "tickSpacing", "type": "int24" },
          { "name": "hooks", "type": "address" }
        ],
        "name": "key",
        "type": "tuple"
      },
      {
        "components": [
          { "name": "zeroForOne", "type": "bool" },
          { "name": "amountSpecified", "type": "int256" },
          { "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "name": "params",
        "type": "tuple"
      },
      {
        "components": [
          { "name": "takeClaims", "type": "bool" },
          { "name": "settleUsingBurn", "type": "bool" }
        ],
        "name": "testSettings",
        "type": "tuple"
      },
      { "name": "hookData", "type": "bytes" }
    ],
    "name": "swap",
    "outputs": [{ "name": "delta", "type": "int256" }],
    "stateMutability": "payable",
    "type": "function"
  }
];

async function main() {
  const poolKey = {
    currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    currency1: USDC,
    fee: 3000,
    tickSpacing: 60,
    hooks: HOOK
  };

  // EXACT_INPUT in v4: amountSpecified must be NEGATIVE
  const amountIn = parseEther('0.001'); // Small: 0.001 0G
  const swapParams = {
    zeroForOne: true,
    amountSpecified: -amountIn, // NEGATIVE for exact input in v4
    sqrtPriceLimitX96: 4295128739n + 1n
  };

  const testSettings = { takeClaims: false, settleUsingBurn: false };

  console.log('Attempting direct swap with NEGATIVE amountSpecified (v4 exact-input)...');
  console.log('amountSpecified:', swapParams.amountSpecified.toString());

  try {
    const gasEst = await client.estimateContractGas({
      address: POOL_SWAP_TEST,
      abi: PoolSwapTestABI,
      functionName: 'swap',
      args: [poolKey, swapParams, testSettings, '0x'],
      value: amountIn,
      account
    });
    console.log('Gas estimate:', gasEst.toString());
  } catch(e: any) {
    console.error('Gas estimate failed:', e.shortMessage || e.message.slice(0, 200));
  }

  try {
    const tx = await walletClient.writeContract({
      address: POOL_SWAP_TEST,
      abi: PoolSwapTestABI,
      functionName: 'swap',
      args: [poolKey, swapParams, testSettings, '0x'], // no hookData bypass for isolation
      value: amountIn,
      gas: 1000000n
    });
    console.log('Swap TX:', tx);
    const receipt = await client.waitForTransactionReceipt({ hash: tx });
    console.log('Status:', receipt.status);
  } catch(e: any) {
    console.error('Swap failed:', e.shortMessage || e.message.slice(0, 200));
  }
}
main();
