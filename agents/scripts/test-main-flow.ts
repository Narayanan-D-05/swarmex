import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import { signRiskAttestation } from '../risk-guard/eip712-signer';
import { uploadMemory } from '../shared/0g-storage-client';
import { runInference, initializeProvider } from '../shared/0g-compute-client';
import { notifyKeeperHubOfExecution } from '../shared/keeperhub-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testMainFlow() {
  console.log("🚀 Starting SwarmEx 0G Migration Test Suite...");

  // 1. Check Environment
  console.log("\n[1/4] Checking Environment Variables...");
  const required = [
    'OG_CHAIN_RPC', 'AGENT_PRIVATE_KEY', 'RISK_AGENT_PRIVATE_KEY', 
    'HOOK_ADDRESS', 'OG_STORAGE_INDEXER', 'OG_COMPUTE_PROVIDER'
  ];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`❌ Missing ${key}`);
      process.exit(1);
    }
  }
  console.log("✅ Environment looks good.");

  // 2. Test EIP-712 Risk Attestation (Real Cryptography)
  console.log("\n[2/4] Testing EIP-712 Risk Attestation...");
  try {
    const attestation = {
      sessionWallet: '0x0000000000000000000000000000000000000001',
      tokenIn: '0x0000000000000000000000000000000000000000', // A0GI
      tokenOut: '0xF8BBc49BacD5678Fe8a03e5C97686B8614805F71', // USDC
      maxSlippageBps: 50,
      maxAmountIn: ethers.parseEther("1"),
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      swarmConsensusHash: ethers.keccak256(ethers.toUtf8Bytes("swarm-consensus-v1"))
    };
    
    const signature = await signRiskAttestation(process.env.RISK_AGENT_PRIVATE_KEY!, attestation);
    console.log(`✅ Signature generated: ${signature.slice(0, 20)}...`);
    
    // Verify locally
    const domain = {
      name: 'SwarmExecutorHook',
      version: '1',
      chainId: 16602,
      verifyingContract: process.env.HOOK_ADDRESS
    };
    const types = {
      RiskAttestation: [
        { name: 'sessionWallet', type: 'address' },
        { name: 'tokenIn', type: 'address' },
        { name: 'tokenOut', type: 'address' },
        { name: 'maxSlippageBps', type: 'uint256' },
        { name: 'maxAmountIn', type: 'uint256' },
        { name: 'expiresAt', type: 'uint256' },
        { name: 'swarmConsensusHash', type: 'bytes32' }
      ]
    };
    const recovered = ethers.verifyTypedData(domain, types, attestation, signature);
    const expected = new ethers.Wallet(process.env.RISK_AGENT_PRIVATE_KEY!).address;
    
    if (recovered.toLowerCase() === expected.toLowerCase()) {
      console.log(`✅ Signature verification successful (Signer: ${recovered})`);
    } else {
      throw new Error(`Signature mismatch! Recovered: ${recovered}, Expected: ${expected}`);
    }
  } catch (err: any) {
    console.error(`❌ EIP-712 Test Failed: ${err.message}`);
  }

  // 3. Test 0G Storage (Real Galileo Testnet)
  console.log("\n[3/4] Testing 0G Storage Upload...");
  try {
    const testData = {
      test: "SwarmEx Migration Test",
      timestamp: Date.now(),
      status: "Verified"
    };
    const rootHash = await uploadMemory(testData);
    console.log(`✅ Successfully uploaded to 0G Storage! Root Hash: ${rootHash}`);
  } catch (err: any) {
    console.error(`❌ 0G Storage Test Failed: ${err.message}`);
  }

  // 4. Test 0G Compute (Real Inference)
  console.log("\n[4/4] Testing 0G Compute Inference...");
  try {
    await initializeProvider(process.env.OG_COMPUTE_PROVIDER!);
    const result = await runInference(process.env.OG_COMPUTE_PROVIDER!, [
      { role: 'user', content: 'Say "0G SwarmEx Active"' }
    ]);
    console.log(`✅ 0G Compute response: "${result}"`);
  } catch (err: any) {
    console.error(`❌ 0G Compute Test Failed: ${err.message}`);
    console.log("💡 Tip: Ensure your AGENT_PRIVATE_KEY has A0GI and is funded in the compute ledger.");
  }

  // 5. Test KeeperHub Notification (Real Webhook -> Discord)
  console.log("\n[5/5] Testing KeeperHub & Discord Notification...");
  try {
    if (!process.env.KEEPERHUB_WEBHOOK_TRIGGER_URL) {
      console.log("⚠️ Skipping KeeperHub test: KEEPERHUB_WEBHOOK_TRIGGER_URL not found in .env");
    } else {
      console.log(`Sending mock trade report to: ${process.env.KEEPERHUB_WEBHOOK_TRIGGER_URL}`);
      await notifyKeeperHubOfExecution(
        "test-session-123",
        "success",
        {
          txHash: "0x1234567890abcdef1234567890abcdef12345678",
          rootHash: "0xabcdef1234567890abcdef1234567890abcdef12",
        }
      );
      console.log("✅ KeeperHub notification sent! Check your Discord channel.");
    }
  } catch (err: any) {
    console.error(`❌ KeeperHub Test Failed: ${err.message}`);
  }

  console.log("\n🏁 Test Suite Finished.");
}

testMainFlow().catch(console.error);
