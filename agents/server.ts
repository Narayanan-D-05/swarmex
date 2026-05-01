import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { x402Gate, setPaymentEmitter } from './shared/x402-gate';
import { notifyKeeperHubOfNewSession } from './shared/keeperhub-client';
import { runSwarmGraph } from './orchestrator/orchestrator-agent';
import { runInference } from './shared/0g-compute-client';
import { signRiskAttestation } from './risk-guard/eip712-signer';

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Bug #18 fix: per-session SSE client registry
const sseClients = new Map<string, express.Response[]>();

function emitToSession(sessionId: string, event: string, data: unknown) {
  const clients = sseClients.get(sessionId) ?? [];
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => res.write(payload));
}

// Bug #22 fix: SSE route explicitly in table
app.get('/stream/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': 'http://localhost:3000',
  });
  res.write('data: {"type":"connected"}\n\n');

  // Register client
  const existing = sseClients.get(sessionId) ?? [];
  sseClients.set(sessionId, [...existing, res]);

  // Bug #27 note: client must handle reconnect — server sends 'ping' every 15s
  const ping = setInterval(() => res.write('event: ping\ndata: {}\n\n'), 15000);

  req.on('close', () => {
    clearInterval(ping);
    const clients = sseClients.get(sessionId)?.filter(c => c !== res) ?? [];
    sseClients.set(sessionId, clients);
  });
});

app.post('/orchestrator/run', async (req, res) => {
  const sessionId = randomUUID();
  await notifyKeeperHubOfNewSession(sessionId);
  // Start LangGraph graph asynchronously
  runSwarmGraph(sessionId, req.body.intent, emitToSession).catch(console.error);
  res.json({ sessionId });
});

app.post('/orchestrator/wake', (req, res) => {
  // KeeperHub webhook callback — re-evaluates idle sessions
  res.json({ received: true });
});

// Wire SSE payment emitter so x402Gate can push to Payment Ledger panel
setPaymentEmitter((sessionId, claim) => emitToSession(sessionId, 'payment', claim));

// x402-gated agent endpoints (REAL execution paths replacing mocks)
app.use(x402Gate);

app.post('/agent/research', async (req, res) => {
  try {
    const analysis = await runInference(process.env.OG_COMPUTE_PROVIDER!, [
      { role: 'user', content: `Analyze the following query: ${req.body.query}` }
    ]);
    res.json({ result: analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/agent/backtest', async (req, res) => {
  try {
    const outcome = await runInference(process.env.OG_COMPUTE_PROVIDER!, [
      { role: 'user', content: `Perform a historical backtest of this strategy: ${req.body.strategy}` }
    ]);
    res.json({ result: outcome });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/agent/risk', async (req, res) => {
  try {
    if (!process.env.RISK_AGENT_PRIVATE_KEY) throw new Error("RISK_AGENT_PRIVATE_KEY is missing");
    
    // Create actual EIP-712 risk attestation based on payload
    const attestation = {
      sessionWallet: req.body.sessionWallet,
      tokenIn: req.body.tokenIn,
      tokenOut: req.body.tokenOut,
      maxSlippageBps: req.body.maxSlippageBps,
      maxAmountIn: req.body.maxAmountIn,
      expiresAt: Math.floor(Date.now() / 1000) + 3600, // +1 hour
      swarmConsensusHash: req.body.swarmConsensusHash || '0x0000000000000000000000000000000000000000000000000000000000000000'
    };
    
    const signature = await signRiskAttestation(process.env.RISK_AGENT_PRIVATE_KEY, attestation);
    
    res.json({ attestation, signature });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Agent server listening on ${PORT}`);
});
