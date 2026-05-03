/**
 * SwarmEx Full System Diagnostic
 * Tests: 0G Storage | 0G Compute | Uniswap API | Swap Execution | KeeperHub Discord
 * Run: npx tsx --env-file=../.env test-full-diagnostic.ts
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const FAKE_SESSION = `diag-${Date.now()}`;

// ─── helpers ─────────────────────────────────────────────────────────────────
function pass(label: string, detail = '') { console.log(`  ✅ ${label}${detail ? ' — ' + detail : ''}`); }
function fail(label: string, detail = '') { console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); }
function warn(label: string, detail = '') { console.log(`  ⚠️  ${label}${detail ? ' — ' + detail : ''}`); }
function section(title: string) { console.log(`\n${'─'.repeat(55)}\n ${title}\n${'─'.repeat(55)}`); }

// ─── 1. 0G STORAGE ───────────────────────────────────────────────────────────
async function test0GStorage(): Promise<{ rootHash: string | null, storageTxHash: string | null }> {
  section('1 / 5  ·  0G Storage');
  try {
    const { uploadMemory } = await import('./shared/0g-storage-client');
    const payload = {
      test: true,
      timestamp: Date.now(),
      session: FAKE_SESSION,
      message: 'SwarmEx diagnostic upload',
    };
    console.log('  Uploading test payload to 0G Storage...');
    const uploadRes = await uploadMemory(payload);
    pass('Upload succeeded', `rootHash: ${uploadRes.rootHash.slice(0, 20)}...`);
    if (uploadRes.txHash) pass('Transaction succeeded', `txHash: ${uploadRes.txHash}`);
    console.log(`  Explorer: https://storagescan-newton.0g.ai`);
    return { rootHash: uploadRes.rootHash, storageTxHash: uploadRes.txHash };
  } catch (e: any) {
    fail('0G Storage upload failed', e.message);
    return { rootHash: null, storageTxHash: null };
  }
}

// ─── 2. 0G COMPUTE ───────────────────────────────────────────────────────────
async function test0GCompute(): Promise<{ computeOk: boolean, computeResult: string | null }> {
  section('2 / 5  ·  0G Compute (AI Inference)');
  const provider = process.env.OG_COMPUTE_PROVIDER;
  if (!provider) { fail('OG_COMPUTE_PROVIDER not set'); return { computeOk: false, computeResult: null }; }

  try {
    const { initializeProvider, runInference } = await import('./shared/0g-compute-client');
    console.log(`  Provider: ${provider}`);
    console.log('  Initializing provider...');
    await initializeProvider(provider);
    console.log('  Running inference: "Analyze ETH/USDC sentiment"');
    const result = await runInference(provider, [{ role: 'user', content: 'Analyze the current market sentiment for ETH/USDC on Base Sepolia. Reply with a short sentence.' }]);
    pass('Inference succeeded', `response: "${result.trim().slice(0, 60)}"`);
    return { computeOk: true, computeResult: result.trim() };
  } catch (e: any) {
    fail('0G Compute inference failed', e.message);
    return { computeOk: false, computeResult: null };
  }
}

// ─── 3. UNISWAP API ──────────────────────────────────────────────────────────
async function testUniswapAPI(): Promise<boolean> {
  section('3 / 5  ·  Uniswap API (Pricing)');
  const apiKey = process.env.UNISWAP_API_KEY;
  if (!apiKey) { fail('UNISWAP_API_KEY not set'); return false; }

  // Mainnet WETH→USDC for price discovery (researcher uses this)
  try {
    const res = await fetch('https://trade-api.gateway.uniswap.org/v1/quote', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenInChainId: 1, tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        tokenOutChainId: 1, tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        amount: '1000000000000000000', type: 'EXACT_INPUT',
        swapper: '0x0000000000000000000000000000000000000001',
      }),
    });
    if (res.ok) {
      const d = await res.json();
      const out = (Number(d.quote?.output?.amount || 0) / 1e6).toFixed(2);
      pass('Mainnet price quote (ETH→USDC)', `1 ETH ≈ $${out} USDC`);
    } else {
      fail(`Mainnet quote failed ${res.status}`, await res.text());
      return false;
    }
  } catch (e: any) {
    fail('Uniswap API unreachable', e.message);
    return false;
  }

  warn('Testnet execution calldata not available via Trade API (expected — testnet has no indexed liquidity)',
       'Swap execution uses on-chain SDK calldata instead');
  return true;
}

// ─── 4. SWAP EXECUTION ───────────────────────────────────────────────────────
async function testSwapExecution(): Promise<string | null> {
  section('4 / 5  ·  Swap Execution (ETH → USDC on Base Sepolia)');

  const { createPublicClient, createWalletClient, http, defineChain,
          encodeFunctionData, encodeAbiParameters, parseAbi, parseAbiParameters, formatEther } = await import('viem');
  const { privateKeyToAccount } = await import('viem/accounts');

  const baseSepolia = defineChain({
    id: 84532, name: 'Base Sepolia',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] } },
    blockExplorers: { default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' } },
  });

  if (!process.env.USER_PRIVATE_KEY) { fail('USER_PRIVATE_KEY not set'); return null; }

  const account      = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() });

  const ethBalance = await publicClient.getBalance({ address: account.address });
  console.log(`  Wallet: ${account.address}`);
  console.log(`  ETH balance: ${formatEther(ethBalance)} ETH`);

  if (ethBalance < 5000000000000000n) { // < 0.005 ETH
    fail('Insufficient ETH balance for gas + swap');
    return null;
  }

  // Swap 0.001 ETH → USDC (small test amount)
  const SWAP_AMOUNT   = 1000000000000000n; // 0.001 ETH
  const UNIVERSAL_ROUTER = (process.env.UNIVERSAL_ROUTER_ADDRESS || '0x492e6456d9528771018deb9e87ef7750ef184104') as `0x${string}`;
  const NATIVE_ETH    = '0x0000000000000000000000000000000000000000' as `0x${string}`;
  const USDC_ADDR     = (process.env.SEPOLIA_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`;

  const POOL_KEY = {
    currency0: NATIVE_ETH,
    currency1: USDC_ADDR,
    fee: 500,
    tickSpacing: 10,
    hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  };

  const actions = new Uint8Array([0x06, 0x0c, 0x0e]); // SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE

  const swapParams = encodeAbiParameters(
    parseAbiParameters([
      '(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey',
      'bool zeroForOne', 'uint128 amountIn', 'uint128 amountOutMinimum', 'bytes hookData',
    ]),
    [POOL_KEY, true, SWAP_AMOUNT, 0n, '0x' as `0x${string}`],
  );

  const settleParams = encodeAbiParameters(
    parseAbiParameters(['address currency', 'uint256 amount']),
    [NATIVE_ETH, SWAP_AMOUNT],
  );
  const takeParams = encodeAbiParameters(
    parseAbiParameters(['address currency', 'address recipient', 'uint256 amount']),
    [USDC_ADDR, account.address, 0n],
  );

  const v4Actions = `0x${Buffer.from(actions).toString('hex')}` as `0x${string}`;
  const urInput = encodeAbiParameters(
    parseAbiParameters(['bytes', 'bytes[]']),
    [v4Actions, [swapParams, settleParams, takeParams]]
  );

  const deadline  = BigInt(Math.floor(Date.now() / 1000) + 300);
  const commands  = '0x10' as `0x${string}`; // V4_SWAP
  const calldata  = encodeFunctionData({
    abi: parseAbi(['function execute(bytes commands, bytes[] inputs, uint256 deadline) payable']),
    functionName: 'execute',
    args: [commands, [urInput], deadline],
  });

  try {
    console.log(`  Sending 0.001 ETH → USDC via UniversalRouter...`);
    const txHash = await walletClient.sendTransaction({
      to: UNIVERSAL_ROUTER, data: calldata, value: SWAP_AMOUNT, gas: 500000n,
    });
    console.log(`  Waiting for receipt...`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === 'success') {
      console.log(`  ✅ Swap successful!`);
      console.log(`  Explorer: https://sepolia.basescan.org/tx/${txHash}`);
      return txHash;
    } else {
      console.log(`  ❌ Swap reverted on-chain — https://sepolia.basescan.org/tx/${txHash}`);
      console.log(`  ⚠️  Pool may not be initialized for ETH/USDC on this deployment of Base Sepolia PoolManager`);
      return null;
    }
  } catch (err: any) {
    console.log(`  ❌ Swap execution failed:`, err.message || err);
    if (err.walk) {
      const revertError = err.walk((e: any) => e.name === 'ContractFunctionExecutionError' || e.name === 'CallExecutionError');
      if (revertError) {
        console.log(`  Revert details:`, revertError.shortMessage || revertError.message);
      }
    }
    return null;
  }
}

// ─── 5. 0G AGENT REGISTRY ──────────────────────────────────────────────────────
async function testAgentRegistry(): Promise<string | null> {
  section('5 / 6  ·  0G Agent Registry');
  const { ethers } = await import('ethers');
  const REGISTRY_ABI = [
    'function recordExecution(address agentWallet, bool success) external',
    'function agents(address) view returns (address inftAddress, uint256 tokenId, uint8 agentType, uint256 executionCount, uint256 successCount, uint256 reputationBps, bool isRegistered)',
  ];

  if (!process.env.AGENT_PRIVATE_KEY || !process.env.AGENT_REGISTRY_ADDRESS) {
    warn('Agent Registry skipped', 'AGENT_PRIVATE_KEY or AGENT_REGISTRY_ADDRESS missing');
    return null;
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai');
    const wallet   = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
    const registry = new ethers.Contract(process.env.AGENT_REGISTRY_ADDRESS, REGISTRY_ABI, wallet);

    console.log(`  Checking registry for agent ${wallet.address}...`);
    const agentRecord = await registry.agents(wallet.address);
    if (!agentRecord.isRegistered) {
      warn('Agent not registered', 'Skipping recordExecution call');
      return null;
    }

    console.log('  Recording execution on 0G Galileo Testnet...');
    const tx = await registry.recordExecution(wallet.address, true);
    console.log(`  Waiting for receipt...`);
    const receipt = await tx.wait();
    pass('Registry update successful', `Tx: ${receipt.hash}`);
    return receipt.hash;
  } catch (err: any) {
    fail('Agent Registry update failed', err.message);
    return null;
  }
}

// ─── 6. KEEPERHUB DISCORD ────────────────────────────────────────────────────
async function testKeeperHub(txHash: string | null, rootHash: string | null, storageTxHash: string | null, registryTxHash: string | null, computeResult: string | null): Promise<void> {
  section('6 / 6  ·  KeeperHub → Discord Notification');

  const apiKey     = process.env.KEEPERHUB_API;
  const webhookKey = process.env.KEEPERHUB_API_USER;
  if (!apiKey || !webhookKey) {
    fail('KEEPERHUB_API or KEEPERHUB_API_USER missing from .env');
    return;
  }

  // Build the 3-link message
  const swapLink     = txHash   ? `https://sepolia.basescan.org/tx/${txHash}`   : '_(no swap tx — test mode)_';
  
  let storageProofLines = [];
  if (storageTxHash) {
    storageProofLines = [
      `🗄 **0G Storage Proof Transaction**`,
      `https://chainscan-galileo.0g.ai/tx/${storageTxHash}`,
      ...(rootHash ? [`*Root Hash: \`${rootHash}\`*`] : []),
      ``
    ];
  } else {
    storageProofLines = [
      `🗄 **0G Storage Proof**`,
      `https://storagescan-galileo.0g.ai/`,
      ...(rootHash ? [`*Root Hash: \`${rootHash}\`*`] : ['_(storage unavailable)_']),
      ``
    ];
  }

  const computeLines = computeResult ? [
    `🧠 **0G Compute Inference**`,
    `_Response: "${computeResult}"_`,
    `[View Compute Provider](https://chainscan-galileo.0g.ai/address/${process.env.OG_COMPUTE_PROVIDER})`,
    ``
  ] : [];

  const registryAddr = process.env.AGENT_REGISTRY_ADDRESS || '0x25C9e89a0Be824f87C78589F17140bbC960ed178';
  let registryLink = `https://chainscan-galileo.0g.ai/address/${registryAddr}`;
  if (registryTxHash) {
    registryLink = `https://chainscan-galileo.0g.ai/tx/${registryTxHash}`;
  }

  const message = [
    `✅ **SwarmEx Diagnostic — All Systems Checked**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `**Session:** \`${FAKE_SESSION}\``,
    ``,
    `⚡ **Uniswap v4 Swap (Base Sepolia)**`,
    swapLink,
    ``,
    ...storageProofLines,
    ...computeLines,
    `🛡 **0G Agent Registry (0G Galileo)**`,
    registryLink,
    ``,
    `_SwarmEx · 0G Galileo Testnet · Uniswap v4 · KeeperHub_`,
  ].join('\n');

  const WORKFLOW_ID = process.env.KEEPERHUB_WORKFLOW_ID || '6k8kkgb8v5gqh7gquriql';
  const DISCORD_ID  = process.env.KEEPERHUB_DISCORD_ID  || 'libp44j88ukrimww72zac';

  // 1. Patch workflow with dynamic 3-link message
  console.log('  Patching KeeperHub workflow with 3 links...');
  try {
    const patchRes = await fetch(`https://app.keeperhub.com/api/workflows/${WORKFLOW_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        nodes: [
          {
            id: 'webhook-trigger', type: 'trigger',
            data: { type: 'trigger', label: 'SwarmEx Trade Event', config: { triggerType: 'Webhook' }, status: 'idle' },
            position: { x: 100, y: 100 },
          },
          {
            id: 'discord-action', type: 'action',
            data: {
              type: 'action', label: 'Discord Trade Alert', status: 'idle',
              config: { actionType: 'discord/send-message', integrationId: DISCORD_ID, discordMessage: message },
            },
            position: { x: 400, y: 100 },
          },
        ],
        edges: [{ id: 'e1', source: 'webhook-trigger', target: 'discord-action' }],
      }),
    });

    if (!patchRes.ok) {
      const t = await patchRes.text();
      fail(`PATCH failed ${patchRes.status}`, t.slice(0, 200));
      return;
    }
    pass('Workflow patched with 3-link message');

    // 2. Trigger webhook to fire Discord message
    console.log('  Triggering KeeperHub webhook...');
    const triggerRes = await fetch(`https://app.keeperhub.com/api/workflows/${WORKFLOW_ID}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${webhookKey}` },
      body: JSON.stringify({ event: 'swarm_diagnostic', sessionId: FAKE_SESSION }),
    });

    const triggerText = await triggerRes.text();
    if (!triggerRes.ok) {
      fail(`Webhook trigger failed ${triggerRes.status}`, triggerText.slice(0, 200));
      return;
    }

    let data: any = {};
    try { data = JSON.parse(triggerText); } catch {}
    pass('Webhook triggered', `executionId: ${data.executionId || 'N/A'}`);
    console.log('  Discord message should appear in your server within ~10 seconds.');
    console.log('  Message preview:');
    console.log(message.split('\n').map(l => '    ' + l).join('\n'));

  } catch (e: any) {
    fail('KeeperHub error', e.message);
  }
}

// ─── RUN ALL ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     SwarmEx Full System Diagnostic                  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`Session: ${FAKE_SESSION}\n`);

  const { rootHash, storageTxHash } = await test0GStorage();
  const { computeOk, computeResult } = await test0GCompute();
  const uniswapOk = await testUniswapAPI();
  const txHash    = await testSwapExecution();
  const registryTxHash = await testAgentRegistry();
  await testKeeperHub(txHash, rootHash, storageTxHash, registryTxHash, computeResult);

  section('Summary');
  console.log(`  0G Storage:       ${rootHash  ? '✅ Working' : '❌ Failed'}`);
  console.log(`  0G Compute:       ${computeOk  ? '✅ Working' : '❌ Failed'}`);
  console.log(`  Uniswap API:      ${uniswapOk  ? '✅ Working (pricing)' : '❌ Failed'}`);
  console.log(`  Swap Execution:   ${txHash     ? '✅ Confirmed — ' + txHash.slice(0,18) + '...' : '❌ Failed / Reverted'}`);
  console.log(`  Agent Registry:   ${registryTxHash ? '✅ Confirmed — ' + registryTxHash.slice(0,18) + '...' : '❌ Failed / Skipped'}`);
  console.log(`  KeeperHub:        check Discord`);
  console.log('');
}

main().catch(e => { console.error('\nFATAL:', e); process.exit(1); });
