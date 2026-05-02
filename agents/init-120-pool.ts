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
const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({ account, chain: ogTestnet, transport: http() });

const POOL_MANAGER = process.env.POOL_MANAGER_ADDRESS_OG as `0x${string}`;
const ROUTER = process.env.POOL_MODIFY_LIQUIDITY_TEST_ADDRESS as `0x${string}`;
const USDC = process.env.USDC_ADDRESS as `0x${string}`;
const HOOK = '0xc8b1d6aC3f4d52D9913c8b37c08764c5A1f1C0C0';

const poolKey = {
  currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  currency1: USDC,
  fee: 3000,
  tickSpacing: 60, // Optimized for gas
  hooks: HOOK
};

async function main() {
  console.log('=== Initializing 120-spacing pool ===');
  const initAbi = [{ "inputs": [{ "components": [{ "name": "currency0", "type": "address" }, { "name": "currency1", "type": "address" }, { "name": "fee", "type": "uint24" }, { "name": "tickSpacing", "type": "int24" }, { "name": "hooks", "type": "address" }], "name": "key", "type": "tuple" }, { "name": "sqrtPriceX96", "type": "uint160" }], "name": "initialize", "outputs": [{ "name": "tick", "type": "int24" }], "stateMutability": "nonpayable", "type": "function" }];
  
  try {
    const hash = await walletClient.writeContract({
      address: POOL_MANAGER,
      abi: initAbi,
      functionName: 'initialize',
      args: [poolKey, 79228162514264337593543950336n], // 1.0 price
      gas: 2000000n
    });
    console.log('Init hash:', hash);
    await client.waitForTransactionReceipt({ hash });
  } catch (e: any) {
    console.log('Init skipped/failed:', e.message.slice(0, 100));
  }

  console.log('=== Adding massive liquidity ===');
  const routerAbi = [{ "inputs": [{ "components": [{ "name": "currency0", "type": "address" }, { "name": "currency1", "type": "address" }, { "name": "fee", "type": "uint24" }, { "name": "tickSpacing", "type": "int24" }, { "name": "hooks", "type": "address" }], "name": "key", "type": "tuple" }, { "components": [{ "name": "tickLower", "type": "int24" }, { "name": "tickUpper", "type": "int24" }, { "name": "liquidityDelta", "type": "int256" }, { "name": "salt", "type": "bytes32" }], "name": "params", "type": "tuple" }, { "name": "hookData", "type": "bytes" }], "name": "modifyLiquidity", "outputs": [{ "name": "delta", "type": "int256" }], "stateMutability": "payable", "type": "function" }];

  try {
    const hash = await walletClient.writeContract({
      address: ROUTER,
      abi: routerAbi,
      functionName: 'modifyLiquidity',
      args: [poolKey, { tickLower: -120, tickUpper: 120, liquidityDelta: 1000000000000000000n, salt: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}` }, '0x'],
      value: parseEther('5'),
      gas: 2000000n // Explicit gas limit
    });
    console.log('Liquidity hash:', hash);
    await client.waitForTransactionReceipt({ hash });
    console.log('Liquidity added successfully!');
  } catch (e: any) {
    console.error('Liquidity failed:', e.message);
  }
}
main();
