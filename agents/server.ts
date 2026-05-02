const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { x402Gate, setPaymentEmitter } from './shared/x402-gate';
import { notifyKeeperHubOfNewSession } from './shared/keeperhub-client';
import { runSwarmGraph } from './orchestrator/orchestrator-agent';
import { runInference, initializeProvider } from './shared/0g-compute-client';
import { signRiskAttestation } from './risk-guard/eip712-signer';
import monitoringRouter from './shared/monitoring-router';

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/monitor', monitoringRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Bug #18 fix: per-session SSE client registry & log history (to avoid race conditions)
const sseClients = new Map<string, express.Response[]>();
const logHistory = new Map<string, string[]>();

function emitToSession(sessionId: string, event: string, data: unknown) {
  const clients = sseClients.get(sessionId) ?? [];
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  
  // Buffer logs so late-connecting clients still see them
  if (event === 'log') {
    const history = logHistory.get(sessionId) ?? [];
    logHistory.set(sessionId, [...history, payload]);
  }
  
  clients.forEach(res => res.write(payload));
}

// Original SSE Endpoint
app.get('/stream/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': 'http://localhost:3000',
  });
  
  // 1. Send connection ack
  res.write('data: {"type":"connected"}\n\n');

  // 2. Replay history (Fixes race condition)
  const history = logHistory.get(sessionId) ?? [];
  history.forEach(p => res.write(p));

  // 3. Register client for live updates
  const existing = sseClients.get(sessionId) ?? [];
  sseClients.set(sessionId, [...existing, res]);

  const ping = setInterval(() => res.write('event: ping\ndata: {}\n\n'), 15000);

  req.on('close', () => {
    clearInterval(ping);
    const clients = sseClients.get(sessionId)?.filter(c => c !== res) ?? [];
    sseClients.set(sessionId, clients);
  });
});

app.post('/orchestrator/run', async (req, res) => {
  const sessionId = req.body.sessionId || randomUUID();
  const { intent } = req.body;

  await notifyKeeperHubOfNewSession(sessionId);
  
  // Start LangGraph graph asynchronously
  runSwarmGraph(sessionId, intent, emitToSession).catch(err => {
    console.error(`[Server Swarm Catch] ${err.message}`);
    if (err.stack) console.error(err.stack);
  });

  res.json({ sessionId, status: 'started' });
});

app.post('/orchestrator/wake', (req, res) => {
  // KeeperHub webhook callback — re-evaluates idle sessions for continuous monitoring
  const sessionId = req.body.sessionId || randomUUID();
  console.log(`[KeeperHub] Webhook received. Waking up swarm for continuous monitoring (session ${sessionId})`);
  
  const intent = req.body.intent || "KeeperHub continuous market monitoring check";
  
  runSwarmGraph(sessionId, intent, emitToSession).catch(err => {
    console.error(`[Server Swarm Catch] ${err.message}`);
    if (err.stack) console.error(err.stack);
  });
  
  res.json({ received: true, status: 'waking', sessionId });
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

(async () => {
  try {
    if (process.env.OG_COMPUTE_PROVIDER) {
      console.log(`Initializing 0G Compute Provider...`);
      await initializeProvider(process.env.OG_COMPUTE_PROVIDER);
      console.log(`0G Compute Provider Initialized.`);
    }
    app.listen(PORT, () => {
      console.log(`Agent server listening on ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
