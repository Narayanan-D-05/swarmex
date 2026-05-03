import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.KEEPERHUB_API;
const WORKFLOW_ID = "6k8kkgb8v5gqh7gquriql";

async function checkHistory() {
  if (!API_KEY) return;
  const res = await fetch(`https://app.keeperhub.com/api/workflows/${WORKFLOW_ID}/history?limit=1`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const history = await res.json();
  if (history.length > 0) {
    console.log("TRIGGER DATA FROM LAST EXECUTION:");
    console.log(JSON.stringify(history[0].triggerData, null, 2));
  } else {
    console.log("No history found.");
  }
}

checkHistory();
