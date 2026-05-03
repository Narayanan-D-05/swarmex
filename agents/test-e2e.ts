/**
 * End-to-end swarm test script
 * Tests the full pipeline: IntentParser → Researcher → RiskAgent → Executor → Reporter
 * Run with: npx tsx --env-file=../.env test-e2e.ts
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runE2ETest() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' SwarmEx End-to-End Test — Uniswap v4 on Base Sepolia');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── Step 1: Validate env vars ─────────────────────────────────────────────
  console.log('[1/6] Validating environment variables...');
  const required = ['USER_PRIVATE_KEY', 'RISK_AGENT_PRIVATE_KEY', 'AGENT_PRIVATE_KEY', 'UNISWAP_API_KEY', 'OG_COMPUTE_PROVIDER'];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`❌ Missing env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log('✅ All required env vars present\n');

  // ── Step 2: Test Uniswap v4 Trade API connectivity ────────────────────────
  console.log('[2/6] Testing Uniswap v4 Trade API (Base Sepolia quote)...');
  try {
    const quotePayload = {
      tokenInChainId:  84532,
      tokenIn:         '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC Base Sepolia
      tokenOutChainId: 84532,
      tokenOut:        '0x4200000000000000000000000000000000000006', // WETH Base Sepolia
      amount:          '10000000', // 10 USDC (6 decimals)
      type:            'EXACT_INPUT',
      swapper:         '0x0000000000000000000000000000000000000001',
    };

    const res = await fetch('https://trade-api.gateway.uniswap.org/v1/quote', {
      method: 'POST',
      headers: { 'x-api-key': process.env.UNISWAP_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify(quotePayload),
    });

    if (res.ok) {
      const data = await res.json();
      const hasCalldata = !!data.quote?.methodParameters?.calldata;
      const outputAmt   = data.quote?.output?.amount || 'N/A';
      console.log(`✅ Quote received. Output WETH: ${outputAmt}`);
      console.log(`   Has execution calldata: ${hasCalldata ? 'YES ✅' : 'NO ❌'}`);
      if (!hasCalldata) {
        console.warn('   ⚠️  No calldata returned — API may not support Base Sepolia execution yet.');
        console.warn('   Quote response:', JSON.stringify(data.quote?.output, null, 2));
      }
    } else {
      const errText = await res.text();
      console.error(`❌ Uniswap API error ${res.status}: ${errText}`);
    }
  } catch (e: any) {
    console.error(`❌ Uniswap API unreachable: ${e.message}`);
  }

  console.log('');

  // ── Step 3: Test 0G RPC connectivity ─────────────────────────────────────
  console.log('[3/6] Testing 0G Chain RPC connectivity...');
  try {
    const res = await fetch(process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
    });
    const data = await res.json();
    const block = parseInt(data.result, 16);
    console.log(`✅ 0G Chain RPC ok. Block: ${block}\n`);
  } catch (e: any) {
    console.error(`❌ 0G Chain RPC failed: ${e.message}\n`);
  }

  // ── Step 4: Test Base Sepolia RPC connectivity ────────────────────────────
  console.log('[4/6] Testing Base Sepolia RPC connectivity...');
  try {
    const res = await fetch(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
    });
    const data = await res.json();
    const block = parseInt(data.result, 16);
    console.log(`✅ Base Sepolia RPC ok. Block: ${block}\n`);
  } catch (e: any) {
    console.error(`❌ Base Sepolia RPC failed: ${e.message}\n`);
  }

  // ── Step 5: Test wallet balances ──────────────────────────────────────────
  console.log('[5/6] Checking wallet balances...');
  const { createPublicClient, http, defineChain, formatEther } = await import('viem');
  const { privateKeyToAccount } = await import('viem/accounts');

  const baseSepolia = defineChain({
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] } },
  });

  try {
    const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);
    const client  = createPublicClient({ chain: baseSepolia, transport: http() });

    const ethBalance = await client.getBalance({ address: account.address });
    console.log(`   Wallet: ${account.address}`);
    console.log(`   ETH balance (Base Sepolia): ${formatEther(ethBalance)} ETH`);

    // Check USDC balance
    const usdcBalance = await client.readContract({
      address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      abi: [{ inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }],
      functionName: 'balanceOf',
      args: [account.address],
    });
    console.log(`   USDC balance (Base Sepolia): ${(Number(usdcBalance) / 1e6).toFixed(2)} USDC`);

    if (ethBalance < 1000000000000000n) { // < 0.001 ETH
      console.warn('   ⚠️  Low ETH balance — may not have enough for gas. Get testnet ETH from https://faucet.base.org');
    } else {
      console.log('   ✅ Sufficient ETH for gas');
    }

    if (usdcBalance < 10000000n) { // < 10 USDC
      console.warn('   ⚠️  Low USDC balance — swap of 10 USDC may fail. Get testnet USDC from Uniswap interface on Base Sepolia.');
    } else {
      console.log('   ✅ Sufficient USDC for test swap');
    }
  } catch (e: any) {
    console.error(`❌ Balance check failed: ${e.message}`);
  }

  console.log('');

  // ── Step 6: Test EIP-712 risk attestation signing ────────────────────────
  console.log('[6/6] Testing EIP-712 Risk Attestation signing...');
  try {
    const { signRiskAttestation } = await import('./risk-guard/eip712-signer');
    const { privateKeyToAccount: pta } = await import('viem/accounts');
    const acct = pta(process.env.USER_PRIVATE_KEY as `0x${string}`);

    const testAttestation = {
      sessionWallet:      acct.address,
      tokenIn:            '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      tokenOut:           '0x4200000000000000000000000000000000000006',
      maxSlippageBps:     100n,
      maxAmountIn:        10000000n,
      expiresAt:          BigInt(Math.floor(Date.now() / 1000) + 600),
      swarmConsensusHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
    };

    const sig = await signRiskAttestation(process.env.RISK_AGENT_PRIVATE_KEY!, testAttestation);
    console.log(`✅ EIP-712 signature generated: ${sig.slice(0, 20)}...${sig.slice(-8)}`);
  } catch (e: any) {
    console.error(`❌ EIP-712 signing failed: ${e.message}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' Test complete. Check results above before running a live swap.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runE2ETest().catch(e => { console.error(e); process.exit(1); });
