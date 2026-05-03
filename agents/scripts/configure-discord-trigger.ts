import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_KEY = process.env.KEEPERHUB_API!;
const BASE_URL = "https://app.keeperhub.com/api";
const WORKFLOW_ID = process.env.KEEPERHUB_WORKFLOW_ID || "6k8kkgb8v5gqh7gquriql";
const DISCORD_ID = process.env.KEEPERHUB_DISCORD_ID || "libp44j88ukrimww72zac";
const BACKEND_URL = process.env.AGENT_SERVER_URL || "http://localhost:3001";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY}`,
};

async function main() {
  console.log("🔧 Configuring Discord Trigger in KeeperHub Workflow...");
  
  // 1. Fetch current workflow to preserve existing nodes
  const getRes = await fetch(`${BASE_URL}/workflows/${WORKFLOW_ID}`, { headers });
  if (!getRes.ok) {
    console.error("❌ Failed to fetch workflow:", await getRes.text());
    return;
  }
  const currentWorkflow = await getRes.json();
  const existingNodes = currentWorkflow.nodes || [];
  const existingEdges = currentWorkflow.edges || [];

  // 2. Define New Nodes
  const discordTrigger = {
    id: "discord-trigger",
    type: "trigger",
    data: {
      type: "trigger",
      label: "Discord Intent Trigger",
      description: "Listens for messages in the SwarmEx Discord channel",
      config: {
        triggerType: "discord/on-message", // Custom KeeperHub trigger type
        integrationId: DISCORD_ID
      },
      status: "idle",
    },
    position: { x: 100, y: 600 },
  };

  const swarmAction = {
    id: "discord-to-swarm-action",
    type: "action",
    data: {
      type: "action",
      label: "Trigger SwarmEx Engine",
      description: "Calls the backend /orchestrator/run endpoint with the Discord intent",
      config: {
        actionType: "HTTP Request",
        endpoint: `${BACKEND_URL}/orchestrator/run`,
        httpMethod: "POST",
        httpHeaders: JSON.stringify({ "Content-Type": "application/json" }),
        httpBody: JSON.stringify({ 
          intent: "{{@discord-trigger:Discord Intent Trigger.message}}",
          sessionId: "discord-{{@discord-trigger:Discord Intent Trigger.authorId}}"
        }),
      },
      status: "idle",
    },
    position: { x: 400, y: 600 },
  };

  // 3. Merge and Patch
  const updatedNodes = [...existingNodes.filter((n: any) => n.id !== "discord-trigger" && n.id !== "discord-to-swarm-action"), discordTrigger, swarmAction];
  const updatedEdges = [...existingEdges.filter((e: any) => e.id !== "e-discord-to-swarm"), { id: "e-discord-to-swarm", source: "discord-trigger", target: "discord-to-swarm-action" }];

  console.log(`[KeeperHub] Patching workflow with ${updatedNodes.length} nodes...`);
  
  const patchRes = await fetch(`${BASE_URL}/workflows/${WORKFLOW_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      nodes: updatedNodes,
      edges: updatedEdges,
    }),
  });

  if (!patchRes.ok) {
    console.error("❌ Patch failed:", await patchRes.text());
  } else {
    console.log("✅ Workflow updated! Discord Trigger is now connected to SwarmEx Backend.");
    console.log(`\nURL: ${BACKEND_URL}/orchestrator/run`);
    console.log(`Payload: {"intent": "{{@discord-trigger:Discord Intent Trigger.message}}"}`);
  }
}

main().catch(console.error);
