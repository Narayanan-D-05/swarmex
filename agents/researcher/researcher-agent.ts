import { runInference } from '../shared/0g-compute-client';
import { createPublicClient, http, parseAbi, defineChain } from 'viem';

// Base Sepolia — where Uniswap v4 is actually deployed
const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] },
  },
});

async function fetchOnChainData() {
  try {
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    // Check USDC balance held by the Uniswap v4 PoolManager on Base Sepolia
    const usdcAddress  = (process.env.SEPOLIA_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`;
    const poolManager  = (process.env.POOL_MANAGER_ADDRESS || '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408') as `0x${string}`;

    console.log(`[Researcher:OnChain] Checking Uniswap v4 PoolManager USDC depth on Base Sepolia...`);

    const balanceAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);
    const balance = await publicClient.readContract({
      address:      usdcAddress,
      abi:          balanceAbi,
      functionName: 'balanceOf',
      args:         [poolManager],
    });

    console.log(`[Researcher:OnChain] PoolManager USDC balance: ${balance.toString()}`);

    return {
      poolDepthUsdc: balance.toString(),
      hasLiquidity:  balance > 0n,
    };
  } catch(e: any) {
    console.warn(`[Researcher:OnChain] fetch failed: ${e.message}`);
    return null;
  }
}

async function fetchOffChainData(parsedIntent: any) {
  try {
    const { tokenIn, tokenOut, amount } = parsedIntent;

    // Token addresses on Base Sepolia for Uniswap v4 Trade API
    const TOKENS: Record<string, { address: string; decimals: number }> = {
      USDC: { address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 },
      WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
      ETH:  { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    };

    const tIn  = tokenIn.toUpperCase();
    const tOut = (tokenOut || 'ETH').toUpperCase();
    const tokenInInfo  = TOKENS[tIn]  || TOKENS['USDC'];
    const tokenOutInfo = TOKENS[tOut] || TOKENS['ETH'];

    const amountBase = BigInt(Math.floor(parseFloat(amount) * (10 ** tokenInInfo.decimals))).toString();

    const swapper = process.env.USER_PRIVATE_KEY
      ? '0x0000000000000000000000000000000000000001'
      : '0x0000000000000000000000000000000000000001';

    const quotePayload = {
      tokenInChainId:  84532,
      tokenIn:         tokenInInfo.address,
      tokenOutChainId: 84532,
      tokenOut:        tokenOutInfo.address,
      amount:          amountBase,
      type:            'EXACT_INPUT',
      swapper,
    };

    console.log(`[Researcher:OffChain] Fetching quote from Uniswap API...`);
    const res = await fetch('https://trade-api.gateway.uniswap.org/v1/quote', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.UNISWAP_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quotePayload)
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const quoteData = await res.json();
    const outAmountBase = quoteData.quote?.output?.amount || '0';
    const gasFeeUsd = parseFloat(quoteData.quote?.gasFeeUSD || '0');
    const priceImpact = quoteData.quote?.priceImpact || 0;
    
    const outEth = parseFloat(outAmountBase) / 1e18;
    const expectedValueUsd = outEth * 3000;
    const expectedProfit = expectedValueUsd - gasFeeUsd;

    return {
      quoteData: quoteData.quote,
      analysis: {
        expectedProfitUsd: expectedProfit,
        gasCostUsd: gasFeeUsd,
        priceImpact,
        isProfitable: expectedProfit > gasFeeUsd,
        liquiditySufficient: priceImpact < 0.05
      }
    };
  } catch(e: any) {
    console.warn(`[Researcher:OffChain] fetch failed: ${e.message}`);
    return null;
  }
}

export async function runResearcher(state: any) {
  try {
    console.log(`[Researcher] Parallel analysis starting for: ${JSON.stringify(state.parsedIntent)}`);
    
    // Parallel Execution
    const [offChainData, onChainData] = await Promise.all([
      fetchOffChainData(state.parsedIntent),
      fetchOnChainData()
    ]);

    let strategy = 'manual';
    let reasoning = 'API failed. Fallback to manual routing.';
    
    if (offChainData && offChainData.analysis.isProfitable) {
      strategy = 'api';
      reasoning = `OffChain Profit: $${offChainData.analysis.expectedProfitUsd.toFixed(2)}. `;
    }

    if (onChainData) {
      reasoning += `OnChain Depth: ${onChainData.poolDepthUsdc} base units.`;
    }

    const intelligence = {
      timestamp: Date.now(),
      apiQuote: offChainData,
      onChainData: onChainData,
      strategy,
      reasoning
    };

    return {
      marketIntelligence: intelligence,
      messages: [{ role: 'researcher', content: `Parallel research complete. ${reasoning}` }]
    };

  } catch (err: any) {
    console.warn(`[Researcher] Exception caught: ${err.message}`);
    return {
      marketIntelligence: {
        error: err.message,
        strategy: 'none',
        reasoning: 'Critical Research Failure: ' + err.message
      },
      messages: [{ role: 'researcher', content: `CRITICAL ERROR: ${err.message}` }]
    };
  }
}
