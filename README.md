# SwarmEx — Autonomous Multi-Agent DeFi Execution Engine

> **Production deployment:** https://swarmex.onrender.com  
> **Frontend terminal:** https://swarmex.vercel.app/terminal  
> **KeeperHub workflow:** https://app.keeperhub.com — Workflow ID: `6k8kkgb8v5gqh7gquriql`

---

## What is SwarmEx?

SwarmEx is a fully autonomous, cryptographically-verifiable DeFi execution engine. You type a plain-English command — `swap 0.001 eth to usdc` — and a swarm of AI agents cooperate to research the market, assess risk, sign the trade, execute the on-chain swap, and archive a permanent proof. Every single step is verifiable on-chain with three public links:

1. **BaseScan** — the actual Uniswap v4 swap transaction  
2. **0G Storage** — an immutable audit log archived on a decentralised storage network  
3. **0G Compute** — the AI inference result from a decentralised compute provider

No centralized oracle. No human in the loop. Just agents.

---

## The Idea

DeFi is powerful but fragmented. A typical trader must:
- Monitor market conditions manually
- Calculate slippage and risk parameters themselves
- Approve tokens, sign transactions, wait for confirmations
- Archive logs manually for compliance

SwarmEx replaces all of that with a **swarm of specialized AI agents** that operate autonomously within a LangGraph state machine. Each agent has a single, cryptographically-attested responsibility. The swarm reaches consensus before any funds move on-chain.

The result is a system that is:
- **Trustless** — every decision is signed with EIP-712 attestations
- **Autonomous** — operates via scheduled KeeperHub triggers, no human needed
- **Auditable** — every execution produces 3 verifiable on-chain links
- **Composable** — agents communicate via a typed state graph

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SwarmEx System                                  │
│                                                                         │
│   Discord / Frontend Terminal                                           │
│          │                                                              │
│          ▼                                                              │
│   ┌─────────────┐     ┌──────────────────────────────────────────┐    │
│   │  KeeperHub  │────▶│            Agent Server                  │    │
│   │  Workflow   │     │      (Express + SSE streaming)           │    │
│   │  Scheduler  │     └──────────────┬───────────────────────────┘    │
│   └─────────────┘                    │                                 │
│                                      ▼                                 │
│                          ┌───────────────────────┐                    │
│                          │    LangGraph Swarm     │                    │
│                          │   (State Machine)      │                    │
│                          └───────────┬───────────┘                    │
│                                      │                                 │
│          ┌────────────┬──────────────┼─────────────┬───────────┐      │
│          ▼            ▼              ▼             ▼           ▼      │
│    Intent Parser  Researcher    Risk Agent   Orchestrator  Executor   │
│          │            │              │             │           │       │
│          └────────────┴──────────────┴─────────────┘           │       │
│                                                                 │       │
│                                      ┌──────────────────────────┘       │
│                                      ▼                                 │
│                              ┌──────────────┐                         │
│                              │   Reporter   │                         │
│                              └──────┬───────┘                         │
│                                     │                                  │
│          ┌──────────────────────────┼───────────────────────┐         │
│          ▼                          ▼                        ▼         │
│   Uniswap v4 (Base Sepolia)   0G Storage              0G Compute      │
│   BaseScan Link               Storage Proof           Inference Link   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Swarm — Roles & Responsibilities

```
╔══════════════════════════════════════════════════════════════════════╗
║                     THE SWARM — 6 AGENTS                            ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  01 ◆ INTENT PARSER                                                  ║
║     Converts plain-English commands into typed JSON intents          ║
║     Input:  "swap 0.001 eth to usdc"                                 ║
║     Output: { tokenIn: ETH, tokenOut: USDC, amount: 0.001 }         ║
║                                                                      ║
║  02 ◆ MARKET RESEARCHER                                              ║
║     Fetches live price quotes from Uniswap API                       ║
║     Checks on-chain liquidity depth of the Base Sepolia pool         ║
║     Output: apiQuote, poolDepth, hasLiquidity                        ║
║                                                                      ║
║  03 ◆ RISK GUARDIAN (EIP-712 Signer)                                 ║
║     Assesses volatility, slippage risk, profit thresholds            ║
║     Signs a cryptographic EIP-712 Risk Attestation                   ║
║     Output: riskAttestation { signature, maxSlippageBps, ... }       ║
║                                                                      ║
║  04 ◆ SWARM SUPERVISOR (Orchestrator)                                ║
║     Reads all agent outputs. Makes the final EXECUTE or ABORT call   ║
║     Uses 0G Compute (AI inference) for the final decision            ║
║     Output: decision = "execute" | "abort"                           ║
║                                                                      ║
║  05 ◆ EXECUTION CORE (Executor)                                      ║
║     Verifies the EIP-712 Risk Attestation signature                  ║
║     Encodes and broadcasts the Uniswap v4 swap via UniversalRouter   ║
║     Output: txHash (Base Sepolia BaseScan)                           ║
║                                                                      ║
║  06 ◆ METRICS REPORTER                                               ║
║     Archives the execution log to 0G decentralised storage           ║
║     Updates the 0G Agent Registry                                    ║
║     Notifies KeeperHub / Discord with the 3 verifiable links         ║
║     Output: rootHash, storageTxHash, registryTxHash                  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Sequence Diagram

```
User / Discord          KeeperHub         Agent Server          Blockchain
     │                      │                   │                    │
     │─── "swap 0.001 eth ──▶│                   │                    │
     │     to usdc"          │                   │                    │
     │                       │── POST /run ──────▶│                    │
     │                       │   { intent }       │                    │
     │                       │                   │─ runIntentParser ──▶│ (off-chain)
     │                       │                   │◀─ parsedIntent ─────│
     │                       │                   │                    │
     │                       │                   │─ runResearcher ────▶│ Uniswap API
     │                       │                   │◀─ marketIntelligence│ + RPC check
     │                       │                   │                    │
     │                       │                   │─ runLearningAgent ─▶│ (off-chain)
     │                       │                   │◀─ riskAttestation ──│ EIP-712 sig
     │                       │                   │                    │
     │                       │                   │─ runOrchestrator ──▶│ 0G Compute
     │                       │                   │◀─ decision: execute │
     │                       │                   │                    │
     │                       │                   │─ runExecutor ──────▶│ UniversalRouter
     │                       │                   │                     │ .execute()
     │                       │                   │◀─ txHash ───────────│ Base Sepolia
     │                       │                   │                    │
     │                       │                   │─ runReporter ──────▶│ 0G Storage
     │                       │                   │◀─ rootHash ─────────│ + 0G Registry
     │                       │                   │                    │
     │                       │◀─ notifyKeeperHub ─│                    │
     │◀── ✅ 3 links ─────────│                   │                    │
     │    BaseScan            │                   │                    │
     │    0G Storage          │                   │                    │
     │    0G Compute          │                   │                    │
```

---

## Data Flow — How a Swap Moves Through the System

```
   ┌──────────────────────────────────────────────────────────────┐
   │                    STATE GRAPH (LangGraph)                   │
   │                                                              │
   │  START                                                       │
   │    │                                                         │
   │    ▼                                                         │
   │  intentParser ──────────────────────────────────────────┐   │
   │    │  { parsedIntent }                                   │   │
   │    │                                                     │   │
   │    ├──────────────────┐                                  │   │
   │    ▼                  ▼                                  │   │
   │  researcher        RiskAgent                             │   │
   │  (market data)     (EIP-712 sign)                        │   │
   │    │                  │                                  │   │
   │    └────────┬─────────┘                                  │   │
   │             ▼                                            │   │
   │         orchestrator                                     │   │
   │         (AI consensus)                                   │   │
   │             │                                            │   │
   │      ┌──────┴──────┐                                     │   │
   │      ▼             ▼                                     │   │
   │   executor      reporter ◀──── on abort / error ─────────┘   │
   │   (on-chain)       │                                         │
   │      │             ▼                                         │
   │      └──────▶  reporter                                      │
   │                   │                                          │
   │                  END                                         │
   └──────────────────────────────────────────────────────────────┘
```

---

## Multi-Chain Architecture

```
  ┌─────────────────────────────┐     ┌───────────────────────────────┐
  │       BASE SEPOLIA           │     │         0G TESTNET             │
  │   (Execution Layer)          │     │   (Intelligence + Storage)     │
  │                              │     │                                │
  │  Uniswap v4 Pool Manager     │     │  0G Compute Provider           │
  │  0x05E73354cFDd6745C338b...  │     │  0xa48f01287233509FD694...     │
  │                              │     │                                │
  │  Universal Router            │     │  0G Storage Indexer            │
  │  0x492e6456d9528771018d...   │     │  indexer-storage-testnet-      │
  │                              │     │  turbo.0g.ai                   │
  │  USDC Token                  │     │                                │
  │  0x036CbD53842c5426634e...   │     │  Agent Registry                │
  │                              │     │  0x25C9e89a0Be824f87C785...    │
  │  Permit2                     │     │                                │
  │  0x000000000022D473030F...   │     │  Session Treasury              │
  │                              │     │  0x12Af0d9b7E5BFAE7cB5F...    │
  └─────────────────────────────┘     └───────────────────────────────┘
              │                                        │
              └────────────────┬───────────────────────┘
                               │
                    ┌──────────────────────┐
                    │   Agent Server        │
                    │  swarmex.onrender.com │
                    │   Node.js + Express   │
                    └──────────────────────┘
```

---

## KeeperHub Automation

SwarmEx runs autonomously without any human input via **KeeperHub** — a no-code workflow automation platform.

```
  KeeperHub Workflow: 6k8kkgb8v5gqh7gquriql
  ═════════════════════════════════════════

  [TRIGGER 1] SwarmEx Trade Event (Webhook)
       │  Receives trade results from Reporter Agent
       ▼
  [ACTION 1] Discord Trade Alert
       │  Posts success/failure with 3 verifiable links to Discord

  [TRIGGER 2] 5-Minute Heartbeat (Scheduled)
       │  Fires every 5 minutes to keep agents awake on Render
       ▼
  [ACTION 2] Wake SwarmEx Agents
       │  POST /orchestrator/wake → triggers market monitoring

  [TRIGGER 3] discord_trigger (Discord on-message)
       │  Listens for user messages in the SwarmEx Discord channel
       ▼
  [ACTION 3] Discord-to-Swarm Execute
       │  POST /orchestrator/run with { intent: "<user message>" }
       ▼
  [ACTION 4] Discord Acknowledgment
       │  Replies "🚀 SwarmEx Session Started" to the Discord channel
```

**Webhook URL:** `https://app.keeperhub.com/api/workflows/6k8kkgb8v5gqh7gquriql/webhook`

---

## Contract Addresses

### Base Sepolia (Uniswap v4 — Execution)

| Contract | Address |
|---|---|
| Pool Manager | `0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408` |
| Universal Router | `0x492e6456d9528771018deb9e87ef7750ef184104` |
| USDC Token | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

### 0G Testnet (Storage + Registry)

| Contract | Address |
|---|---|
| Agent Registry | `0x25C9e89a0Be824f87C78589F17140bbC960ed178` |
| Session Treasury | `0x12Af0d9b7E5BFAE7cB5F6ACF7C05725239A95c00` |
| Compute Provider | `0xa48f01287233509FD694a22Bf840225062E67836` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Agent Orchestration | LangGraph (TypeScript) |
| Transport | Express.js + Server-Sent Events (SSE) |
| On-Chain Execution | Viem + Uniswap v4 UniversalRouter |
| Cryptographic Attestation | EIP-712 signatures (ethers.js) |
| AI Inference | 0G Compute Network |
| Decentralised Storage | 0G Storage Network |
| Agent Registry | 0G Chain smart contract |
| Automation | KeeperHub (workflow scheduler) |
| Discord Integration | KeeperHub Discord trigger |
| Frontend | Next.js 14 + Framer Motion |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Repository Structure

```
openagents/
├── agents/                         # Backend agent server
│   ├── executor/
│   │   └── executor-agent.ts       # Uniswap v4 swap execution
│   ├── orchestrator/
│   │   ├── graph.ts                # LangGraph state machine
│   │   └── orchestrator-agent.ts   # Swarm supervisor + SSE emitter
│   ├── researcher/
│   │   └── researcher-agent.ts     # Market data + liquidity checks
│   ├── reporter/
│   │   └── reporter-agent.ts       # 0G Storage + KeeperHub notify
│   ├── risk-guard/
│   │   └── eip712-signer.ts        # EIP-712 cryptographic attestations
│   ├── learning/
│   │   └── learning-agent.ts       # Risk assessment agent
│   ├── shared/
│   │   ├── 0g-compute-client.ts    # 0G inference wrapper
│   │   ├── 0g-storage-client.ts    # 0G storage upload
│   │   ├── keeperhub-client.ts     # KeeperHub notification client
│   │   └── x402-gate.ts            # x402 payment gating
│   ├── scripts/
│   │   ├── create-keeperhub-workflow.ts  # Workflow provisioner
│   │   ├── activate-keeperhub.ts         # Workflow activator
│   │   ├── check-env-liquidity.ts        # Liquidity diagnostic
│   │   └── check-live-balance.ts         # Wallet balance check
│   ├── server.ts                   # Express server entry point
│   └── test-full-diagnostic.ts     # End-to-end test suite
│
├── frontend/                       # Next.js frontend
│   └── app/
│       ├── terminal/
│       │   └── page.tsx            # Live swarm terminal UI
│       └── page.tsx                # Landing page
│
├── .env.example                    # Environment variable template
└── README.md                       # This file
```

---

## How to Use

### Option 1 — Frontend Terminal (Easiest)

1. Open **https://swarmex.vercel.app/terminal**
2. Type your intent in the **Prediction Query** box at the bottom-left:
   ```
   swap 0.001 eth to usdc
   ```
3. Click **Deploy Swarm** (or press Enter)
4. Watch the agent swarm execute in real-time — each node lights up as it activates
5. On completion, a success banner appears with **3 verifiable links**

### Option 2 — Discord Command

1. Join the SwarmEx Discord server
2. In the designated channel, type:
   ```
   Swap 0.001 eth to usdc
   ```
3. The bot acknowledges with `🚀 SwarmEx Session Started`
4. Within ~60 seconds, you receive `✅ SwarmEx Trade Executed` with all 3 links

### Option 3 — Direct API Call

```bash
curl -X POST https://swarmex.onrender.com/orchestrator/run \
  -H "Content-Type: application/json" \
  -d '{ "intent": "swap 0.001 eth to usdc", "sessionId": "my-session-1" }'
```

Stream live logs via SSE:
```bash
curl -N https://swarmex.onrender.com/stream/my-session-1
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- A funded wallet on Base Sepolia testnet
- A funded wallet on 0G Testnet

### 1. Clone & Install

```bash
git clone https://github.com/Narayanan-D-05/swarmex.git
cd swarmex

# Install backend dependencies
cd agents && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in `.env` with your values:

```env
# 0G Chain
OG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
OG_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
OG_COMPUTE_PROVIDER=0xa48f01287233509FD694a22Bf840225062E67836

# Base Sepolia
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Your wallets (never commit real keys)
USER_PRIVATE_KEY=0x...
AGENT_PRIVATE_KEY=0x...
RISK_AGENT_PRIVATE_KEY=0x...

# Uniswap v4 contracts (Base Sepolia)
POOL_MANAGER_ADDRESS=0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408
UNIVERSAL_ROUTER_ADDRESS=0x492e6456d9528771018deb9e87ef7750ef184104
SEPOLIA_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# 0G contracts
AGENT_REGISTRY_ADDRESS=0x25C9e89a0Be824f87C78589F17140bbC960ed178

# KeeperHub
KEEPERHUB_WEBHOOK_TRIGGER_URL=https://app.keeperhub.com/api/workflows/.../webhook
KEEPERHUB_WORKFLOW_ID=...
KEEPERHUB_API=...
```

### 3. Fund Your Wallets

| Network | Faucet |
|---|---|
| Base Sepolia ETH | https://www.alchemy.com/faucets/base-sepolia |
| Base Sepolia USDC | https://faucet.circle.com |
| 0G Testnet A0GI | https://faucet.0g.ai |

### 4. Run the Agent Server

```bash
cd agents
npm start
# Server starts on http://localhost:3001
```

### 5. Run the Frontend

```bash
cd frontend
npm run dev
# Frontend at http://localhost:3000
```

### 6. Set Up KeeperHub Workflow

```bash
cd agents
npx tsx scripts/create-keeperhub-workflow.ts
npx tsx scripts/activate-keeperhub.ts
```

### 7. Run Full Diagnostic

```bash
cd agents
npx tsx test-full-diagnostic.ts
```

This tests all 6 agents, the Uniswap v4 swap, 0G storage, and 0G compute in sequence.

---

## Verifying a Trade

Every successful trade produces 3 on-chain verifiable proofs:

```
  ✅ SwarmEx Trade Executed
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⚡ LINK 1: Uniswap v4 Swap (Base Sepolia)
  https://sepolia.basescan.org/tx/<txHash>
  → Proves the actual ETH→USDC token transfer on-chain

  🗄  LINK 2: 0G Storage Proof
  https://chainscan-galileo.0g.ai/tx/<storageTxHash>
  Root Hash: 0x...
  → Immutable archive of the full execution log

  🧠 LINK 3: 0G Compute Inference
  https://chainscan-galileo.0g.ai/address/0xa48f012...
  → The AI inference call that made the EXECUTE decision
```

---

## Deployment

### Backend (Render)

The agent server is deployed on Render at **https://swarmex.onrender.com**.

To redeploy, push to the `main` branch. Render auto-deploys from GitHub.

**Critical environment variables to set in Render Dashboard:**

| Variable | Value |
|---|---|
| `POOL_MANAGER_ADDRESS` | `0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408` |
| `UNIVERSAL_ROUTER_ADDRESS` | `0x492e6456d9528771018deb9e87ef7750ef184104` |
| `SEPOLIA_USDC_ADDRESS` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| `AGENT_REGISTRY_ADDRESS` | `0x25C9e89a0Be824f87C78589F17140bbC960ed178` |
| `OG_COMPUTE_PROVIDER` | `0xa48f01287233509FD694a22Bf840225062E67836` |

### Frontend (Vercel)

The Next.js frontend is deployed on Vercel. Set:

```env
NEXT_PUBLIC_AGENT_SERVER_URL=https://swarmex.onrender.com
```

---

## Security Notes

- **Private keys** are stored as Render environment secrets, never in source code
- **EIP-712 attestations** ensure the Risk Agent has cryptographically approved every trade
- **Slippage protection** is automatically tuned per network (disabled on testnet, strict on mainnet)
- The `.env` file is in `.gitignore` and must **never** be committed

---

## License

MIT — built for the 0G AI Agent Hackathon.
