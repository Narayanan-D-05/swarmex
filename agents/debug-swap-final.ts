import { createPublicClient, createWalletClient, http, defineChain, parseEther, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { signRiskAttestation } from './risk-guard/eip712-signer';
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

async function main() {
  const poolKey = {
    currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    currency1: USDC,
    fee: 3000,
    tickSpacing: 120,
    hooks: HOOK
  };

  const amountIn = parseEther('0.1'); // Small swap
  const swapParams = {
    zeroForOne: true,
    amountSpecified: -amountIn,
    sqrtPriceLimitX96: 4295128740n
  };

  const testSettings = { takeClaims: false, settleUsingBurn: false };

  console.log('Generating real Risk Attestation...');
  const attestation = {
    sessionWallet: account.address,
    tokenIn: poolKey.currency0,
    tokenOut: poolKey.currency1,
    maxSlippageBps: 1000n,
    maxAmountIn: amountIn * 2n,
    expiresAt: BigInt(Math.floor(Date.now() / 1000) + 3600),
    swarmConsensusHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
  };
  const signature = await signRiskAttestation(process.env.RISK_AGENT_PRIVATE_KEY!, attestation);
  const hookData = encodeAbiParameters(RiskAttestationAbi, [attestation, signature]);

  console.log('Attempting swap with hookData...');
  try {
    const hash = await walletClient.writeContract({
      address: POOL_SWAP_TEST,
      abi: [{ "inputs": [{ "components": [{ "name": "currency0", "type": "address" }, { "name": "currency1", "type": "address" }, { "name": "fee", "type": "uint24" }, { "name": "tickSpacing", "type": "int24" }, { "name": "hooks", "type": "address" }], "name": "key", "type": "tuple" }, { "components": [{ "name": "zeroForOne", "type": "bool" }, { "name": "amountSpecified", "type": "int256" }, { "name": "sqrtPriceLimitX96", "type": "uint160" }], "name": "params", "type": "tuple" }, { "components": [{ "name": "takeClaims", "type": "bool" }, { "name": "settleUsingBurn", "type": "bool" }], "name": "testSettings", "type": "tuple" }, { "name": "hookData", "type": "bytes" }], "name": "swap", "outputs": [{ "name": "delta", "type": "int256" }], "stateMutability": "payable", "type": "function" }],
      functionName: 'swap',
      args: [poolKey, swapParams, testSettings, hookData],
      value: amountIn,
      gas: 2000000n
    });
    console.log('Swap TX:', hash);
    const receipt = await client.waitForTransactionReceipt({ hash });
    console.log('Final Status:', receipt.status);
  } catch (e: any) {
    console.error('Swap failed:', e.message);
  }
}
main();
