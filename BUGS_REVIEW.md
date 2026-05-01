# SwarmEx Implementation Plan — Critical Bug & Gap Review

> Sources: `SWARMEX_PRD.md`, `OG.md`, `uniswap.md`, `keeperhub.md`
> Based on reading all four reference documents thoroughly.

---

## CRITICAL — Will Produce Broken Code or Wrong Behavior

### 1. `MemData` Does Not Exist in `@0gfoundation/0g-ts-sdk`
**File:** `SWARMEX_PRD.md:357`
```
import { Indexer, MemData } from '@0gfoundation/0g-ts-sdk';
const memData = new MemData(encoded);
const [tree] = await memData.merkleTree();
const [tx, err] = await indexer.upload(memData, RPC_URL, signer);
```
OG.md TypeScript SDK section uses `ZgFile.fromBuffer()` — not `MemData`. The Go SDK also uses `ZgFile` (called `transfer.UploadOption` / `ZkFile`). `MemData` is either renamed, removed, or never existed in the published SDK. The correct pattern from OG.md:
```typescript
const buffer = Buffer.from(JSON.stringify(data));
const [zgFile, err] = await ZgFile.fromBuffer(buffer, 'application/json');
const [tx, uploadErr] = await indexer.upload(zgFile, 'https://evmrpc-testnet.0g.ai', signer);
```
The `0g-storage-client.ts` in the implementation plan correctly cites `ZgFile` — but the **PRD section 7.3 uses `MemData`**, meaning every agent's memory upload code would be written against the wrong API. Fix the PRD and ensure the agent runtime uses `ZgFile`.

Same issue in `SWARMEX_PRD.md:364–366`. This propagates into any developer who copies from the PRD.

---

### 2. x402 Middleware Function Name Mismatch
**PRD shows** (`SWARMEX_PRD.md:386`):
```typescript
import { x402Middleware } from 'x402-express';
app.use('/agent/research', x402Middleware({ ... }));
```
**Implementation plan shows** (`x402-middleware.ts`):
```typescript
import { paymentMiddleware } from '@x402/express';
```
These are two different import paths (`x402-express` vs `@x402/express`) and two different function names (`x402Middleware` vs `paymentMiddleware`). Either the package exports both, or the plan won't compile. The PRD's own code snippet shows `x402Middleware` — the plan changed it to `paymentMiddleware` without justification. Unify: use exactly what the PRD shows: `import { x402Middleware } from 'x402-express'`.

Also note: the plan adds `@x402/express` to dependencies but the PRD uses `x402-express`. Both may exist as aliases, but this is an unverified assumption.

---

### 3. 0G Compute — Provider Address Never Populated
**File:** `agents/shared/0g-compute-client.ts`

The code calls `broker.inference.getServiceMetadata(providerAddress)` but **never shows how `providerAddress` is obtained**. The broker must be initialized with a provider first. The correct discovery flow from OG.md:

1. `const services = await broker.inference.listService()` — returns available providers
2. Pick a provider from the list
3. `await broker.inference.acknowledgeProviderSigner(providerAddress)` — required before first use (OG.md section 7.2)
4. Then call `getServiceMetadata(providerAddress)`

The implementation plan skips步骤 1 entirely. Without a known `providerAddress`, `getServiceMetadata` returns undefined fields, and all subsequent inference calls fail silently or route to the wrong endpoint.

Also: OG.md Troubleshooting section lists **"Error: Provider not acknowledged"** as a common error — confirming the acknowledgment step is mandatory and easy to miss.

---

### 4. `beforeSwap` Return Typed Incorrectly
**File:** `contracts/src/SwarmExecutorHook.sol`

In Uniswap v4, `beforeSwap` must return `BeforeSwapDelta`. The plan says:
```solidity
return BeforeSwapDeltaLibrary.ZERO_DELTA;
```
OG.md's `SwarmExecutorHook` section uses `BeforeSwapDeltaLibrary.ZERO_DELTA` which is correct. However, `BeforeSwapDeltaLibrary` is only available in v4-core v1.x. In older versions it might be `BeforeSwapDeltaLibrary.toBeforeSwapDelta(0, 0)`. Verify the actual v4-core version installed via `forge install` — the API changed between minor versions.

---

### 5. `afterSwap` Cannot Make Cross-Chain Calls
**File:** `contracts/src/SwarmExecutorHook.sol` lines 14–15:
```solidity
// 1. Emit SwapExecuted(...)
// 2. Call AgentRegistry.recordExecution(...) // on 0G testnet!
```
`AgentRegistry.sol` is deployed on **0G testnet** (chainId 16602). `SwarmExecutorHook` is on **Base Sepolia**. `afterSwap` executes as part of the swap's atomic execution context within the PoolManager. Making a external CALL to a contract on a different chain IS NOT possible — there is no cross-chain messaging in this pattern. 

Either:
- `recordExecution` must be called by the Executor Agent off-chain after the swap confirms (not in the hook), or
- A messaging桥 (LayerZero, Wormhole, etc.) must be added, which the plan doesn't include

The PRD's spec is internally contradictory. The hook is Base-Sepolia-only (for Uniswap v4 access), while AgentRegistry is 0G-only (for INFT minting). There is no bridge described.

---

### 6. `processResponse` — Third Argument `usage` Never Defined
**File:** `agents/shared/0g-compute-client.ts`

OG.md section 7.2 shows:
```typescript
await broker.processResponse(providerAddress, responseId, usage);
```
The `usage` parameter (token usage counts: `{ prompt_tokens, completion_tokens }`) must come from the LLM response JSON. But the implementation plan's fetch call:
```typescript
const json = await response.json();
const content = json.choices[0].message.content;
```
Never extracts `usage` from `json.usage`. The `processResponse` call will be passed an undefined variable. Fix: extract and pass `json.usage` from the LLM response:
```typescript
const usage = json.usage; // { prompt_tokens, completion_tokens, total_tokens }
await broker.processResponse(providerAddress, responseId, usage);
```

---

### 7. `HookMiner.find()` API Unspecified
**File:** `contracts/script/Deploy.s.sol`

The PRD says to use "Foundry's `HookMiner` utility or `cast create2`" for salt mining. The implementation plan references `HookMiner.find()`. But:
- `HookMiner` is in the `HookTools` library (` @uniswap/hook-util` or similar), which is NOT in the forge dependencies installed in the plan
- The `find()` signature is `function find(address deployer, uint256 permissions, bytes32 salt) returns (address, uint256)` — not confirmed
- Budgeting "~10 minutes" is optimistic for finding a valid salt — worst case can be hours on weak hardware

**Must add to forge dependencies:**
```bash
forge install uniswap/hook-util
```
And verify the `HookMiner` API before writing the deployment script.

---

### 8. Session State Lost on Agent Server Restart
**File:** `agents/orchestrator/graph.ts`

LangGraph `StateGraph` state is held in-memory in the Express/Node.js process. The plan does not persist sessions to disk, a database, or 0G Storage. If the agent server crashes or restarts:
- All in-flight swarm sessions are lost
- The Orchestrator cannot resume — it has no knowledge of pending sessions
- The frontend SSE connection drops with no recovery

The plan describes reading 0G Storage "at startup" for agent memory (past decisions), but NOT for active session state. A session restore mechanism is needed:
```typescript
// On startup: check 0G Storage for any PENDING sessions for this wallet
// If found, resume from the last saved State + re-trigger consensus
```

---

## SIGNIFICANT — Architectural Gaps and Missing Concerns

### 9. ERC20/USDC Approval Flow Absent
The `SessionTreasury.deposit()` assumes the user has already approved the treasury to spend their USDC. But there is no `approve()` step in the UX flow. User → `SessionTreasury.deposit()` will revert if they haven't first called `usdc.approve(sessionTreasury, amount)`. The plan must include an on-chain approval transaction before deposit, or use `Permit2` (which the Uniswap side already sets up).

### 10. SessionTreasury x402 Routing Is a Black Box
The PRD says "x402 micropayments between agents debit from this treasury" but never explains HOW. The SessionTreasury is an on-chain contract; x402 is an HTTP payment header mechanism. These are completely different layers:
- x402 payments are HTTP headers (`X-Payment-Amount`, `X-Payment-Recipient`)
- SessionTreasury debiting requires an on-chain transaction from the Orchestrator's wallet

The Orchestrator must pay agents via HTTP calls with x402 headers, then ALSO call `SessionTreasury.debit(...)` on-chain for the same amount. If these get out of sync, the ledger is wrong. The plan shows no code for keeping these two systems in sync.

### 11. KeeperHub — No Programmatic Workflow Creation (PRD vs Plan Conflict)
The keeperhub.md is explicit: KeeperHub is a "visual workflow builder" — no REST API for programmatic workflow creation is documented. The plan correctly identifies this in the `keeperhub-client.ts` description (says it's a "thin wrapper that POSTs to the user-configured webhook URL"). 

**However**, the PRD Section 7.5 shows:
```typescript
await keeper.createWorkflow({ name: ..., trigger: 'cron: */5 * * * *', steps: [...] });
```
This `createWorkflow()` method does not exist in KeeperHub. The implementation plan's callout box correctly notes the manual workflow setup, BUT the PRD's section 7.5 text and code directly contradict this. Anyone following the PRD will attempt `createWorkflow()` and find it doesn't work.

### 12. `inference.listService()` Response Shape Undocumented
The plan calls `broker.inference.listService()` but the OG.md never shows the return type or fields. The actual return shape (array of provider objects with `address`, `name`, `model`, `endpoint` fields?) must be reverse-engineered from the broker source or tested empirically. This is a common integration trap — mock it with caution and add types after testing.

### 13. Cross-Chain Wallet Funding Is Non-Trivial
The plan requires funded wallets on:
- **0G testnet** (for INFT minting, storage txs) 
- **Base Sepolia** (for x402 payments via SessionTreasury, Uniswap swaps)

In the real world, getting testnet funds requires:
- 0G testnet tokens from a faucet (faucet URL not in plan)
- Base Sepolia ETH from a faucet or bridge
- USDC on Base Sepolia for SessionTreasury (no automatic faucet)

The plan mentions "get from faucet" but doesn't point to actual URLs. For a hackathon demo, running out of testnet funds mid-demo is a realistic failure mode.

### 14. SWARMEX_PRD.md §7.2 Uses Wrong API Then Plan Uses Correct One
The PRD (section 7.2) shows broker initialization using `createZGComputeNetworkBroker(signer, '0g-chain-rpc')` with two arguments, but the actual API per OG.md is simply `createZGComputeNetworkBroker(wallet)` with one argument. The **implementation plan correctly uses the one-argument form**, but the PRD it references has the wrong API. This is a PRD/plan inconsistency that must be caught — don't trust PRD code snippets as gospel.

### 15. `eip712-signer.ts` — Signature Format May Need Conversion
The viem `signTypedData` returns a 65-byte signature: `(r, s, v)` where `v` is 27 or 28. OpenZeppelin's `ECDSA.recover()` expects `(bytes32 hash, bytes sig)` with `sig = r || s || v` (also 65 bytes). These should be compatible, BUT if the signature is returned as a compact signature (64 bytes, r and s only, with v derived), OZ's `toEthSignedMessageHash` may hash the message differently than viem's signing domain separator. The EIP-712 domain separator in `eip712-signer.ts` must exactly match what `SwarmExecutorHook` uses:
```solidity
EIP712({
    name: "SwarmExecutorHook",
    version: "1",
    chainId: 84532,
    verifyingContract: HOOK_ADDRESS
})
```
If the TypeScript domain doesn't match byte-for-byte (including chainId as a number vs bigint), signature recovery will fail silently and `recover == address(0)`, causing the hook to revert.

### 16. No Retry / Idempotency for Inter-Agent Calls
When the Orchestrator calls the Research Agent via HTTP (x402-gated), if the request succeeds but the response is lost (network failure before arriving), the Orchestrator retries and may double-pay via x402. No idempotency key is set on inter-agent calls. Add:
```typescript
const idempotencyKey = crypto.randomUUID();
fetch('/agent/research', {
    headers: { 'X-Idempotency-Key': idempotencyKey, ...x402Headers }
});
```

### 17. LangGraph `StateGraph` Annotation API Version Risk
The plan uses `@langchain/langgraph: "^0.2.0"` with this exact pattern:
```typescript
const SwarmState = Annotation.Root({ ... });
const graph = new StateGraph(SwarmState)
```
LangGraph's Annotation API changed significantly between 0.1.x and 0.2.x. If the installed version resolves to 0.1.x, the API is different (uses `addNode` differently, no `Annotation.Root`). Pin to an exact version or the build will silently use the wrong API.

### 18. SSE Session Isolation — All Clients Receive All Events
The SSE route is `/stream/:sessionId`:
```typescript
eventSource = new EventSource('/api/agent-stream?sessionId=' + sessionId);
```
But the server implementation must filter events BY sessionId. If the server broadcasts to all SSE connections regardless of session, a user with two tabs (two different sessions) will see cross-talk. The plan specifies per-session SSE but doesn't show the server-side `sessionId` filtering logic.

---

## MINOR — Cleanups, Polish, and Niceties

### 19. `0G Storage Indexer` URL Not in `.env.example`
The plan uses `/https://indexer-storage-testnet-turbo.0g.ai` in code but doesn't put the indexer URL in `.env.example`. Without it, different environments can't configure the correct indexer. OG.md says "Use the current values published in the network overview docs" — meaning the URL can change and must be environment-configurable.

### 20. `HOOK_ADDRESS` Set After Deployment, But Executor Agent Needs It at Build Time
The `eip712-signer.ts` uses `process.env.HOOK_ADDRESS` in the EIP-712 domain's `verifyingContract`. This is set at runtime (after deployment). If the Executor Agent's binary is built before deployment, it holds a null/zero address in the domain, meaning all signatures from the Risk Agent during testing won't verify on-chain. Build-time environment variable injection is required.

### 21. Uniswap API Key Not Required for Swap Execution
The plan includes `UNISWAP_API_KEY` from `developers.uniswap.org/dashboard`. But the actual swap execution goes through Universal Router on-chain — the API key is only needed for `GET /quote`. The Executor Agent can get quotes from other DEX aggregators or skip quotes entirely (execute at market price). The API key is optional for the core flow.

### 22. No `GET /stream/:sessionId` Route in `agents/server.ts` Table
The server route table shows:
| Route | Method | Purpose |
|---|---|---|
| `/orchestrator/run` | POST | Start new swarm session |
| `/orchestrator/wake` | POST | KeeperHub callback |
| `/stream/:sessionId` | GET | SSE stream for frontend (row missing from table) |

SSE is listed as **Panel 2** in the frontend spec but the route is omitted from the implementation plan's server route table. Add it explicitly; SSE routes need different Express handling (`res.writeHead(200, {...})`, `req.socket.destroy()` on client disconnect).

### 23. `AgentNFT.safeMint` — Who Pays Gas?
`safeMint` is called by the agent runtime (which holds `AGENT_PRIVATE_KEY`). If the INFT is being minted for a sub-agent (not the orchestrator wallet), who holds that sub-agent's private key? The plan uses the same wallet for all agents but a production version would need per-agent key management. Document that all INFTs are minted by the orchestrator wallet.

### 24. PRD Describes MCP for KeeperHub but Plan Shows Only HTTP Webhook
PRD §7.5 mentions "KeeperHub MCP client (scheduled automation)" in the stack overview. But the implementation uses plain HTTP webhooks. KeeperHub's MCP protocol is a different integration story (Model Context Protocol for AI agents). If KeeperHub has an MCP server, the KeeperHub integration could be richer — but the MCP integration is not described in keeperhub.md and shouldn't be assumed.

### 25. No Error Boundary on 0G Compute Call
If the LLM inference fails mid-stream or returns a non-200 status, the agent runtime has no try/catch and will throw, crashing the LangGraph flow. Need robust error handling:
```typescript
try {
    const result = await callZGCompute(messages);
    state.researchReport = parseReport(result);
} catch (err) {
    state.agentLogs.push({ level: 'error', message: `Research failed: ${err.message}` });
    // decide: retry or fail?
}
```

### 26. `downloadMemory` Uses `/tmp/` — Loses Data on Cold Start
```typescript
const tmpPath = `/tmp/${rootHash.slice(2, 10)}.json`;
```
`/tmp/` is RAM disk on Linux but persistent on Windows (or cleared on restart depending on hosting). More importantly, if the agent downloads multiple agent memories, they overwrite each other if the truncated hash prefix collides. Use a unique path: `rootHash.slice(2, 18)` (16 chars) or `crypto.randomUUID()`.

### 27. `SSE` reconnection not handled in frontend
If the SSE connection drops (network blip, server restart), the frontend's `EventSource` won't automatically reconnect. The `monaco-editor` and agent feed panels will freeze. Add:
```typescript
eventSource.onerror = () => {
    setTimeout(() => window.location.reload(), 3000); // or reconnect manually
};
```
Or implement manual reconnection with exponential backoff.

---

## Summary Table

| # | Severity | Category | Description |
|---|---|---|---|
| 1 | CRITICAL | API mismatch | `MemData` doesn't exist — use `ZgFile` everywhere |
| 2 | CRITICAL | API mismatch | x402 middleware import/name differs between PRD and plan |
| 3 | CRITICAL | Missing step | Provider address never populated before use |
| 4 | CRITICAL | Type error | `beforeSwap` return type depends on v4-core version |
| 5 | CRITICAL | Architecture | Hook cannot call 0G testnet from Base Sepolia in `afterSwap` |
| 6 | CRITICAL | Undefined variable | `processResponse(..., usage)` — `usage` never extracted |
| 7 | CRITICAL | Unspecified | `HookMiner.find()` API and dependency not in forge install |
| 8 | CRITICAL | Data loss | Agent server restart destroys all in-flight session state |
| 9 | SIGNIFICANT | Missing UX | USDC approval before `SessionTreasury.deposit()` not shown |
| 10 | SIGNIFICANT | Architecture | x402 header payments and on-chain treasury are not reconciled |
| 11 | SIGNIFICANT | PRD/plan conflict | PRD §7.5 shows `createWorkflow()` which doesn't exist |
| 12 | SIGNIFICANT | Unknown API | `listService()` response shape not documented anywhere |
| 13 | SIGNIFICANT | Operations | Dual testnet faucet funding not automated |
| 14 | SIGNIFICANT | PRD/plan conflict | PRD §7.2 uses wrong broker init args vs plan and actual API |
| 15 | SIGNIFICANT | Cryptography | EIP-712 domain mismatch risk between TS signer and Solidity hook |
| 16 | SIGNIFICANT | Correctness | No idempotency keys on inter-agent HTTP calls → double-payment risk |
| 17 | SIGNIFICANT | Dependency | LangGraph `Annotation.Root` API changed in 0.2.x — pin exact version |
| 18 | SIGNIFICANT | Correctness | SSE broadcasts to all connected clients, not per-session |
| 19 | MINOR | Config | Storage indexer URL missing from `.env.example` |
| 20 | MINOR | Config | `HOOK_ADDRESS` needed at build time for EIP-712 signing |
| 21 | MINOR | Config | `UNISWAP_API_KEY` optional for core swap flow |
| 22 | MINOR | Missing spec | SSE route omitted from server route table |
| 23 | MINOR | Clarification | INFT minting wallet assumption not documented |
| 24 | MINOR | PRD accuracy | MCP vs HTTP webhook for KeeperHub — PRD is unclear |
| 25 | MINOR | Error handling | No try/catch around 0G Compute calls |
| 26 | MINOR | Correctness | `downloadMemory` temp path collision risk |
| 27 | MINOR | UX | SSE reconnection not handled in frontend |

**Bottom line:** This plan has a solid architectural vision and the right high-level components. The most dangerous items are #1 (broken 0G Storage API), #5 (impossible cross-chain call from hook), #8 (session loss on restart), and #3/#6 (0G Compute pipeline is incomplete). Fix those four before writing any code, then address the PRD/plan inconsistencies.