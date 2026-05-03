import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { notifyKeeperHubOfNewSession } from "../shared/keeperhub-client";
import { randomUUID } from "crypto";

const KEEPERHUB_API_KEY = process.env.KEEPERHUB_API;
const WORKFLOW_ID = "6k8kkgb8v5gqh7gquriql";
const RENDER_URL = "https://swarmex.onrender.com";

async function fixEndpoints() {
  if (!KEEPERHUB_API_KEY) {
    console.error("Missing KEEPERHUB_API in .env");
    process.exit(1);
  }

  console.log(`[Fix] Fetching current workflow...`);
  const getRes = await fetch(`https://app.keeperhub.com/api/workflows/${WORKFLOW_ID}`, {
    headers: { 'Authorization': `Bearer ${KEEPERHUB_API_KEY}` }
  });

  if (!getRes.ok) {
    console.error(`Failed to fetch workflow: ${getRes.status}`);
    process.exit(1);
  }

  const workflow = await getRes.json();
  console.log(`[Fix] Modifying node endpoints to ${RENDER_URL}...`);

  // Find and update HTTP Request nodes
  const updatedNodes = workflow.nodes.map((node: any) => {
    if (node.data?.config?.actionType === 'HTTP Request' || node.data?.config?.endpoint?.includes('localhost')) {
      console.log(`[Fix] Updating node: ${node.id} (${node.data.label})`);
      const newEndpoint = node.data.config.endpoint.replace(/http:\/\/localhost:\d+/, RENDER_URL);
      return {
        ...node,
        data: {
          ...node.data,
          config: {
            ...node.data.config,
            endpoint: newEndpoint
          }
        }
      };
    }
    return node;
  });

  console.log(`[Fix] Patching workflow...`);
  const patchRes = await fetch(`https://app.keeperhub.com/api/workflows/${WORKFLOW_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KEEPERHUB_API_KEY}`
    },
    body: JSON.stringify({ nodes: updatedNodes })
  });

  if (patchRes.ok) {
    console.log(`[Fix] ✅ Workflow endpoints updated to production!`);
    console.log(`[Fix] IMPORTANT: Make sure the 'Go Live' toggle is ON in the KeeperHub dashboard.`);
  } else {
    const text = await patchRes.text();
    console.error(`[Fix] ❌ Patch failed: ${text}`);
  }
}

fixEndpoints();
