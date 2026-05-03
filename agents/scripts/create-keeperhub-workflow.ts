/**
 * Patches the existing SwarmEx workflow with the CORRECT KeeperHub node schema.
 * Schema was reverse-engineered from public workflows using the API.
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
const DISCORD_INTEGRATION_ID = "libp44j88ukrimww72zac"; // Created earlier
const RENDER_URL = "https://swarmex.onrender.com";

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
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

async function main() {
  console.log("🔧 Patching SwarmEx Workflow with Correct Node Schema...");
  console.log(`Workflow ID: ${WORKFLOW_ID}`);

  const patchRes = await api("PATCH", `/workflows/${WORKFLOW_ID}`, {
    nodes: [
      // ── Node 1: Webhook Trigger (receives trade events from our Render backend) ──
      {
        id: "webhook-trigger",
        type: "trigger",
        data: {
          type: "trigger",
          label: "SwarmEx Trade Event",
          description: "Receives POST from Render backend when a trade is executed on 0G",
          config: {
            triggerType: "Webhook",
          },
          status: "idle",
        },
        position: { x: 100, y: 100 },
      },

      // ── Node 2: Discord Action (sends trade notification to Discord) ──
      {
        id: "discord-action",
        type: "action",
        data: {
          type: "action",
          label: "Discord Trade Alert",
          description: "Sends trade result to SwarmEx Discord channel",
          config: {
            actionType: "discord/send-message",
            integrationId: DISCORD_INTEGRATION_ID,
            discordMessage:
              "🤖 **SwarmEx Trade Report**\n----------------------------\n{{@webhook-trigger:SwarmEx Trade Event.body.message}}\n\n🔗 **Tx:** https://scan-testnet.0g.ai/tx/{{@webhook-trigger:SwarmEx Trade Event.body.txHash}}\n📦 **Root:** {{@webhook-trigger:SwarmEx Trade Event.body.rootHash}}",
          },
          status: "idle",
        },
        position: { x: 400, y: 100 },
      },

      // ── Node 3: Schedule Trigger (fires every 5 min to keep Render alive) ──
      {
        id: "schedule-trigger",
        type: "trigger",
        data: {
          type: "trigger",
          label: "5-Min Heartbeat",
          description: "Keeps the Render free-tier server awake 24/7",
          config: {
            triggerType: "Schedule",
            schedule: "*/5 * * * *",
          },
          status: "idle",
        },
        position: { x: 100, y: 380 },
      },

      // ── Node 4: HTTP Action (calls /orchestrator/wake on the Render server) ──
      {
        id: "wake-action",
        type: "action",
        data: {
          type: "action",
          label: "Wake SwarmEx Agents",
          description: "Pings the Render backend to prevent free-tier spin-down",
          config: {
            actionType: "HTTP Request",
            endpoint: `${RENDER_URL}/orchestrator/wake`,
            httpMethod: "POST",
            httpHeaders: JSON.stringify({ "Content-Type": "application/json" }),
            httpBody: JSON.stringify({ source: "keeperhub", action: "wake" }),
          },
          status: "idle",
        },
        position: { x: 400, y: 380 },
      },

      // ── Node 5: Discord Trigger (receives messages from Discord channel) ──
      {
        id: "discord-trigger",
        type: "trigger",
        data: {
          type: "trigger",
          label: "DiscordCommandTrigger",
          description: "Listens for messages in the SwarmEx Discord channel",
          config: {
            triggerType: "discord/on-message",
            integrationId: DISCORD_INTEGRATION_ID
          },
          status: "idle",
        },
        position: { x: 100, y: 600 },
      },

      // ── Node 6: HTTP Action (calls /orchestrator/run with Discord intent) ──
      {
        id: "discord-to-swarm-action",
        type: "action",
        data: {
          type: "action",
          label: "Discord-to-Swarm Execute",
          description: "POSTs Discord message content to backend orchestrator",
          config: {
            actionType: "HTTP Request",
            endpoint: `${RENDER_URL}/orchestrator/run`,
            httpMethod: "POST",
            httpHeaders: JSON.stringify({ "Content-Type": "application/json" }),
            httpBody: JSON.stringify({ 
              intent: "{{@discord-trigger:DiscordCommandTrigger.content}}",
              sessionId: "discord-{{@discord-trigger:DiscordCommandTrigger.author_id}}"
            }),
          },
          status: "idle",
        },
        position: { x: 400, y: 600 },
      },

      // ── Node 7: Discord Action (Acknowledges session started) ──
      {
        id: "discord-ack",
        type: "action",
        data: {
          type: "action",
          label: "Discord Acknowledgment",
          description: "Replies to Discord to confirm the swarm session has started",
          config: {
            actionType: "discord/send-message",
            integrationId: DISCORD_INTEGRATION_ID,
            discordMessage: "🚀 **SwarmEx Session Started**\nAnalyzing: `c={{@discord-trigger:DiscordCommandTrigger.content}}` | `m={{@discord-trigger:DiscordCommandTrigger.message}}` | `t={{@discord-trigger:DiscordCommandTrigger.text}}`"
          },
          status: "idle",
        },
        position: { x: 400, y: 800 },
      },
    ],
    edges: [
      { id: "e1", source: "webhook-trigger", target: "discord-action" },
      { id: "e2", source: "schedule-trigger", target: "wake-action" },
      { id: "e3", source: "discord-trigger", target: "discord-to-swarm-action" },
      { id: "e4", source: "discord-trigger", target: "discord-ack" },
    ],
  });

  if (!patchRes.ok) {
    console.error("❌ Patch failed:", JSON.stringify(patchRes.data, null, 2));
    return;
  }

  console.log("✅ Workflow patched successfully!");

  // Verify by fetching the updated workflow
  console.log("\nVerifying updated workflow...");
  const getRes = await api("GET", `/workflows/${WORKFLOW_ID}`);
  if (getRes.ok) {
    const nodes = getRes.data?.nodes ?? [];
    console.log(`Found ${nodes.length} nodes:`);
    for (const n of nodes) {
      console.log(`  - [${n.type}] "${n.data?.label}" → actionType: ${n.data?.config?.actionType ?? n.data?.config?.triggerType}`);
    }

    console.log("\n🎉 ══════════════════════════════════════════");
    console.log("   SwarmEx KeeperHub Workflow is CONFIGURED!");
    console.log("   ══════════════════════════════════════════");
    console.log(`   Webhook URL: ${BASE_URL}/workflows/${WORKFLOW_ID}/webhook`);
    console.log("\n   Visit app.keeperhub.com → Workflows → 'SwarmEx Autonomous 0G Agent'");
    console.log("   You should now see 4 properly labelled nodes.");
    console.log("   Click 'Go Live' or the Activate toggle to enable it.");
  }
}

main().catch(console.error);
