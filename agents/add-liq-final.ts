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
const USDC = process.env.USDC_ADDRESS as `0x${string}`;
const HOOK = process.env.HOOK_ADDRESS as `0x${string}`;
const ROUTER = process.env.POOL_MODIFY_LIQUIDITY_TEST_ADDRESS as `0x${string}`;

async function main() {
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

    const poolKey = {
      currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      currency1: USDC,
      fee: 3000,
      tickSpacing: 60,
      hooks: HOOK
    };

    const liqParams = {
      tickLower: -600,
      tickUpper: 600,
      liquidityDelta: 1000000000000000000n, // 1e18 delta
      salt: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
    };

    console.log('Adding liquidity (1 0G test amount)...');
    try {
      const tx = await walletClient.writeContract({
        address: ROUTER,
        abi: routerAbi,
        functionName: 'modifyLiquidity',
        args: [poolKey, liqParams, '0x'],
        value: parseEther('1')
      });
      console.log('Liquidity Tx:', tx);
      await client.waitForTransactionReceipt({ hash: tx });
      console.log('SUCCESS!');
    } catch (e: any) {
      console.error('FAILED:', e.message);
    }
}
main();
