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
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || "";

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

  // Regardless of workflow state, test KeeperHub Webhook directly
  console.log("\n\n✅ Testing KeeperHub Webhook Trigger...");
  const webhookUrl = process.env.KEEPERHUB_WEBHOOK_TRIGGER_URL || `${BASE_URL}/workflows/${WORKFLOW_ID}/webhook`;
  const r = await fetch(webhookUrl, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      type: "diagnostic_test",
      message: "🤖 **SwarmEx Diagnostic Test**\nKeeperHub Webhook is working correctly!"
    }),
  });
  console.log(`KeeperHub webhook status: ${r.status}`);
  if (r.ok) {
    console.log("✅ KeeperHub Webhook Triggered! Check your Discord if you have a Discord node configured.");
  }
}

main().catch(console.error);
