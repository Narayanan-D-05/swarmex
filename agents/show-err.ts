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

const known: Record<string, string> = {
  '0x7983c051': 'PoolAlreadyInitialized',
  '0x90bfb865': 'TicksMisordered',
  '0xdba8f52d': 'PoolNotInitialized',
  '0x43d0e333': 'InvalidSqrtPrice',
  '0x75bf2444': 'InvalidHookResponse',
};

console.log('0x7983c051 =', known['0x7983c051'] ?? 'unknown');
console.log('GOOD: Hook pool is already initialized!');
console.log('Next: just add liquidity to the hook pool.');
