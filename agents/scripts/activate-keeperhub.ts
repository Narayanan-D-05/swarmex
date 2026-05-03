import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.KEEPERHUB_API;
const WORKFLOW_ID = "6k8kkgb8v5gqh7gquriql";

async function activate() {
  if (!API_KEY) return;
  console.log(`🚀 Activating SwarmEx Workflow...`);
  const res = await fetch(`https://app.keeperhub.com/api/workflows/${WORKFLOW_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ status: 'active' }) // Best guess for status name
  });

  if (res.ok) {
    console.log("✅ Workflow is now LIVE!");
  } else {
    const text = await res.text();
    console.log(`⚠️ Activation failed (might need manual toggle): ${text}`);
  }
}

activate();
