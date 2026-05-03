import { signRiskAttestation } from '../risk-guard/eip712-signer';
import { privateKeyToAccount } from 'viem/accounts';

// Token addresses on Base Sepolia — must match executor-agent.ts
const SEPOLIA_TOKENS: Record<string, `0x${string}`> = {
  USDC: (process.env.SEPOLIA_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`,
  WETH: '0x4200000000000000000000000000000000000006',
  ETH:  '0x4200000000000000000000000000000000000006',
};

const DECIMALS: Record<string, number> = {
  USDC: 6,
  WETH: 18,
  ETH:  18,
};

export async function runLearningAgent(state: any) {
  console.log(`[RiskAgent] Evaluating cryptographic risk parameters...`);

  const intelligence = state.marketIntelligence;
  if (!intelligence || !intelligence.apiQuote) {
    throw new Error('Missing market intelligence. Risk assessment cannot proceed without real data.');
  }

  const priceImpact        = intelligence.apiQuote.analysis?.priceImpact || 0;
  const dynamicSlippageBps = priceImpact > 0.02 ? 150n : 50n;
  const riskMultiplier     = priceImpact > 0.02 ? 1.5 : 1.05;

  // Resolve token addresses for Base Sepolia
  const parsed  = state.parsedIntent;
  const tIn     = (parsed.tokenIn  || '').toUpperCase();
  const tOut    = (parsed.tokenOut || 'ETH').toUpperCase();
  const decimalsIn = DECIMALS[tIn] ?? 18;

  const tokenInAddr  = SEPOLIA_TOKENS[tIn]  ?? SEPOLIA_TOKENS['WETH'];
  const tokenOutAddr = SEPOLIA_TOKENS[tOut] ?? SEPOLIA_TOKENS['WETH'];

  // Parse the amount into smallest units
  const [whole, frac = ''] = (parsed.amount || '0').toString().split('.');
  const amountIn = BigInt(whole + frac.padEnd(decimalsIn, '0').slice(0, decimalsIn));

  if (amountIn === 0n) throw new Error('Risk assessment failed: Amount is zero.');

  if (!process.env.USER_PRIVATE_KEY) throw new Error('USER_PRIVATE_KEY missing.');
  if (!process.env.RISK_AGENT_PRIVATE_KEY) throw new Error('RISK_AGENT_PRIVATE_KEY missing. Cannot sign attestation.');

  const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);

  const attestation = {
    sessionWallet:      account.address,
    tokenIn:            tokenInAddr,
    tokenOut:           tokenOutAddr,
    maxSlippageBps:     dynamicSlippageBps,
    maxAmountIn:        (amountIn * 110n) / 100n, // 10% buffer
    expiresAt:          BigInt(Math.floor(Date.now() / 1000) + 600), // 10 min expiry
    swarmConsensusHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
  };

  const signature = await signRiskAttestation(process.env.RISK_AGENT_PRIVATE_KEY, attestation);

  console.log(`[RiskAgent] Risk attestation signed. SlippageBps=${dynamicSlippageBps}, Multiplier=${riskMultiplier}`);

  return {
    learningParams:   { dynamicSlippageBps: Number(dynamicSlippageBps), riskMultiplier },
    riskAttestation:  { attestation, signature },
    messages: [{
      role:    'learning',
      content: `Cryptographic Risk Attestation signed for ${tIn}→${tOut}. Slippage=${dynamicSlippageBps}bps, Multiplier=${riskMultiplier}`,
    }],
  };
}
