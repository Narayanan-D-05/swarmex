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

// 0x90bfb865 - look this up against known v4 errors
// PoolNotInitialized() = 0xdba8f52d
// InvalidSqrtPrice() = 0x43d0e333
// Swap via old ABI
const POOL_SWAP_TEST = process.env.POOL_SWAP_TEST_ADDRESS;
const USDC = process.env.USDC_ADDRESS;
const HOOK = process.env.HOOK_ADDRESS;

console.log('PST:', POOL_SWAP_TEST);
console.log('USDC:', USDC);
console.log('HOOK:', HOOK);

// Error signatures we know
const knownErrors: Record<string, string> = {
  '0x90bfb865': 'TicksMisordered OR PoolAlreadyInitialized or unknown v4-core custom error',
  '0xdba8f52d': 'PoolNotInitialized',
  '0x43d0e333': 'InvalidSqrtPrice',
  '0x4f2ee4dd': 'PoolAlreadyInitialized',
  '0x75bf2444': 'InvalidHookResponse',
  '0x8619b6b6': 'SqrtPriceOutOfRange'
};

console.log('Error 0x90bfb865 maps to:', knownErrors['0x90bfb865'] || 'unknown');

// The pool we initialized has hooks=0x0000...0 (no hook)
// But we are swapping with hooks=HOOK_ADDRESS
// This is a POOL KEY MISMATCH - the pool that exists is (currency0, currency1, fee, tickSpacing, 0x000...0)
// but executor uses (currency0, currency1, fee, tickSpacing, HOOK)
// These are DIFFERENT pools - we need to init with hook.
console.log('Root cause: pool init used hooks=0x0 but swap uses hooks=HOOK. Must re-init pool WITH hook.');
