import { createPublicClient, createWalletClient, http, defineChain, parseEther, encodeAbiParameters } from 'viem';
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
const HOOK = process.env.HOOK_ADDRESS as `0x${string}`;

const poolKey = {
  currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  currency1: USDC,
  fee: 3000,
  tickSpacing: 60,
  hooks: HOOK
};

async function main() {
  console.log('=== Attempting to push price back up by swapping USDC -> 0G ===');
  
  // We need an attestation even for this recovery swap because the hook is active
  const { signRiskAttestation } = await import('./risk-guard/eip712-signer');
  const attestation = {
    sessionWallet: account.address,
    tokenIn: USDC as `0x${string}`,
    tokenOut: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    maxSlippageBps: 10000n, // High slippage for recovery
    maxAmountIn: parseEther('100'),
    expiresAt: BigInt(Math.floor(Date.now() / 1000) + 3600),
    swarmConsensusHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
  };
  const signature = await signRiskAttestation(process.env.RISK_AGENT_PRIVATE_KEY!, attestation);
  const RiskAttestationAbi = [{
    type: 'tuple',
    name: 'attestation',
    components: [
      { name: 'sessionWallet', type: 'address' },
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'maxSlippageBps', type: 'uint256' },
      { name: 'maxAmountIn', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'swarmConsensusHash', type: 'bytes32' }
    ]
  }, { type: 'bytes', name: 'signature' }];
  const hookData = encodeAbiParameters(RiskAttestationAbi, [attestation, signature]);

  const PoolSwapTestABI = [
    {
      "inputs": [
        { "components": [{ "name": "currency0", "type": "address" }, { "name": "currency1", "type": "address" }, { "name": "fee", "type": "uint24" }, { "name": "tickSpacing", "type": "int24" }, { "name": "hooks", "type": "address" }], "name": "key", "type": "tuple" },
        { "components": [{ "name": "zeroForOne", "type": "bool" }, { "name": "amountSpecified", "type": "int256" }, { "name": "sqrtPriceLimitX96", "type": "uint160" }], "name": "params", "type": "tuple" },
        { "components": [{ "name": "takeClaims", "type": "bool" }, { "name": "settleUsingBurn", "type": "bool" }], "name": "testSettings", "type": "tuple" },
        { "name": "hookData", "type": "bytes" }
      ],
      "name": "swap",
      "outputs": [{ "name": "delta", "type": "int256" }],
      "stateMutability": "payable",
      "type": "function"
    }
  ];

  const amountIn = 1000000n; // 1 USDC (assuming 6 decimals)
  // Wait, what are the decimals of USDC?
  // Let's check check-usdc.ts.
  
  const swapParams = {
    zeroForOne: false, // USDC -> 0G
    amountSpecified: -amountIn,
    sqrtPriceLimitX96: 1461446703485210103287273052203988822378723970342n - 1n
  };
  const testSettings = { takeClaims: false, settleUsingBurn: false };

  try {
    const hash = await walletClient.writeContract({
      address: POOL_SWAP_TEST,
      abi: PoolSwapTestABI,
      functionName: 'swap',
      args: [poolKey, swapParams, testSettings, hookData]
    });
    console.log('Recovery Swap TX:', hash);
    await client.waitForTransactionReceipt({ hash });
    console.log('Recovery Swap Succeeded!');
  } catch (e: any) {
    console.error('Recovery Swap Failed:', e.message);
  }
}
main();
