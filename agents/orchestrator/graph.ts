import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { runOrchestrator } from './orchestrator-agent';
import { runExecutor } from '../executor/executor-agent';
import { runReporter } from '../reporter/reporter-agent';

// Define graph state using Annotation.Root (Bug #17 live fix — stable in 0.2.x)
const StateAnnotation = Annotation.Root({
  sessionId: Annotation<string>(),
  intent: Annotation<string>(),
  messages: Annotation<{role: string, content: string}[]>({
    reducer: (curr, act) => curr.concat(act),
    default: () => []
  }),
  currentAgent: Annotation<string>(),
  decision: Annotation<string>(),
  txHash: Annotation<string | null>(),
  error: Annotation<string | null>()
});

export const swarmGraph = new StateGraph(StateAnnotation)
  .addNode("orchestrator", runOrchestrator)
  .addNode("executor", runExecutor)
  .addNode("reporter", runReporter)
  .addEdge(START, "orchestrator")
  .addConditionalEdges("orchestrator", (state) => {
    if (state.error) return END;
    if (state.decision === 'execute') return "executor";
    return "orchestrator"; // Loop back for more deliberation
  })
  .addEdge("executor", "reporter")
  .addEdge("reporter", END);
