const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
import { createPublicClient, createWalletClient, http, defineChain, parseAbi, parseAbiParameters, encodeAbiParameters, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const baseSepolia = defineChain({
  id: 84532, name: 'Base Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] } },
});

const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);
const UNIVERSAL_ROUTER = process.env.UNIVERSAL_ROUTER_ADDRESS as `0x${string}`;
const USDC_ADDR = process.env.SEPOLIA_USDC_ADDRESS as `0x${string}`;
const NATIVE_ETH = '0x0000000000000000000000000000000000000000' as `0x${string}`;

async function testUR() {
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

  const POOL_KEY = {
    currency0: NATIVE_ETH,
    currency1: USDC_ADDR,
    fee: 500,
    tickSpacing: 10,
    hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  };

  const SWAP_AMOUNT = 100000000000000n; // 0.0001 ETH
  const actions = new Uint8Array([0x06, 0x0c, 0x0e]); // 0x0e is TAKE

  const swapParams = encodeAbiParameters(
    parseAbiParameters([
      '(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey',
      'bool zeroForOne', 'uint128 amountIn', 'uint128 amountOutMinimum', 'bytes hookData',
    ]),
    [POOL_KEY, true, SWAP_AMOUNT, 0n, '0x' as `0x${string}`],
  );

  const settleParams = encodeAbiParameters(
    parseAbiParameters(['address currency', 'uint256 amount']),
    [NATIVE_ETH, SWAP_AMOUNT],
  );
  const takeParams = encodeAbiParameters(
    parseAbiParameters(['address currency', 'address recipient', 'uint256 amount']),
    [USDC_ADDR, account.address, 0n], // TAKE requires 3 args
  );

  const v4Actions = `0x${Buffer.from(actions).toString('hex')}` as `0x${string}`;
  const urInput = encodeAbiParameters(
    parseAbiParameters(['bytes', 'bytes[]']),
    [v4Actions, [swapParams, settleParams, takeParams]]
  );

  const commands  = '0x10' as `0x${string}`; // V4_SWAP

  try {
    const sim = await publicClient.simulateContract({
      address: UNIVERSAL_ROUTER,
      abi: parseAbi(['function execute(bytes commands, bytes[] inputs, uint256 deadline) payable']),
      functionName: 'execute',
      args: [commands, [urInput], BigInt(Math.floor(Date.now() / 1000) + 300)],
      value: SWAP_AMOUNT,
      account
    });
    console.log("Simulate OK!", sim);
  } catch (err: any) {
    console.log("Simulate failed:", err.message);
    if (err.walk) {
      const e = err.walk();
      console.log("Inner data:", e.data || e.cause?.data || "no data");
    }
  }
}
testUR().catch(console.error);
