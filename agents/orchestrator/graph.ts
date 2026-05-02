import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { runOrchestrator, runIntentParser } from './orchestrator-agent';
import { runResearcher } from '../researcher/researcher-agent';
import { runLearningAgent } from '../learning/learning-agent';
import { runExecutor } from '../executor/executor-agent';
import { runReporter } from '../reporter/reporter-agent';

const StateAnnotation = Annotation.Root({
  sessionId: Annotation<string>(),
  intent: Annotation<string>(),
  parsedIntent: Annotation<any>(),
  marketIntelligence: Annotation<any>(),
  learningParams: Annotation<any>(),
  messages: Annotation<{role: string, content: string}[]>({
    reducer: (curr, act) => {
      try {
        return curr.concat(act);
      } catch (err: any) {
        console.error(`[Reducer Error] ${err.message}`);
        return curr;
      }
    },
    default: () => []
  }),
  currentAgent: Annotation<string>(),
  decision: Annotation<string>(),
  executionParams: Annotation<string | null>(),
  txHash: Annotation<string | null>(),
  error: Annotation<string | null>()
});

export const swarmGraph = new StateGraph(StateAnnotation)
  .addNode("intentParser", runIntentParser)
  .addNode("researcher", runResearcher)
  .addNode("RiskAgent", runLearningAgent)
  .addNode("orchestrator", runOrchestrator)
  .addNode("executor", runExecutor)
  .addNode("reporter", runReporter)
  .addEdge(START, "intentParser")
  .addConditionalEdges("intentParser", (state) => {
    if (state.error) return END;
    return "researcher";
  })
  .addEdge("researcher", "RiskAgent")
  .addEdge("RiskAgent", "orchestrator")
  .addConditionalEdges("orchestrator", (state) => {
    if (state.error) return END; // Includes abort decision
    if (state.decision === 'execute') return "executor";
    return END; 
  })
  .addEdge("executor", "reporter")
  .addEdge("reporter", END);
