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

const ROUTER = process.env.POOL_MODIFY_LIQUIDITY_TEST_ADDRESS as `0x${string}`;
const USDC = process.env.USDC_ADDRESS as `0x${string}`;
const HOOK = process.env.HOOK_ADDRESS as `0x${string}`;

const poolKey = {
  currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  currency1: USDC,
  fee: 3000,
  tickSpacing: 120,
  hooks: HOOK
};

async function main() {
  console.log('=== Adding Massive Liquidity (5.0 0G) ===');
  const routerAbi = [{ "inputs": [{ "components": [{ "name": "currency0", "type": "address" }, { "name": "currency1", "type": "address" }, { "name": "fee", "type": "uint24" }, { "name": "tickSpacing", "type": "int24" }, { "name": "hooks", "type": "address" }], "name": "key", "type": "tuple" }, { "components": [{ "name": "tickLower", "type": "int24" }, { "name": "tickUpper", "type": "int24" }, { "name": "liquidityDelta", "type": "int256" }, { "name": "salt", "type": "bytes32" }], "name": "params", "type": "tuple" }, { "name": "hookData", "type": "bytes" }], "name": "modifyLiquidity", "outputs": [{ "name": "delta", "type": "int256" }], "stateMutability": "payable", "type": "function" }];

  // Approval for USDC if needed (assuming pool is native/usdc)
  // We'll add 10^21 liquidity delta which is much larger
  try {
    const hash = await walletClient.writeContract({
      address: ROUTER,
      abi: routerAbi,
      functionName: 'modifyLiquidity',
      args: [poolKey, { tickLower: -12000, tickUpper: 12000, liquidityDelta: 5000000000000000000000n, salt: '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}` }, '0x'],
      value: parseEther('5'),
      gas: 2000000n
    });
    console.log('Liquidity hash:', hash);
    const receipt = await client.waitForTransactionReceipt({ hash });
    console.log('Status:', receipt.status);
  } catch (e: any) {
    console.error('Liquidity failed:', e.message);
  }
}
main();
