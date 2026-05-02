/**
 * Step 1: Inspect the real node config schema from KeeperHub
 * - Download our current workflow
 * - Browse public workflows to find ones with Discord, Schedule, HTTP, Webhook nodes
 * - Log the full config so we can use the exact field names
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

const headers = { Authorization: `Bearer ${API_KEY}` };

async function api(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

async function main() {
  // 1. Download our current workflow
  console.log("=== OUR WORKFLOW (download) ===");
  const dl = await api(`/workflows/${WORKFLOW_ID}/download`);
  console.log(JSON.stringify(dl.data, null, 2));

  // 2. List public workflows to find ones with proper node configs
  console.log("\n=== PUBLIC WORKFLOWS (first 3 IDs) ===");
  const pub = await api("/workflows/public");
  const publicWfs: any[] = Array.isArray(pub.data) ? pub.data.slice(0, 3) : [];
  for (const wf of publicWfs) {
    console.log(`\n--- ${wf.name} (${wf.id}) ---`);
    console.log("Nodes:", JSON.stringify(wf.nodes, null, 2));
  }
}

main().catch(console.error);
