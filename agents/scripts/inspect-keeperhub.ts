import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.KEEPERHUB_API;
const WORKFLOW_ID = "6k8kkgb8v5gqh7gquriql";

async function inspect() {
  if (!API_KEY) return;
  const res = await fetch(`https://app.keeperhub.com/api/workflows/${WORKFLOW_ID}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const workflow = await res.json();
  console.log("WORKFLOW NODES:");
  workflow.nodes.forEach((n: any) => {
    console.log(`- [${n.id}] ${n.data?.label} (${n.data?.config?.actionType || n.data?.config?.triggerType})`);
    if (n.data?.config?.endpoint) console.log(`    Endpoint: ${n.data.config.endpoint}`);
    if (n.data?.config?.httpBody) console.log(`    Body: ${n.data.config.httpBody}`);
  });
}

inspect();
