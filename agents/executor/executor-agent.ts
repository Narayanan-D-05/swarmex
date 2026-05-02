import { createWalletClient, createPublicClient, http, encodeFunctionData, parseEther, maxUint256, defineChain, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { signRiskAttestation } from '../risk-guard/eip712-signer';

// Define 0G Testnet chain (Galileo)
const ogTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Scan', url: 'https://scan-testnet.0g.ai' },
  },
});

export async function runExecutor(state: any) {
  try {
    if (!process.env.USER_PRIVATE_KEY) throw new Error("USER_PRIVATE_KEY must be provided for execution");
    if (!process.env.POOL_MANAGER_ADDRESS_OG || !process.env.HOOK_ADDRESS) {
      throw new Error("Missing contract variables (POOL_MANAGER_ADDRESS_OG, HOOK_ADDRESS)");
    }

    const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: ogTestnet,
      transport: http()
    });
    const publicClient = createPublicClient({ chain: ogTestnet, transport: http() });

    const paramsString = state.executionParams || '{}';
    const swapParams = JSON.parse(paramsString);
    
    // ── Cryptographic Data Validation ─────────────────────────────────────────
    const riskAttestation = state.riskAttestation;
    if (!riskAttestation || !riskAttestation.signature) {
      throw new Error("Execution Aborted: Missing cryptographic Risk Attestation. Every trade must be signed by the Risk Agent.");
    }

    const usdcAddress = (process.env.USDC_ADDRESS || '0xf4131cC0a6E8a482dfeF634001E43c07dD1f82f8') as `0x${string}`;
    const nativeAddr = '0x0000000000000000000000000000000000000000' as `0x${string}`;
    
    const tIn  = (swapParams.tokenIn || '').toUpperCase();
    if (!tIn) throw new Error("Execution Aborted: No input token specified.");

    const tokenInAddr  = (tIn === 'USDC') ? usdcAddress : nativeAddr;
    const zeroForOne = (tokenInAddr === nativeAddr);
    
    const decimalsIn = 18; 
    const amountRaw = swapParams.amount || swapParams.amountIn;
    if (!amountRaw) throw new Error("Execution Aborted: No amount specified for trade.");

    const [whole, frag = ''] = amountRaw.toString().split('.');
    const amountIn = BigInt(whole + frag.padEnd(decimalsIn, '0').slice(0, decimalsIn));

    console.log(`[Executor] Verified Swap: ${amountRaw} ${tIn} -> (zeroForOne: ${zeroForOne}, amountIn: ${amountIn})`);

    // ── Execute Swap ──────────────────────────────────────────────────────────
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

    const encodedHookData = encodeAbiParameters(RiskAttestationAbi, [riskAttestation.attestation, riskAttestation.signature]);
    const poolSwapTestAddress = process.env.POOL_SWAP_TEST_ADDRESS as `0x${string}`;
    
    const poolKey120 = {
      currency0: nativeAddr,
      currency1: usdcAddress, 
      fee: 3000,
      tickSpacing: 120,
      hooks: process.env.HOOK_ADDRESS! as `0x${string}`
    };
    const poolKey60 = { ...poolKey120, tickSpacing: 60 };

    if (!zeroForOne) {
      // Selling USDC: Need approval
      console.log(`[Executor] Real Approval required for USDC...`);
      const erc20Abi = [{ "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }];
      const approveTx = await walletClient.writeContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [poolSwapTestAddress, amountIn]
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
    }

    const valueToSend = zeroForOne ? amountIn : 0n;

    const PoolSwapTestABI = [{
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
    }];

    const swapParamsTuple = {
      zeroForOne,
      amountSpecified: -amountIn,
      sqrtPriceLimitX96: zeroForOne ? 4295128739n + 1n : 1461446703485210103287273052203988822378723970342n - 1n
    };

    const testSettings = { takeClaims: false, settleUsingBurn: false };

    console.log(`[Executor] Executing 100% real trade...`);
    let txHash: `0x${string}`;
    try {
      txHash = await walletClient.writeContract({
        address: poolSwapTestAddress,
        abi: PoolSwapTestABI,
        functionName: 'swap',
        args: [poolKey120, swapParamsTuple, testSettings, encodedHookData],
        value: valueToSend,
        gas: 5000000n // Fixed high gas for 0G testnet reliability
      });
    } catch (err120: any) {
      console.log(`[Executor] 120-spacing pool failed. Trying 60-spacing...`);
      txHash = await walletClient.writeContract({
        address: poolSwapTestAddress,
        abi: PoolSwapTestABI,
        functionName: 'swap',
        args: [poolKey60, swapParamsTuple, testSettings, encodedHookData],
        value: valueToSend,
        gas: 5000000n
      });
    }
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status === 'reverted') throw new Error(`On-chain execution failed (Reverted).`);

    return {
      txHash,
      messages: [{ role: 'executor', content: `Swarm intelligence successfully executed the trade! Verified on 0G Galileo. Tx: ${txHash}` }]
    };
  } catch (err: any) {
    console.error(`[Executor Error] ${err.message}`);
    return { error: err.message, messages: [{ role: 'executor', content: 'Execution Aborted: ' + err.message }] };
  }
}
