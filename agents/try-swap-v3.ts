const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
import { createPublicClient, createWalletClient, http, defineChain, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const baseSepolia = defineChain({
  id: 84532, name: 'Base Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] } },
});

const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);
const USDC_ADDR = (process.env.SEPOLIA_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`;
const WETH_ADDR = '0x4200000000000000000000000000000000000006' as `0x${string}`;

const V3_ROUTER_02 = '0x2626664c2603336e7cdd10aee6e5a297e68edbfa' as `0x${string}`;

const abi = parseAbi([
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)'
]);

async function trySwapV3() {
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() });

  const amountIn = 10000000000000000n; // 0.01 ETH

  console.log('Trying V3 swap ETH -> USDC on Base Sepolia...');
  const fees = [500, 3000, 10000];
  for (const fee of fees) {
    try {
      const sim = await publicClient.simulateContract({
        address: V3_ROUTER_02, abi, functionName: 'exactInputSingle',
        args: [{
          tokenIn: WETH_ADDR, tokenOut: USDC_ADDR, fee, recipient: account.address,
          deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
          amountIn, amountOutMinimum: 0n, sqrtPriceLimitX96: 0n
        }],
        value: amountIn, account
      });
      console.log(`Simulation passed for fee ${fee}! Executing...`);
      const tx = await walletClient.writeContract(sim.request);
      console.log('Swap tx:', tx);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      console.log('Swap confirmed. We should have USDC now.');
      return;
    } catch (e) {
      console.log(`Failed fee ${fee}:`, e.message.substring(0, 100));
    }
  }
}
trySwapV3().catch(console.error);
