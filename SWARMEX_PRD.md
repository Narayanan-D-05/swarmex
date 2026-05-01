# SwarmEx — Product Requirements Document

Treat the PRD as a design doc, not a code reference.

> **Tagline:** "Describe the trade. The swarm executes it."
> **One-liner:** A fully autonomous multi-agent DeFi execution engine where a swarm of specialized AI agents — each with a persistent on-chain identity — coordinate, debate, and execute trades through Uniswap v4 hooks, with every inter-agent task settled via x402 micropayments and all agent memory stored on 0G.

---

## 1. The Idea — From First Principles

### The Pain Point (The Story You Tell Judges)

Every serious DeFi participant today who wants to run a systematic, data-driven strategy faces the same fragmented hell: they open TradingView for signals, a separate terminal for position monitoring, a third tool for gas estimation, a fourth for on-chain risk simulation, and they manually glue all of it together through tabs, Discord bots, and prayer. The moment they go to sleep, the strategy dies. The moment the market moves at 3am, no human is watching.

The existing "solutions" are worse. Centralized trading bots are blackboxes — you trust their dashboard, you can't verify their logic, and they have zero on-chain accountability. Smart contract automation (keepers) can trigger predefined actions but cannot *reason* — they can't read a market narrative, synthesize cross-chain sentiment, and decide to wait. And the new wave of "AI trading agents" being shown at every hackathon are demos — they call OpenAI, print a trade, and call it autonomous. There is no swarm coordination. There is no persistent memory. There is no economic accountability between agents. There is no verifiable proof that the inference actually happened.

**SwarmEx solves all of this in one coherent system.** A user describes their trading intent in a terminal-style UI. An Orchestrator Agent spawns a swarm of specialist agents — each with a persistent ERC-7857 INFT identity on 0G Chain, each storing memory on 0G Storage, each running inference through 0G Compute. The agents coordinate via structured agent-to-agent messaging, paying each other for services via x402 micropayments. When the swarm reaches consensus, it fires a trade through a custom Uniswap v4 hook that the Executor Agent controls. The hook enforces the swarm's risk parameters directly in the swap lifecycle — no separate transaction, no separate approval, no babysitting.

This is not a concept. Every part of this is a live interaction: 0G Compute runs the inference, 0G Storage stores agent memory, 0G Chain settles INFT identities, x402 handles inter-agent payments, and the Uniswap v4 hook enforces trade logic at the protocol level.

---

## 2. Why This Wins With Judges

### 0G Track — "Best DeFi App on 0G" / "Multi-Agent Orchestration"

0G's core thesis is that AI agents need verified compute, persistent memory, and on-chain settlement — the three things every other multi-agent demo at this hackathon will fake with centralized infrastructure. SwarmEx uses all three 0G primitives in ways that are *visible in the demo*:

- **0G Compute** — every agent's LLM inference call routes through the 0G Compute broker (`@0glabs/0g-serving-broker`). The UI shows the compute cost per agent in real-time.
- **0G Storage** — each agent writes its reasoning trace, past decisions, and confidence history to 0G Storage using the TypeScript SDK. This is the agent's persistent memory. When you restart a session, the agent *remembers*.
- **0G INFT (ERC-7857)** — each agent is minted as an Intelligent NFT on 0G Chain. The INFT carries the agent's encrypted prompt, persona, and accumulated decision history. Agents can be transferred, leased, or cloned. This is 0G's flagship primitive and using it guarantees attention from their judges.

The 0G team has explicitly said in their APAC hackathon materials that they want to see "agent frameworks and orchestration" and "verifiable on-chain trading" — SwarmEx is both tracks in one project.

### Uniswap Track — "Blockchain Infrastructure-Based Ideas"

Uniswap judges love hooks because hooks demonstrate a deep understanding of the v4 architecture. SwarmEx builds a `SwarmExecutorHook` that does something no other hook project will do this weekend: it accepts dynamic risk parameters injected by the agent swarm at swap time. Specifically:

- `beforeSwap` checks whether the Orchestrator Agent's consensus hash is valid and the slippage tolerance signed by the Risk Agent is within bounds.
- `afterSwap` fires a callback that logs the execution proof to 0G Storage and updates the Executor Agent's INFT performance record.

This is not a trivial hook — it actually closes the loop between off-chain AI reasoning and on-chain execution enforcement. That is the story Uniswap judges want to see.

### KeeperHub Integration

KeeperHub is a blockchain automation platform (from the original MakerDAO Keepers team) that supports x402 and MCP-native agent calls. SwarmEx uses KeeperHub for scheduled keeper tasks: when the Orchestrator Agent sets a condition like "recheck this position every 5 minutes" or "auto-compound when rewards exceed $50", those periodic on-chain triggers are registered as KeeperHub workflows. This means SwarmEx's autonomous loop is truly always-on — even when the user closes the browser, KeeperHub is firing the keeper function on-chain, and the Orchestrator Agent wakes up via webhook to re-evaluate.

KeeperHub supports x402 and MPP (Micropayment Protocol) natively, so keeper execution fees are handled the same way as all other inter-agent payments in the system — one unified payment rail.

### x402 — "Best Agentic Payment"

x402 is the economic glue. Every agent-to-agent service call in SwarmEx is paid via x402 micropayments. The Research Agent charges the Orchestrator a small fee per data call. The Risk Agent charges per evaluation. The Executor Agent charges per trade attempt. The payment ledger is visible in the UI in real-time, showing the swarm economy functioning. Judges who care about x402 will see it used not as a gimmick but as the actual coordination mechanism of the agent economy.

---

## 3. The Agent Swarm — Roles and Responsibilities

### Orchestrator Agent
The master agent. Reads the user's intent from the terminal, parses it into a structured task graph, and spawns the sub-agents. All inter-agent messages route through the Orchestrator. It holds the session wallet that receives x402 top-ups from the user and distributes micropayments to sub-agents. Its INFT on 0G stores the current session state and task graph.

### Research Agent
Fetches on-chain data: funding rates, liquidity depth, recent large trades, wallet flow signals. It calls 0G Compute for LLM synthesis of the data into a structured signal report. It charges the Orchestrator a small x402 fee per research call. Its 0G Storage entry contains its historical signal accuracy — how often its bullish/bearish calls were correct in past sessions.

### Backtester Agent
Given a proposed strategy from the Research Agent, the Backtester runs a lightweight historical simulation. It calls 0G Compute to parse strategy logic, then runs deterministic simulations against historical price data stored in 0G Storage. Returns a confidence score and win-rate estimate back to the Orchestrator.

### Risk Guard Agent
Before any trade is approved, the Risk Guard reviews the proposed swap: position size relative to portfolio, slippage tolerance, current on-chain liquidity, and whether the trade violates any user-defined rules. It produces a signed risk attestation — an EIP-712 structured message that the Uniswap v4 `SwarmExecutorHook` verifies on-chain. Without this signature, the hook reverts the swap.

### Executor Agent
The only agent with the authority to submit on-chain transactions. It constructs the swap calldata for Uniswap v4, attaches the Risk Guard's signed attestation, and submits through the `SwarmExecutorHook`. After execution, it writes the trade receipt to 0G Storage and updates its INFT performance record.

### Reporter Agent
After a trade settles, the Reporter writes a post-trade analysis back into the UI as inline terminal annotations. It also updates each agent's reputation score in the on-chain registry contract.

---

## 4. Technical Architecture

### Stack Overview

```
Frontend (Next.js 14 App Router)
  └── Terminal UI (Monaco editor + live agent log)
  └── 0G Storage SDK (@0gfoundation/0g-ts-sdk)
  └── Wagmi + viem (wallet connection, tx signing)
  └── x402 client (payment header injection)

Agent Runtime (Node.js + TypeScript)
  └── Orchestrator (LangGraph StateGraph)
  └── Sub-agents (LangGraph nodes)
  └── 0G Compute broker (@0glabs/0g-serving-broker)
  └── KeeperHub MCP client (scheduled automation)
  └── x402 server middleware (per-agent payment gating)

Smart Contracts (Solidity, Foundry)
  └── SwarmExecutorHook.sol (Uniswap v4 hook)
  └── AgentRegistry.sol (reputation + performance tracking)
  └── AgentNFT.sol (ERC-7857 INFT, forked from 0G reference)
  └── SessionTreasury.sol (x402 top-up wallet per session)

0G Infrastructure
  └── 0G Chain (INFT minting, registry reads)
  └── 0G Compute (LLM inference for all agents)
  └── 0G Storage (agent memory, trade receipts, signal history)

External
  └── Uniswap v4 PoolManager (mainnet/testnet)
  └── KeeperHub (scheduled keeper workflows)
```

---

## 5. Folder Structure

```
swarmex/
├── frontend/                        # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Landing / hero page
│   │   ├── terminal/
│   │   │   └── page.tsx             # Main agent terminal UI
│   │   └── agents/
│   │       └── [id]/page.tsx        # Individual agent INFT profile
│   ├── components/
│   │   ├── ui/
│   │   │   ├── terminal-editor.tsx  # Monaco-based strategy editor
│   │   │   ├── agent-feed.tsx       # Live agent activity stream
│   │   │   ├── payment-ledger.tsx   # x402 micropayment ticker
│   │   │   ├── agent-card.tsx       # Agent identity + reputation
│   │   │   └── swarm-status.tsx     # Real-time swarm consensus view
│   │   ├── hero.tsx                 # Hero section with mesh gradient
│   │   └── navbar.tsx
│   ├── lib/
│   │   ├── 0g-storage.ts            # 0G Storage SDK wrapper
│   │   ├── 0g-compute.ts            # 0G Compute broker client
│   │   ├── x402-client.ts           # x402 payment header builder
│   │   └── wagmi-config.ts
│   ├── styles/
│   │   └── globals.css
│   ├── public/
│   ├── package.json
│   └── next.config.ts
│
├── agents/                          # Agent runtime (Node.js)
│   ├── orchestrator/
│   │   ├── graph.ts                 # LangGraph StateGraph definition
│   │   ├── orchestrator-agent.ts    # Master agent logic
│   │   └── task-parser.ts           # Parse user intent → task graph
│   ├── research/
│   │   ├── research-agent.ts
│   │   └── data-fetchers.ts         # On-chain data, price feeds
│   ├── backtester/
│   │   └── backtester-agent.ts
│   ├── risk-guard/
│   │   ├── risk-agent.ts
│   │   └── eip712-signer.ts         # Sign risk attestation for hook
│   ├── executor/
│   │   └── executor-agent.ts        # Builds + submits Uniswap v4 swaps
│   ├── reporter/
│   │   └── reporter-agent.ts
│   ├── shared/
│   │   ├── 0g-compute-client.ts     # @0glabs/0g-serving-broker wrapper
│   │   ├── 0g-storage-client.ts     # Memory read/write per agent
│   │   ├── x402-middleware.ts       # Express middleware for agent APIs
│   │   ├── inft-client.ts           # Read/write agent INFT state
│   │   └── keeperhub-client.ts      # Register/manage keeper workflows
│   ├── server.ts                    # Express API + SSE stream for frontend
│   └── package.json
│
├── contracts/                       # Solidity contracts (Foundry)
│   ├── src/
│   │   ├── SwarmExecutorHook.sol    # Uniswap v4 hook (core contract)
│   │   ├── AgentRegistry.sol        # On-chain agent reputation
│   │   ├── AgentNFT.sol             # ERC-7857 INFT implementation
│   │   └── SessionTreasury.sol      # Per-session x402 wallet
│   ├── test/
│   │   ├── SwarmExecutorHook.t.sol
│   │   ├── AgentRegistry.t.sol
│   │   └── AgentNFT.t.sol
│   ├── script/
│   │   ├── Deploy.s.sol             # Full deployment script
│   │   └── DeployHook.s.sol         # Hook deployment (needs salt mining)
│   ├── lib/
│   │   └── v4-periphery/            # Uniswap v4 periphery (git submodule)
│   ├── foundry.toml
│   └── README.md
│
├── .env.example
├── docker-compose.yml               # Run agent runtime locally
└── README.md
```

---

## 6. Smart Contracts — Detailed Spec

### 6.1 `SwarmExecutorHook.sol`

This is the most technically impressive contract in the system and the primary hook for Uniswap prize consideration.

**What it does:** Uniswap v4 hooks run arbitrary logic before and after pool operations. `SwarmExecutorHook` intercepts swaps to verify that a valid Risk Agent attestation exists for the proposed trade before allowing execution. This means the swarm's off-chain AI decision is cryptographically enforced on-chain.

**Hook permissions needed:** `beforeSwap` and `afterSwap`.

**Key state:**
```solidity
// Mapping from session address → latest risk attestation
mapping(address => RiskAttestation) public attestations;

// Registered Risk Guard agent addresses (populated by AgentRegistry)
mapping(address => bool) public authorizedRiskAgents;

struct RiskAttestation {
    address sessionWallet;
    address tokenIn;
    address tokenOut;
    uint256 maxSlippageBps;    // e.g. 50 = 0.5%
    uint256 maxAmountIn;
    uint256 expiresAt;
    bytes32 swarmConsensusHash; // keccak of all agent outputs
    bytes signature;            // EIP-712 signed by Risk Agent
}
```

**`beforeSwap` logic:**
1. Recover the signer from the attestation signature using EIP-712.
2. Verify the signer is a registered Risk Agent in `AgentRegistry`.
3. Verify the attestation has not expired (`block.timestamp < expiresAt`).
4. Verify the swap parameters (tokenIn, tokenOut, amountIn) match the attestation.
5. If any check fails: `revert SwarmConsensusNotReached()`.

**`afterSwap` logic:**
1. Emit `SwapExecuted(sessionWallet, tokenIn, tokenOut, amountIn, amountOut, swarmConsensusHash)`.
2. Call `AgentRegistry.recordExecution(executorAgentId, swarmConsensusHash, success)` — updates the Executor Agent's performance record.

**Deployment note:** Uniswap v4 hooks must be deployed to addresses whose least significant bits encode the hook permissions. Use `CREATE2` with salt mining (Foundry's `HookMiner` utility or `cast create2`) to find a valid salt. The deploy script handles this automatically.

**Key imports:**
```solidity
import {BaseHook} from "v4-periphery/src/base/hooks/BaseHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BeforeSwapDelta} from "v4-core/types/BeforeSwapDelta.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
```

---

### 6.2 `AgentRegistry.sol`

A lightweight on-chain registry that tracks each agent's identity, type, and performance record. Deployed on 0G Chain.

**Key state:**
```solidity
struct AgentRecord {
    address inftAddress;        // ERC-7857 INFT contract address
    uint256 inftTokenId;        // Token ID
    AgentType agentType;        // RESEARCH, BACKTESTER, RISK, EXECUTOR, REPORTER
    uint256 totalExecutions;
    uint256 successfulExecutions;
    uint256 reputationScore;    // 0-10000 (basis points)
    uint256 registeredAt;
}

enum AgentType { ORCHESTRATOR, RESEARCH, BACKTESTER, RISK, EXECUTOR, REPORTER }

mapping(address => AgentRecord) public agents;   // agentWallet → record
mapping(address => address[]) public sessionAgents; // sessionWallet → agents
```

**Key functions:**
- `registerAgent(address agentWallet, address inftAddress, uint256 tokenId, AgentType agentType)` — called during session initialization.
- `recordExecution(address agentWallet, bytes32 consensusHash, bool success)` — called by the hook's `afterSwap`.
- `getReputationScore(address agentWallet) → uint256` — read by Orchestrator to select agents.

---

### 6.3 `AgentNFT.sol` (ERC-7857 INFT)

Forked and adapted from the 0G Foundation's reference implementation at `github.com/0gfoundation/0g-agent-nft`. Each agent in SwarmEx is minted as an INFT at session initialization. The INFT's encrypted metadata (stored on 0G Storage) contains the agent's prompt, persona, and past decision log.

**Why this matters for judges:** ERC-7857 is 0G's flagship agent primitive. Using it correctly — with the encryption, transfer, and authorized-usage flows — demonstrates deep integration with 0G's stack, not just surface-level API calls.

**Key customizations from base:**
- `authorizeExecution(address executor, uint256 tokenId)` — grants the SwarmExecutorHook permission to act on behalf of this agent's INFT for one session.
- `updateAgentMemoryRoot(uint256 tokenId, bytes32 storageRoot)` — updates the 0G Storage root hash in the INFT metadata, called after each session by the Reporter Agent.

---

### 6.4 `SessionTreasury.sol`

A minimal escrow contract per trading session. The user deposits USDC into the SessionTreasury at session start. The Orchestrator Agent's wallet is the designated spender. x402 micropayments between agents debit from this treasury. Any unspent USDC can be withdrawn by the user at any time.

**Key functions:**
- `deposit(uint256 amount)` — user deposits USDC.
- `debit(address agent, uint256 amount, bytes32 taskId)` — Orchestrator debits for x402 payments.
- `withdraw()` — user withdraws remaining balance.
- `getBalance() → uint256`

---

## 7. Agent Runtime — Detailed Spec

### 7.1 LangGraph Orchestration

The agent runtime uses LangGraph's `StateGraph` to define the swarm's execution graph. The state object flows through each agent node and accumulates their outputs.

```typescript
interface SwarmState {
  sessionId: string;
  userIntent: string;
  parsedStrategy: ParsedStrategy | null;
  researchReport: ResearchReport | null;
  backtestResult: BacktestResult | null;
  riskAttestation: RiskAttestation | null;
  consensusReached: boolean;
  executionReceipt: ExecutionReceipt | null;
  agentLogs: AgentLog[];
  x402Payments: Payment[];
}
```

**Graph nodes:** `parse_intent → research → backtest → risk_guard → consensus_check → execute → report`

**Conditional edge:** After `consensus_check`, if `consensusReached === false`, the graph loops back to `research` with the rejection reason injected into the Research Agent's context (max 3 retries before surfacing to user).

### 7.2 0G Compute Integration

Every LLM call in the agent runtime goes through the 0G Compute broker:

```typescript
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';

const broker = await createZGComputeNetworkBroker(signer, '0g-chain-rpc');
const { endpoint, model } = await broker.getServiceMetadata(providerAddress);
const headers = await broker.getRequestHeaders(providerAddress, 'billing-content');

const response = await fetch(`${endpoint}/v1/chat/completions`, {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, messages: agentMessages, max_tokens: 1000 })
});

const responseId = response.headers.get('ZG-Res-Key');
await broker.processResponse(providerAddress, responseId, usage);
```

Each agent has its own billing context so compute costs are tracked per agent and displayed in the UI.

### 7.3 0G Storage — Agent Memory

Each agent writes its reasoning trace to 0G Storage after every decision:

```typescript
import { Indexer, MemData } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';

const indexer = new Indexer('https://indexer-storage-testnet-turbo.0g.ai');

async function writeAgentMemory(agentId: string, memory: AgentMemory) {
  const encoded = new TextEncoder().encode(JSON.stringify(memory));
  const memData = new MemData(encoded);
  const [tree] = await memData.merkleTree();
  const [tx, err] = await indexer.upload(memData, RPC_URL, signer);
  // Store rootHash in AgentNFT on-chain for future retrieval
  await agentNFT.updateAgentMemoryRoot(agentTokenId, tree.rootHash());
  return tree.rootHash();
}

async function readAgentMemory(rootHash: string): Promise<AgentMemory> {
  const err = await indexer.download(rootHash, '/tmp/agent-mem.json', true);
  const raw = fs.readFileSync('/tmp/agent-mem.json', 'utf-8');
  return JSON.parse(raw);
}
```

This is what makes agents *persistent* — they remember their past calls, accuracy rates, and reasoning chains across sessions by reading their 0G Storage entries at startup.

### 7.4 x402 Inter-Agent Payments

The agent server exposes HTTP endpoints for each agent. Each endpoint is gated by x402 middleware:

```typescript
import { x402Middleware } from 'x402-express';

// Research agent endpoint — costs 0.002 USDC per call
app.use('/agent/research', x402Middleware({
  amount: '2000',          // 0.002 USDC in micro-units
  currency: 'USDC',
  recipient: RESEARCH_AGENT_WALLET,
  network: 'base-sepolia'
}));

app.post('/agent/research', async (req, res) => {
  const { strategy, sessionId } = req.body;
  const report = await researchAgent.run(strategy, sessionId);
  res.json(report);
});
```

The Orchestrator calls each agent's endpoint with the x402 payment headers pre-populated from the SessionTreasury. The frontend shows each debit in real-time via SSE.

### 7.5 KeeperHub Integration

When the user enables "always-on" mode, the Orchestrator registers a KeeperHub workflow:

```typescript
import { KeeperHubClient } from './keeperhub-client';

const keeper = new KeeperHubClient({ apiKey: process.env.KEEPERHUB_API_KEY });

await keeper.createWorkflow({
  name: `SwarmEx session ${sessionId}`,
  trigger: 'cron: */5 * * * *',    // every 5 minutes
  steps: [
    { action: 'http.post', url: `${AGENT_SERVER}/orchestrator/wake`, 
      body: { sessionId, trigger: 'keeper' } }
  ],
  payment: { method: 'x402', wallet: sessionTreasuryAddress }
});
```

KeeperHub calls the orchestrator endpoint every 5 minutes (or on a custom schedule). The Orchestrator Agent wakes up, reads its 0G Storage memory, re-evaluates the current market conditions, and either holds or proposes a new trade to the swarm.

---

## 8. Frontend — Detailed Spec

### 8.1 Design System

**Theme:** Dark background (`#080C14`), electric blue primary (`#2563EB` to `#3B82F6`), subtle grid/noise texture on backgrounds. Mesh gradient on hero only — not on components. All other components use solid fills with tight borders.

**Typography:**
- Headlines, labels, UI chrome: `Space Grotesk` (weights 400, 500, 600)
- Code, terminal content, addresses, hashes: `Space Mono` (weight 400)
- Body text: `Space Grotesk` 400

**Component style:** Minimalist. Cards have `1px solid rgba(255,255,255,0.08)` borders, `background: rgba(255,255,255,0.03)`. No rounded corners larger than `8px`. No gradient fills on components. Button primary: solid `#2563EB` with 1px border, hover darkens. Button secondary: transparent with `1px solid rgba(255,255,255,0.15)`.

**Install fonts:**
```bash
npm install @fontsource/space-grotesk @fontsource/space-mono
```

```css
/* globals.css */
@import '@fontsource/space-grotesk/400.css';
@import '@fontsource/space-grotesk/500.css';
@import '@fontsource/space-grotesk/600.css';
@import '@fontsource/space-mono/400.css';

:root {
  --bg-base: #080C14;
  --bg-card: rgba(255, 255, 255, 0.03);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-tertiary: #475569;
  --accent-blue: #3B82F6;
  --accent-blue-dark: #2563EB;
  --accent-green: #10B981;
  --accent-red: #EF4444;
  --font-sans: 'Space Grotesk', sans-serif;
  --font-mono: 'Space Mono', monospace;
}

body {
  background: var(--bg-base);
  font-family: var(--font-sans);
  color: var(--text-primary);
}
```

---

### 8.2 Hero Section (`app/page.tsx`)

The hero is the only place with a mesh gradient. Use CSS `background` with radial gradients at multiple focal points to create the mesh effect — no external library needed.

```tsx
// Hero mesh gradient (pure CSS, no library)
// Place in a fixed-position ::before pseudo-element behind the hero content
const heroGradientStyle = {
  background: `
    radial-gradient(ellipse 80% 60% at 20% 50%, rgba(37, 99, 235, 0.15) 0%, transparent 60%),
    radial-gradient(ellipse 60% 80% at 80% 20%, rgba(59, 130, 246, 0.10) 0%, transparent 60%),
    radial-gradient(ellipse 40% 40% at 60% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 50%),
    #080C14
  `
};
```

**Hero content:**
- Small eyebrow tag: `SWARMEX · OPENAGENTS 2026` in `Space Mono`, uppercase, muted
- Main headline (two lines): `"Describe the trade."` / `"The swarm executes it."` — `Space Grotesk` 600, large (clamp 40px to 72px)
- Sub-copy (1 sentence): `"A fully autonomous multi-agent DeFi engine. Your strategy runs 24/7 — verified by 0G, enforced by Uniswap."`
- Two CTAs: `Launch Terminal` (primary blue button) and `View on GitHub` (secondary)
- Below fold: three stat chips in a row — `"5 Specialized Agents"`, `"0G Verified Inference"`, `"Uniswap v4 Native"` — each a small pill with mono font

---

### 8.3 Terminal Page (`app/terminal/page.tsx`)

The main application. Split into four panels:

**Panel 1 — Strategy Editor (left 40%)**
Monaco editor instance with a custom dark theme matching the site palette. The user types their strategy intent in plain English. Below the editor, a `Run Swarm` button. After execution, the Reporter Agent injects inline comments as editor decorations — green for executed trades, yellow for risk warnings, red for rejected proposals.

```tsx
import Editor from '@monaco-editor/react';

<Editor
  height="60vh"
  defaultLanguage="markdown"
  theme="swarmex-dark"   // custom theme registered via monaco.editor.defineTheme
  value={strategyContent}
  onChange={setStrategyContent}
  options={{
    fontFamily: 'Space Mono',
    fontSize: 13,
    lineHeight: 22,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
  }}
/>
```

**Panel 2 — Agent Feed (right 40%)**
A scrolling terminal-style log. Each line is an agent event. Format: `[timestamp] [AGENT_NAME] message`. Color-coded by agent: Research = blue, Backtester = purple, Risk = amber, Executor = green, Reporter = teal. Powered by SSE from the agent server.

```tsx
// SSE connection to agent server
const eventSource = new EventSource('/api/agent-stream?sessionId=' + sessionId);
eventSource.onmessage = (e) => {
  const event: AgentEvent = JSON.parse(e.data);
  setAgentLogs(prev => [...prev, event]);
};
```

**Panel 3 — x402 Payment Ledger (bottom strip)**
A horizontal scrolling ticker showing live x402 micropayments as they occur. Each entry shows: sender agent → receiver agent, amount in USDC, and the task ID. Format in `Space Mono`. Small green flash animation on new entries.

**Panel 4 — Swarm Status Bar (top bar)**
Shows: Session Treasury balance, per-agent wallet balances, swarm consensus state (THINKING / AGREED / REJECTED), and the current on-chain block number.

---

### 8.4 Agent Profile Page (`app/agents/[id]/page.tsx`)

Each agent's INFT profile. Shows: INFT token ID, agent type, reputation score (0–100%), total executions, success rate, current 0G Storage memory root hash, and a log of past decisions pulled from 0G Storage. This page is what you show judges when you want to demonstrate the persistent memory and INFT identity features.

---

## 9. Build Order — What to Build First for Demo Impact

This is the sequence optimized for having something working and impressive for the demo, not for production completeness.

**Hour 1–2: Contracts scaffolding**
Set up Foundry repo. Write `AgentRegistry.sol` first (simplest). Write `SwarmExecutorHook.sol` — even if `beforeSwap` only emits an event at first. Deploy both to a testnet (Base Sepolia or 0G testnet). Get the hook address. Verify on explorer.

**Hour 3–4: Agent runtime skeleton**
Set up Express server. Wire up the LangGraph `StateGraph` with all 5 agent nodes as stubs that just return hardcoded responses. Get SSE working to the frontend. This gives you a working stream to build the UI against.

**Hour 5–7: Frontend core**
Hero page with mesh gradient — this is fast and looks impressive. Terminal page with Monaco editor and agent feed panel. Wire SSE. Get the UI looking polished before wiring real agents — judges see the UI first.

**Hour 8–10: 0G integrations**
Replace the stub 0G Compute calls with real broker calls. Get at least the Research Agent doing real inference through 0G Compute. Wire 0G Storage write/read for at least one agent's memory. This is the core of your 0G prize story.

**Hour 11–12: Real swap flow**
Wire the Executor Agent to actually call Uniswap v4's `PoolManager` on testnet through the hook. Even one real swap through the hook is worth more than 10 mocked ones for the demo.

**Hour 13–14: x402 payments**
Add x402 middleware to each agent endpoint. Fund a session wallet. Show payments in the UI ledger. This is fast to add once the agent server is running.

**Hour 15–16: KeeperHub + INFT**
Register one KeeperHub workflow. Mint one INFT on 0G Chain. Show the agent profile page. Polish.

**Final hours: Demo prep**
Write a compelling demo script. Prepare a 60-second "why this matters" pitch. Record a backup screen recording in case live demo breaks.

---

## 10. Environment Variables

```bash
# .env.example

# 0G
OG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
OG_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
OG_COMPUTE_PROVIDER=<provider-address>
AGENT_PRIVATE_KEY=<agent-wallet-private-key>
USER_PRIVATE_KEY=<user-wallet-private-key>

# Uniswap v4
POOL_MANAGER_ADDRESS=<uniswap-v4-pool-manager-on-testnet>
HOOK_ADDRESS=<deployed-hook-address>

# x402
X402_FACILITATOR_URL=https://x402.org/facilitator
SESSION_TREASURY_ADDRESS=<deployed-treasury-address>

# KeeperHub
KEEPERHUB_API_KEY=<api-key>
KEEPERHUB_API_URL=https://api.keeperhub.com

# Agent server
AGENT_SERVER_PORT=3001
NEXT_PUBLIC_AGENT_SERVER=http://localhost:3001

# Contracts (post-deployment)
AGENT_REGISTRY_ADDRESS=<deployed-registry-address>
AGENT_NFT_ADDRESS=<deployed-nft-address>
```

---

## 11. Key Dependencies

### Frontend (`frontend/package.json`)
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "typescript": "^5.4.0",
    "@monaco-editor/react": "^4.6.0",
    "wagmi": "^2.12.0",
    "viem": "^2.18.0",
    "@tanstack/react-query": "^5.51.0",
    "@0gfoundation/0g-ts-sdk": "latest",
    "ethers": "^6.13.0",
    "@fontsource/space-grotesk": "^5.0.0",
    "@fontsource/space-mono": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "framer-motion": "^11.0.0"
  }
}
```

### Agents (`agents/package.json`)
```json
{
  "dependencies": {
    "@langchain/langgraph": "^0.2.0",
    "@langchain/core": "^0.3.0",
    "@0glabs/0g-serving-broker": "^0.7.4",
    "@0gfoundation/0g-ts-sdk": "latest",
    "ethers": "^6.13.0",
    "express": "^4.21.0",
    "x402-express": "latest",
    "viem": "^2.18.0",
    "zod": "^3.23.0",
    "tsx": "^4.16.0"
  }
}
```

### Contracts (`contracts/foundry.toml`)
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.26"

[dependencies]
forge-std = "https://github.com/foundry-rs/forge-std"
v4-core = "https://github.com/Uniswap/v4-core"
v4-periphery = "https://github.com/Uniswap/v4-periphery"
openzeppelin-contracts = "https://github.com/OpenZeppelin/openzeppelin-contracts"
```

---

## 12. The Demo Script (60 seconds)

> "Right now, if I want to run a systematic trade — say, go long ETH when funding rates are negative and risk is low — I need five different tools, five logins, and I have to be awake to watch it. One mistake at 3am and I'm liquidated.
>
> In SwarmEx, I type my intent here [type in editor]. I hit Run Swarm. Watch what happens.
>
> The Orchestrator spawns five specialist agents. The Research Agent fetches funding rate data — and right now it's paying the data provider via x402, you can see the micropayment here [point to ledger]. The Backtester runs a 30-day simulation against historical data stored on 0G. The Risk Guard reviews the position and signs a cryptographic attestation — without this signature, the swap literally cannot happen on-chain.
>
> Consensus reached. The Executor submits a real swap through our Uniswap v4 hook. The hook verifies the Risk Guard's signature in `beforeSwap`. Trade confirmed.
>
> Every agent remembers this decision. Their memory is on 0G Storage, their identity is an INFT on 0G Chain, and their reputation score just updated in our on-chain registry.
>
> And because we registered a KeeperHub workflow — this entire swarm will re-evaluate my position every five minutes, even when I'm asleep.
>
> That's SwarmEx. The first trading system where the agents have provable identity, persistent memory, and economic skin in the game."

---

## 13. Pitch Angles Per Sponsor Judge

| Sponsor | What to emphasize |
|---|---|
| **0G Labs** | ERC-7857 INFT per agent, 0G Compute for all inference (with broker billing), 0G Storage as agent memory (show rootHash on chain), 0G Chain for registry. Use every layer of the stack. |
| **Uniswap** | `SwarmExecutorHook` with `beforeSwap` attestation verification. Emphasize that AI consensus is *enforced at the protocol level*, not just suggested off-chain. This is a novel use of hooks nobody has done. |
| **KeeperHub** | Always-on autonomous loop via keeper workflows. Agents never sleep. Show the keeper registration and a live trigger firing. |
| **x402 / CDP** | Visible payment ledger. Every agent call is metered. Frame it as "the first DeFi system where the tools pay each other by the task, not by the month." |

---

*SwarmEx — built for OpenAgents 2026*
