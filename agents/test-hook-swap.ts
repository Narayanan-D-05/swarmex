import { createPublicClient, createWalletClient, http, defineChain, parseEther, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { signRiskAttestation } from './risk-guard/eip712-signer';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ethers } from 'ethers';

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
const riskAgentAccount = privateKeyToAccount(process.env.RISK_AGENT_PRIVATE_KEY as `0x${string}`);
const riskAgentWalletClient = createWalletClient({ account: riskAgentAccount, chain: ogTestnet, transport: http() });

const poolKeyWithHook = {
  currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  currency1: USDC,
  fee: 3000,
  tickSpacing: 60,
  hooks: HOOK
};

const PoolSwapTestABI = [
  {
    "inputs": [
      { "components": [{ "name": "currency0", "type": "address" }, { "name": "currency1", "type": "address" }, { "name": "fee", "type": "uint24" }, { "name": "tickSpacing", "type": "int24" }, { "name": "hooks", "type": "address" }], "name": "key", "type": "tuple" },
      { "components": [{ "name": "zeroForOne", "type": "bool" }, { "name": "amountSpecified", "type": "int256" }, { "name": "sqrtPriceLimitX96", "type": "uint160" }], "name": "params", "type": "tuple" },
      { "components": [{ "name": "takeClaims", "type": "bool" }, { "name": "settleUsingBurn", "type": "bool" }], "name": "testSettings", "type": "tuple" },
      { "name": "hookData", "type": "bytes" }
    ],
    "name": "swap", "outputs": [{ "name": "delta", "type": "int256" }], "stateMutability": "payable", "type": "function"
  }
];

const RiskAttestationAbi = [
  { type: 'tuple', name: 'attestation', components: [{ name: 'sessionWallet', type: 'address' }, { name: 'tokenIn', type: 'address' }, { name: 'tokenOut', type: 'address' }, { name: 'maxSlippageBps', type: 'uint256' }, { name: 'maxAmountIn', type: 'uint256' }, { name: 'expiresAt', type: 'uint256' }, { name: 'swarmConsensusHash', type: 'bytes32' }] },
  { type: 'bytes', name: 'signature' }
];

async function main() {
  const amountIn = parseEther('0.001');
  
  // In PoolSwapTest, the `sender` passed to beforeSwap is msg.sender (the user's EOA).
  // We must set sessionWallet = user's EOA address.
  const SESSION_WALLET = account.address;
  
  console.log('Account address (sessionWallet):', SESSION_WALLET);
  console.log('Pool Swap Test address:', POOL_SWAP_TEST);

  const attestation = {
    sessionWallet: SESSION_WALLET,
    tokenIn: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    tokenOut: USDC,
    maxSlippageBps: 100n,
    maxAmountIn: amountIn,
    expiresAt: BigInt(Math.floor(Date.now() / 1000) + 3600),
    swarmConsensusHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
  };

  const domain = {
    name: 'SwarmExecutorHook',
    version: '1',
    chainId: 16602,
    verifyingContract: HOOK
  };

  const types = {
    RiskAttestation: [
      { name: 'sessionWallet', type: 'address' },
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'maxSlippageBps', type: 'uint256' },
      { name: 'maxAmountIn', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'swarmConsensusHash', type: 'bytes32' }
    ]
  };

  console.log('TS Domain Separator:', ethers.TypedDataEncoder.hashDomain(domain));
  console.log('TS Struct Hash:', ethers.TypedDataEncoder.hashStruct('RiskAttestation', types, attestation));
  console.log('TS Digest:', ethers.TypedDataEncoder.hash(domain, types, attestation));

  const signature = await riskAgentWalletClient.signTypedData({
    domain: {
      name: 'SwarmExecutorHook',
      version: '1',
      chainId: 16602,
      verifyingContract: HOOK
    },
    types: {
      RiskAttestation: [
        { name: 'sessionWallet', type: 'address' },
        { name: 'tokenIn', type: 'address' },
        { name: 'tokenOut', type: 'address' },
        { name: 'maxSlippageBps', type: 'uint256' },
        { name: 'maxAmountIn', type: 'uint256' },
        { name: 'expiresAt', type: 'uint256' },
        { name: 'swarmConsensusHash', type: 'bytes32' }
      ]
    },
    primaryType: 'RiskAttestation',
    message: attestation
  });
  console.log('Signature:', signature.slice(0, 20) + '...');

  // Recover signer locally to verify
  const riskAgentWallet = new ethers.Wallet(process.env.RISK_AGENT_PRIVATE_KEY!);
  console.log('Risk agent address (expected):', riskAgentWallet.address);

  const hookData = encodeAbiParameters(RiskAttestationAbi, [attestation, signature]);
  console.log('hookData length:', hookData.length);

  const swapParams = { zeroForOne: true, amountSpecified: -amountIn, sqrtPriceLimitX96: 4295128739n + 1n };
  const testSettings = { takeClaims: false, settleUsingBurn: false };

  console.log('\nAttempting swap with hook...');
  try {
    const gasEst = await client.estimateContractGas({
      address: POOL_SWAP_TEST,
      abi: PoolSwapTestABI,
      functionName: 'swap',
      args: [poolKeyWithHook, swapParams, testSettings, hookData],
      value: amountIn,
      account
    });
    console.log('Gas estimate:', gasEst.toString());
  } catch(e: any) {
    const msg = e.shortMessage || e.message.slice(0, 300);
    console.error('Gas estimate failed:', msg);
  }

  try {
    const tx = await walletClient.writeContract({
      address: POOL_SWAP_TEST,
      abi: PoolSwapTestABI,
      functionName: 'swap',
      args: [poolKeyWithHook, swapParams, testSettings, hookData],
      value: amountIn,
      gas: 1000000n
    });
    console.log('Swap TX:', tx);
    const receipt = await client.waitForTransactionReceipt({ hash: tx });
    console.log('Status:', receipt.status);
    if (receipt.status === 'success') console.log('✅ HOOK SWAP SUCCEEDED!');
    else console.log('❌ Reverted.');
  } catch(e: any) {
    console.error('Swap failed:', e.shortMessage || e.message.slice(0, 200));
  }
}
main();
