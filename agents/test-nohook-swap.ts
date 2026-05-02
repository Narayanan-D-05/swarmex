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

// Pool WITHOUT hook (we initialized this earlier with success)
const poolKeyNoHook = {
  currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  currency1: USDC,
  fee: 3000,
  tickSpacing: 60,
  hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`
};

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
  const amountIn = parseEther('0.001');

  // Test 1: positive amountSpecified (exact-output request)
  console.log('=== Test 1: Positive amountSpecified (exact-output) on no-hook pool ===');
  try {
    const gas1 = await client.estimateContractGas({
      address: POOL_SWAP_TEST,
      abi: PoolSwapTestABI,
      functionName: 'swap',
      args: [poolKeyNoHook, { zeroForOne: true, amountSpecified: amountIn, sqrtPriceLimitX96: 4295128739n + 1n }, { takeClaims: false, settleUsingBurn: false }, '0x'],
      value: amountIn,
      account
    });
    console.log('Gas estimate (positive):', gas1.toString());
  } catch(e: any) {
    console.error('Gas failed (positive):', e.shortMessage?.slice(0, 100));
  }

  // Test 2: negative amountSpecified (exact-input request)
  console.log('\n=== Test 2: Negative amountSpecified (exact-input) on no-hook pool ===');
  try {
    const gas2 = await client.estimateContractGas({
      address: POOL_SWAP_TEST,
      abi: PoolSwapTestABI,
      functionName: 'swap',
      args: [poolKeyNoHook, { zeroForOne: true, amountSpecified: -amountIn, sqrtPriceLimitX96: 4295128739n + 1n }, { takeClaims: false, settleUsingBurn: false }, '0x'],
      value: amountIn,
      account
    });
    console.log('Gas estimate (negative):', gas2.toString());

    const tx = await walletClient.writeContract({
      address: POOL_SWAP_TEST,
      abi: PoolSwapTestABI,
      functionName: 'swap',
      args: [poolKeyNoHook, { zeroForOne: true, amountSpecified: -amountIn, sqrtPriceLimitX96: 4295128739n + 1n }, { takeClaims: false, settleUsingBurn: false }, '0x'],
      value: amountIn,
      gas: gas2 + 50000n
    });
    console.log('Swap TX:', tx);
    const receipt = await client.waitForTransactionReceipt({ hash: tx });
    console.log('Status:', receipt.status);
    if (receipt.status === 'success') console.log('✅ NO-HOOK SWAP SUCCEEDED!');
  } catch(e: any) {
    console.error('Gas failed (negative):', e.shortMessage?.slice(0, 150));
  }
}
main();
