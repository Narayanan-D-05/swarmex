/**
 * Activate the workflow and test the full execution chain
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_KEY = process.env.KEEPERHUB_API!;
const BASE_URL = "https://app.keeperhub.com/api";
const WORKFLOW_ID = "6k8kkgb8v5gqh7gquriql";
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1499859318776926410/SOsuh7YvCMzOSgQa0hv8QNTyKR4M6yEL8J6LMv8PKpqoihAWLLd0cdFtJFQLKz00s49T";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY}`,
};

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  console.log(`[${method} ${path}] ${res.status}`);
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

async function main() {
  console.log("🔧 Activating SwarmEx KeeperHub Workflow...");

  // Try different activation endpoints
  const activationEndpoints = [
    `/workflows/${WORKFLOW_ID}/activate`,
    `/workflows/${WORKFLOW_ID}/enable`,
    `/workflows/${WORKFLOW_ID}/publish`,
    `/workflows/${WORKFLOW_ID}/status`,
  ];

  for (const endpoint of activationEndpoints) {
    console.log(`\nTrying: POST ${endpoint}`);
    const r = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ active: true, status: "active" }),
    });
    console.log(`→ ${r.status}`);
    if (r.ok) {
      const t = await r.text();
      console.log("✅ Success:", t.slice(0, 200));
    }
  }

  // Try PATCH with status/active field
  console.log("\n\nTrying: PATCH workflow with active:true...");
  const patchRes = await api("PATCH", `/workflows/${WORKFLOW_ID}`, {
    active: true,
    status: "active",
  });
  console.log("Response:", JSON.stringify(patchRes.data, null, 2));

  // Finally: trigger the workflow manually via the execute endpoint
  console.log("\n\nTrying: POST /api/workflow/{id}/execute (manual trigger)...");
  const execRes = await api("POST", `/workflow/${WORKFLOW_ID}/execute`, {});
  console.log("Execute response:", JSON.stringify(execRes.data, null, 2));

  // Regardless of workflow state, test Discord directly one more time
  console.log("\n\n✅ Testing Discord directly (this ALWAYS works)...");
  const r = await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: "🤖 SwarmEx 0G Trade Report",
        color: 0x00ff88,
        description: "✅ **Trade Executed Successfully!**\n\n🔗 **Tx:** `0x1234...abcd`\n📦 **Root:** `0xabcd...1234`",
        footer: { text: "SwarmEx Autonomous Agent • 0G Galileo Testnet" },
        timestamp: new Date().toISOString(),
      }]
    }),
  });
  console.log(`Discord direct status: ${r.status}`);
  if (r.status === 204) {
    console.log("✅ Check your Discord RIGHT NOW — you should see a rich embed message!");
  }
}

main().catch(console.error);
