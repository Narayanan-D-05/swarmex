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
const HOOK = process.env.HOOK_ADDRESS as `0x${string}`;

// Pool key WITH the hook (this is the pool the executor targets)
const poolKey = {
  currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  currency1: USDC,
  fee: 3000,
  tickSpacing: 60,
  hooks: HOOK
};

async function main() {
  console.log('=== Step 1: Initialize pool WITH SwarmExecutorHook ===');
  console.log('Pool key:', JSON.stringify(poolKey, null, 2));

  // Old-style v4 ABI (no hookData param) - confirmed working on 0G
  const initAbi = [
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
        { "name": "sqrtPriceX96", "type": "uint160" }
      ],
      "name": "initialize",
      "outputs": [{ "name": "tick", "type": "int24" }],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const sqrtPriceX96 = 79228162514264337593543950336n; // 1:1 price

  try {
    const initHash = await walletClient.writeContract({
      address: POOL_MANAGER,
      abi: initAbi,
      functionName: 'initialize',
      args: [poolKey, sqrtPriceX96]
    });
    console.log('Init Tx:', initHash);
    const initReceipt = await client.waitForTransactionReceipt({ hash: initHash });
    console.log('Init status:', initReceipt.status);
  } catch (e: any) {
    // Pool might already be initialized - that's ok
    if (e.message?.includes('already') || e.message?.includes('PoolAlreadyInitialized')) {
      console.log('Pool already initialized - continuing...');
    } else {
      console.error('Init failed:', e.shortMessage || e.message.slice(0, 200));
      return;
    }
  }

  console.log('\n=== Step 2: Add liquidity to hook-pool ===');

  const routerAbi = [
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
            { "name": "tickLower", "type": "int24" },
            { "name": "tickUpper", "type": "int24" },
            { "name": "liquidityDelta", "type": "int256" },
            { "name": "salt", "type": "bytes32" }
          ],
          "name": "params",
          "type": "tuple"
        },
        { "name": "hookData", "type": "bytes" }
      ],
      "name": "modifyLiquidity",
      "outputs": [{ "name": "delta", "type": "int256" }],
      "stateMutability": "payable",
      "type": "function"
    }
  ];

  const liqParams = {
    tickLower: -600,
    tickUpper: 600,
    liquidityDelta: 1000000000000000000n, // 1e18
    salt: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
  };

  try {
    const liqHash = await walletClient.writeContract({
      address: ROUTER,
      abi: routerAbi,
      functionName: 'modifyLiquidity',
      args: [poolKey, liqParams, '0x'],
      value: parseEther('1')
    });
    console.log('Liquidity Tx:', liqHash);
    const liqReceipt = await client.waitForTransactionReceipt({ hash: liqHash });
    console.log('Liquidity status:', liqReceipt.status);
  } catch (e: any) {
    console.error('Liquidity failed:', e.shortMessage || e.message.slice(0, 300));
  }
}
main();
