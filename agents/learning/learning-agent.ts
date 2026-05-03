import { signRiskAttestation } from '../risk-guard/eip712-signer';
import { privateKeyToAccount } from 'viem/accounts';

export async function runLearningAgent(state: any) {
  console.log(`[RiskAgent] Evaluating cryptographic risk parameters...`);
  
  const intelligence = state.marketIntelligence;
  if (!intelligence || !intelligence.apiQuote) {
    throw new Error("Missing market intelligence. Risk assessment cannot proceed without real data.");
  }

  const priceImpact = intelligence.apiQuote.analysis?.priceImpact || 0;
  const dynamicSlippageBps = priceImpact > 0.02 ? 150n : 50n;
  const riskMultiplier = priceImpact > 0.02 ? 1.5 : 1.05;

  const usdcAddr = (process.env.USDC_ADDRESS || '0xf4131cC0a6E8a482dfeF634001E43c07dD1f82f8') as `0x${string}`;
  const nativeAddr = '0x0000000000000000000000000000000000000000' as `0x${string}`;
  
  const parsed = state.parsedIntent;
  const tIn = parsed.tokenIn.toUpperCase();
  const tokenInAddr = (tIn === 'USDC') ? usdcAddr : nativeAddr;
  const tokenOutAddr = (tIn === 'USDC') ? nativeAddr : usdcAddr;

  // Real amount parsing
  const decimalsIn = 18; // Both 18 on Galileo
  const [whole, frag = ''] = (parsed.amount || '0').toString().split('.');
  const amountIn = BigInt(whole + frag.padEnd(decimalsIn, '0').slice(0, decimalsIn));

  if (amountIn === 0n) throw new Error("Risk assessment failed: Amount is zero.");

  if (!process.env.USER_PRIVATE_KEY) throw new Error("USER_PRIVATE_KEY missing.");
  const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);
  
  const attestation = {
    sessionWallet: account.address,
    tokenIn: tokenInAddr,
    tokenOut: tokenOutAddr,
    maxSlippageBps: dynamicSlippageBps,
    maxAmountIn: (amountIn * 110n) / 100n, // 10% buffer
    expiresAt: BigInt(Math.floor(Date.now() / 1000) + 600), // 10 min expiry
    swarmConsensusHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
  };

  if (!process.env.RISK_AGENT_PRIVATE_KEY) throw new Error("RISK_AGENT_PRIVATE_KEY missing. Cannot sign attestation.");
  const signature = await signRiskAttestation(process.env.RISK_AGENT_PRIVATE_KEY, attestation);

  return {
    learningParams: { dynamicSlippageBps: Number(dynamicSlippageBps), riskMultiplier },
    riskAttestation: { attestation, signature },
    messages: [{ role: 'learning', content: `Cryptographic Risk Attestation signed. Slippage=${dynamicSlippageBps}bps, Multiplier=${riskMultiplier}` }]
  };
}
