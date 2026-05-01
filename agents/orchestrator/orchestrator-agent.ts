import { runInference } from '../shared/0g-compute-client';
import { randomUUID } from 'crypto';

export async function runOrchestrator(state: any) {
  const provider = process.env.OG_COMPUTE_PROVIDER!;
  const prompt = `You are the SwarmEx Orchestrator. 
User intent: ${state.intent}
Current state: ${JSON.stringify(state.messages)}
If you have enough information from research and risk agents, output "DECISION: execute" and a JSON string of parameters.
Otherwise, specify what to do next.`;

  try {
    const res = await runInference(provider, [{ role: 'user', content: prompt }]);
    let decision = 'continue';
    if (res.includes('DECISION: execute')) decision = 'execute';

    return {
      decision,
      messages: [{ role: 'orchestrator', content: res }]
    };
  } catch (err: any) {
    return { error: err.message, decision: 'error' };
  }
}

export async function runSwarmGraph(sessionId: string, intent: string, emit: (id: string, ev: string, data: any) => void) {
  // Requires graph.ts which we will import later
  // We'll wrap graph.invoke here.
  const { swarmGraph } = await import('./graph');
  const app = swarmGraph.compile();

  emit(sessionId, 'log', { agent: 'orchestrator', msg: `Starting swarm for intent: ${intent}` });

  try {
    // Basic synchronous invoke for hackathon
    const finalState = await app.invoke({ sessionId, intent });
    emit(sessionId, 'completed', finalState);
  } catch (err: any) {
    emit(sessionId, 'error', { message: err.message });
  }
}
