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

const POOL_MANAGER = '0x0c3970a25d85Fb45BcFfB064223d69361de641D1' as `0x${string}`;
const ROUTER = process.env.POOL_MODIFY_LIQUIDITY_TEST_ADDRESS as `0x${string}`;
const USDC = process.env.USDC_ADDRESS as `0x${string}`;
const NEW_HOOK = process.env.HOOK_ADDRESS as `0x${string}`;

const poolKey = {
  currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  currency1: USDC,
  fee: 3000,
  tickSpacing: 60,
  hooks: NEW_HOOK
};

const initAbi = [
  {
    "inputs": [
      { "components": [{ "name": "currency0", "type": "address" }, { "name": "currency1", "type": "address" }, { "name": "fee", "type": "uint24" }, { "name": "tickSpacing", "type": "int24" }, { "name": "hooks", "type": "address" }], "name": "key", "type": "tuple" },
      { "name": "sqrtPriceX96", "type": "uint160" }
    ],
    "name": "initialize",
    "outputs": [{ "name": "tick", "type": "int24" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const routerAbi = [
  {
    "inputs": [
      { "components": [{ "name": "currency0", "type": "address" }, { "name": "currency1", "type": "address" }, { "name": "fee", "type": "uint24" }, { "name": "tickSpacing", "type": "int24" }, { "name": "hooks", "type": "address" }], "name": "key", "type": "tuple" },
      { "components": [{ "name": "tickLower", "type": "int24" }, { "name": "tickUpper", "type": "int24" }, { "name": "liquidityDelta", "type": "int256" }, { "name": "salt", "type": "bytes32" }], "name": "params", "type": "tuple" },
      { "name": "hookData", "type": "bytes" }
    ],
    "name": "modifyLiquidity",
    "outputs": [{ "name": "delta", "type": "int256" }],
    "stateMutability": "payable",
    "type": "function"
  }
];

async function main() {
  console.log('=== Step 1: Initialize pool with NEW hook ===');
  try {
    const initHash = await walletClient.writeContract({
      address: POOL_MANAGER,
      abi: initAbi,
      functionName: 'initialize',
      args: [poolKey, 79228162514264337593543950336n]
    });
    console.log('Init TX:', initHash);
    const receipt = await client.waitForTransactionReceipt({ hash: initHash });
    console.log('Init status:', receipt.status);
  } catch (e: any) {
    if (e.message?.includes('0x7983c051')) {
      console.log('Pool already initialized - OK');
    } else {
      console.error('Init failed:', e.shortMessage || e.message.slice(0, 150));
      return;
    }
  }

  console.log('\n=== Step 2: Add liquidity to new hook pool ===');
  try {
    const liqHash = await walletClient.writeContract({
      address: ROUTER,
      abi: routerAbi,
      functionName: 'modifyLiquidity',
      args: [poolKey, { tickLower: -600, tickUpper: 600, liquidityDelta: 1000000000000000000n, salt: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}` }, '0x'],
      value: parseEther('1')
    });
    console.log('Liquidity TX:', liqHash);
    const liqReceipt = await client.waitForTransactionReceipt({ hash: liqHash });
    console.log('Liquidity status:', liqReceipt.status);
  } catch (e: any) {
    console.error('Liquidity failed:', e.shortMessage || e.message.slice(0, 200));
  }
}
main();
