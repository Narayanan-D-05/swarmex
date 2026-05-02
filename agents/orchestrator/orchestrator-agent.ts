import { runInference } from '../shared/0g-compute-client';
import { randomUUID } from 'crypto';

export async function runIntentParser(state: any) {
  const provider = process.env.OG_COMPUTE_PROVIDER!;
  const prompt = `Extract the trade details from this intent: "${state.intent}".
Output exactly a JSON object with keys: tokenIn, tokenOut, amount, slippage.
Example: {"tokenIn": "USDC", "tokenOut": "ETH", "amount": "10", "slippage": "1%"}`;

  try {
    const res = await runInference(provider, [{ role: 'user', content: prompt }]);
    const jsonMatch = res.match(/\{.*\}/s);
    if (jsonMatch) {
      const parsedIntent = JSON.parse(jsonMatch[0]);
      return { 
        parsedIntent,
        messages: [{ role: 'orchestrator', content: `Parsed intent: ${JSON.stringify(parsedIntent)}` }] 
      };
    }
    throw new Error("Failed to parse intent JSON");
  } catch (err: any) {
    return { error: `Intent Parser failed: ${err.message}` };
  }
}

export async function runOrchestrator(state: any) {
  const provider = process.env.OG_COMPUTE_PROVIDER!;
  const intelligence = state.marketIntelligence;
  const learningParams = state.learningParams;
  if (!learningParams) throw new Error("Missing Risk Assessment parameters.");
  
  // Perform math in code to prevent LLM hallucination
  const gasCostUsd = intelligence?.apiQuote?.analysis?.gasCostUsd || 0;
  const expectedProfitUsd = intelligence?.apiQuote?.analysis?.expectedProfitUsd || 0;
  const riskThreshold = gasCostUsd * learningParams.riskMultiplier;
  const isMathProfitable = expectedProfitUsd > riskThreshold;
  const hasOnChainLiquidity = intelligence?.onChainData?.hasLiquidity ?? false;

  const prompt = `You are the SwarmEx Autonomous Orchestrator.
User intent: ${JSON.stringify(state.parsedIntent)}
Market Intelligence: ${JSON.stringify(intelligence)}
Learning Agent Params: ${JSON.stringify(learningParams)}

VERIFIED MATH RESULTS:
- Expected Profit: $${expectedProfitUsd.toFixed(2)}
- Gas Threshold (Gas * RiskMultiplier): $${riskThreshold.toFixed(2)}
- Is Profitability Verified: ${isMathProfitable ? 'YES' : 'NO'}
- OnChain Liquidity Detected: ${hasOnChainLiquidity ? 'YES' : 'NO'}

Perform an internal debate evaluating these facts:
1. If 'OnChain Liquidity Detected' is NO, you should normally abort unless the user intent implies a testing/force execution.
2. If 'Is Profitability Verified' is NO, you MUST abort for safety.
3. If both are YES, you should proceed with 'execute'.

Output EXACTLY "DECISION: execute" followed by parameters, or "DECISION: abort" with a reason.`;

  try {
    const res = await runInference(provider, [{ role: 'user', content: prompt }]);
    
    let decision = 'continue';
    let params = null;

    const resUpper = res.toUpperCase();
    if (resUpper.includes('DECISION: EXECUTE')) {
      decision = 'execute';
      // Append the chosen strategy from intelligence so Executor knows
      const execParams = { ...state.parsedIntent, strategy: intelligence?.strategy };
      if (!execParams.strategy) throw new Error("No execution strategy derived from research.");
      params = JSON.stringify(execParams);
    } else if (resUpper.includes('DECISION: ABORT')) {
      decision = 'abort';
      return { decision, error: res };
    } else {
      return { decision: 'error', error: "LLM failed to output a valid execution decision." };
    }

    return {
      decision,
      executionParams: params,
      messages: [{ role: 'orchestrator', content: res }]
    };
  } catch (err: any) {
    return { error: err.message, decision: 'error' };
  }
}

export async function runSwarmGraph(sessionId: string, intent: string, emit: (id: string, ev: string, data: any) => void) {
  const { swarmGraph } = await import('./graph');
  const app = swarmGraph.compile();

  console.log(`[Swarm] Starting graph for session ${sessionId} with intent: ${intent}`);
  emit(sessionId, 'log', { 
    timestamp: new Date().toISOString(),
    agent: 'Orchestrator', 
    message: `Starting swarm for intent: ${intent}`,
    type: 'info'
  });

  try {
    const stream = await app.stream({ sessionId, intent }, { streamMode: "updates" });
    
    let lastState = null;
    for await (const chunk of stream) {
      // Handle potential parallel nodes in a single chunk
      for (const nodeName of Object.keys(chunk)) {
        const output = chunk[nodeName];
        lastState = { ...lastState, ...output };

        // Immediate notification that the agent is active
        emit(sessionId, 'log', {
          timestamp: new Date().toISOString(),
          agent: nodeName,
          message: `Agent ${nodeName} is processing: ${output.messages?.[output.messages.length - 1]?.content || 'Starting task...'}`,
          type: 'info'
        });
      }
    }

    const finalState = lastState;
    
    if (!finalState || finalState.error) {
      const errorMsg = finalState?.error || "Unknown swarm error";
      console.error(`[Swarm Error] ${errorMsg}`);
      emit(sessionId, 'log', {
        timestamp: new Date().toISOString(),
        agent: 'orchestrator',
        message: `Swarm encountered an error: ${errorMsg}`,
        type: 'error'
      });
      emit(sessionId, 'error', { message: errorMsg });
    } else {
      console.log(`[Swarm] Execution successful.`);
      emit(sessionId, 'log', {
        timestamp: new Date().toISOString(),
        agent: 'orchestrator',
        message: `Swarm execution completed. Final decision: ${finalState.decision}`,
        type: 'success',
        data: { txHash: finalState.txHash }
      });
      emit(sessionId, 'completed', finalState);
    }
  } catch (err: any) {
    console.error(`[Graph Error] ${err.message}`);
    if (err.stack) console.error(err.stack);
    emit(sessionId, 'log', {
      timestamp: new Date().toISOString(),
      agent: 'Orchestrator',
      message: `Swarm crash: ${err.message}`,
      type: 'error'
    });
    emit(sessionId, 'error', { message: err.message });
  }
}
