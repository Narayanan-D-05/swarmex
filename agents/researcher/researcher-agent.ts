import { runInference } from '../shared/0g-compute-client';
import { createPublicClient, http, parseAbi, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const ogTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai'] },
  },
});

async function fetchOnChainData() {
  try {
    const publicClient = createPublicClient({
      chain: ogTestnet,
      transport: http()
    });
    
    const usdcAddress = process.env.USDC_ADDRESS as `0x${string}`;
    const poolManager = process.env.POOL_MANAGER_ADDRESS_OG as `0x${string}`;
    
    if (!usdcAddress || !poolManager) {
       console.warn("[Researcher:OnChain] Missing USDC or PoolManager address in .env");
       return null;
    }

    console.log(`[Researcher:OnChain] Checking liquidity for USDC (${usdcAddress}) in PoolManager (${poolManager})...`);

    const balanceAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);
    
    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: balanceAbi,
      functionName: 'balanceOf',
      args: [poolManager]
    });
    
    console.log(`[Researcher:OnChain] PoolManager balance: ${balance.toString()} USDC`);

    return {
      poolDepthUsdc: balance.toString(),
      hasLiquidity: balance > 0n
    };
  } catch(e: any) {
    console.warn(`[Researcher:OnChain] fetch failed: ${e.message}`);
    return null; // Don't hallucinate. If it fails, return null.
  }
}

async function fetchOffChainData(parsedIntent: any) {
  try {
    const { tokenIn, tokenOut, amount } = parsedIntent;
    
    let tokenInAddr = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    let tokenOutAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    let decimalsIn = 6;
    
    if (tokenIn.toUpperCase() === 'ETH' || tokenIn.toUpperCase() === 'WETH') {
      tokenInAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
      decimalsIn = 18;
    }
    if (tokenOut.toUpperCase() === 'USDC') {
      tokenOutAddr = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    }

    const amountBase = BigInt(Math.floor(parseFloat(amount) * (10 ** decimalsIn))).toString();
    const account = process.env.USER_PRIVATE_KEY 
      ? privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`) 
      : null;
    const swapper = account ? account.address : '0x0000000000000000000000000000000000000001'; 
    
    const quotePayload = {
      tokenInChainId: 1, tokenIn: tokenInAddr,
      tokenOutChainId: 1, tokenOut: tokenOutAddr,
      amount: amountBase, type: "EXACT_INPUT", swapper
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
