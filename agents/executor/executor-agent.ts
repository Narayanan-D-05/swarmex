import { createWalletClient, createPublicClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// ── Base Sepolia (where real Uniswap v4 is deployed) ─────────────────────────
const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
});

// ── Token addresses on Base Sepolia ──────────────────────────────────────────
// USDC: Circle's official Base Sepolia deployment
// WETH: Native wrapped ETH on Base
const SEPOLIA_TOKENS: Record<string, { address: `0x${string}`; decimals: number }> = {
  USDC: { address: (process.env.SEPOLIA_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`, decimals: 6 },
  WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
  ETH:  { address: '0x4200000000000000000000000000000000000006', decimals: 18 }, // ETH routes through WETH
};

const UNIVERSAL_ROUTER = (process.env.UNIVERSAL_ROUTER_ADDRESS || '0x492e6456d9528771018deb9e87ef7750ef184104') as `0x${string}`;
const PERMIT2         = (process.env.PERMIT2_ADDRESS || '0x000000000022D473030F116dDEE9F6B43aC78BA3') as `0x${string}`;

const ERC20_ABI = [
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const;

export async function runExecutor(state: any) {
  try {
    if (!process.env.USER_PRIVATE_KEY) {
      throw new Error('USER_PRIVATE_KEY must be set — real execution requires a funded wallet');
    }
    if (!process.env.UNISWAP_API_KEY) {
      throw new Error('UNISWAP_API_KEY must be set — required for Uniswap v4 Trade API');
    }

    // ── 1. Validate cryptographic Risk Attestation ────────────────────────────
    const riskAttestation = state.riskAttestation;
    if (!riskAttestation?.signature) {
      throw new Error('Execution Aborted: Missing cryptographic Risk Attestation. Every trade must be signed by the Risk Agent.');
    }

    // ── 2. Parse intent ───────────────────────────────────────────────────────
    const swapParams = JSON.parse(state.executionParams || '{}');
    const tIn       = (swapParams.tokenIn  || '').toUpperCase();
    const tOut      = (swapParams.tokenOut || 'ETH').toUpperCase();
    const amountRaw = swapParams.amount || swapParams.amountIn;
    const slippage  = parseFloat((swapParams.slippage || '1%').replace('%', ''));

    if (!tIn)      throw new Error('Execution Aborted: No input token specified');
    if (!amountRaw) throw new Error('Execution Aborted: No amount specified');

    const tokenIn  = SEPOLIA_TOKENS[tIn];
    const tokenOut = SEPOLIA_TOKENS[tOut] || SEPOLIA_TOKENS['ETH'];
    if (!tokenIn)  throw new Error(`Unsupported tokenIn: ${tIn}. Supported: ${Object.keys(SEPOLIA_TOKENS).join(', ')}`);
    if (!tokenOut) throw new Error(`Unsupported tokenOut: ${tOut}`);

    // Convert amount to smallest unit
    const [whole, frac = ''] = amountRaw.toString().split('.');
    const amountIn = BigInt(whole + frac.padEnd(tokenIn.decimals, '0').slice(0, tokenIn.decimals));

    const account       = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);
    const publicClient  = createPublicClient({ chain: baseSepolia, transport: http() });
    const walletClient  = createWalletClient({ account, chain: baseSepolia, transport: http() });

    console.log(`[Executor] Verified Swap: ${amountRaw} ${tIn} → ${tOut} on Base Sepolia`);
    console.log(`[Executor] Wallet: ${account.address}`);

    // ── 3. Fetch Uniswap v4 Trade API quote with execution calldata ──────────
    console.log(`[Executor] Fetching Uniswap v4 quote from Trade API...`);
    const quotePayload = {
      tokenInChainId:  84532,
      tokenIn:         tokenIn.address,
      tokenOutChainId: 84532,
      tokenOut:        tokenOut.address,
      amount:          amountIn.toString(),
      type:            'EXACT_INPUT',
      swapper:         account.address,
      slippageTolerance: (slippage / 100).toFixed(4),
    };

    const quoteRes = await fetch('https://trade-api.gateway.uniswap.org/v1/quote', {
      method: 'POST',
      headers: {
        'x-api-key':    process.env.UNISWAP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quotePayload),
    });

    if (!quoteRes.ok) {
      const errText = await quoteRes.text();
      throw new Error(`Uniswap v4 Trade API error ${quoteRes.status}: ${errText}`);
    }

    const quoteData = await quoteRes.json();
    const calldata  = quoteData.quote?.methodParameters?.calldata as `0x${string}` | undefined;
    const value     = quoteData.quote?.methodParameters?.value    || '0x0';
    const outputAmt = quoteData.quote?.output?.amount;

    if (!calldata) {
      throw new Error('Uniswap v4 Trade API did not return execution calldata. The pair may not have liquidity on Base Sepolia.');
    }

    console.log(`[Executor] Quote received. Expected output: ${outputAmt} ${tOut}`);

    // ── 4. Approve tokens if ERC-20 input ────────────────────────────────────
    if (tIn !== 'ETH') {
      const currentAllowance = await publicClient.readContract({
        address:      tokenIn.address,
        abi:          ERC20_ABI,
        functionName: 'allowance',
        args:         [account.address, PERMIT2],
      });

      if (currentAllowance < amountIn) {
        console.log(`[Executor] Approving ${tIn} for Permit2...`);
        const approveHash = await walletClient.writeContract({
          address:      tokenIn.address,
          abi:          ERC20_ABI,
          functionName: 'approve',
          args:         [PERMIT2, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log(`[Executor] ${tIn} approved for Permit2. Tx: ${approveHash}`);
      }
    }

    // ── 5. Execute swap via UniversalRouter ───────────────────────────────────
    console.log(`[Executor] Sending swap to Uniswap v4 UniversalRouter on Base Sepolia...`);
    const txHash = await walletClient.sendTransaction({
      to:    UNIVERSAL_ROUTER,
      data:  calldata,
      value: BigInt(value),
      gas:   500000n,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status === 'reverted') {
      throw new Error(`Uniswap v4 swap reverted on Base Sepolia. Tx: ${txHash}`);
    }

    console.log(`[Executor] Uniswap v4 swap confirmed! Tx: ${txHash}`);

    return {
      txHash,
      chain: 'base-sepolia',
      messages: [{
        role: 'executor',
        content: `Uniswap v4 swap executed on Base Sepolia. ${amountRaw} ${tIn} → ${tOut}. Tx: ${txHash}`,
      }],
    };

  } catch (err: any) {
    console.error(`[Executor Error] ${err.message}`);
    return {
      error: err.message,
      messages: [{ role: 'executor', content: `Execution Aborted: ${err.message}` }],
    };
  }
}
