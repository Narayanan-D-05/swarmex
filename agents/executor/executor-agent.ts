import { createWalletClient, http, encodeFunctionData, parseAbi, parseEther, maxUint256, defineChain, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { V4Planner, Actions } from '@uniswap/v4-sdk';
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
    if (!process.env.POOL_MANAGER_ADDRESS_OG || !process.env.UNIVERSAL_ROUTER_ADDRESS || !process.env.PERMIT2_ADDRESS) {
      throw new Error("Missing 0G Testnet contract variables (POOL_MANAGER_ADDRESS_OG, UNIVERSAL_ROUTER_ADDRESS, PERMIT2_ADDRESS)");
    }

    const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: ogTestnet,
      transport: http()
    });

    // 1. We would typically approve USDC here for Permit2.
    // For this exact snippet, we assume USDC is already approved to PERMIT2 based on Phase 1 setup,
    // or we'd execute the approve tx directly:
    // const usdc = '...';
    // await walletClient.writeContract({ ... approve PERMIT2 ... })
    // Then permit2.approve(router, amount)

    // Decode the decision from orchestrator
    const swapParams = JSON.parse(state.decision);
    const amountIn = swapParams.amountIn || '1000000000000000000'; // 1 token default

    // Properly encode hookData for the SwarmExecutorHook
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

    const encodedHookData = state.riskAttestation ? encodeAbiParameters(
      RiskAttestationAbi,
      [state.riskAttestation.attestation, state.riskAttestation.signature]
    ) : '0x';

    const planner = new V4Planner();
    
    // Add real execution action
    planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [{
      poolKey: swapParams.poolKey || {
        currency0: '0x0000000000000000000000000000000000000000',
        currency1: process.env.USDC_ADDRESS! as `0x${string}`, // Use USDC from .env
        fee: 3000,
        tickSpacing: 60,
        hooks: process.env.HOOK_ADDRESS!
      },
      zeroForOne: swapParams.zeroForOne ?? true,
      amountIn: BigInt(amountIn),
      amountOutMinimum: 0n, // Minimal validation for now
      hookData: encodedHookData,
    }]);

    planner.addAction(Actions.SETTLE_ALL, [swapParams.poolKey?.currency0 || '0x0000000000000000000000000000000000000000', BigInt(amountIn)]);
    planner.addAction(Actions.TAKE_ALL, [swapParams.poolKey?.currency1 || process.env.USDC_ADDRESS! as `0x${string}`, 0n]);

    const { commands, inputs } = planner.finalize();
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // +30 mins

    const UniversalRouterABI = parseAbi([
      'function execute(bytes calldata commands, bytes[] calldata inputs, uint256 deadline) external payable'
    ]);

    const txHash = await walletClient.writeContract({
      address: process.env.UNIVERSAL_ROUTER_ADDRESS as `0x${string}`,
      abi: UniversalRouterABI,
      functionName: 'execute',
      args: [commands, inputs, deadline],
      value: 0n, // Handle Native ETH value if required
    });
    
    return {
      txHash,
      messages: [{ role: 'executor', content: `Trade successfully executed on Uniswap v4 hook! Tx: ${txHash}` }]
    };
  } catch (err: any) {
    return { error: err.message, messages: [{ role: 'executor', content: 'Execution failed: ' + err.message }] };
  }
}
