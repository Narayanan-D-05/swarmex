import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.KEEPERHUB_API;
const WORKFLOW_ID = "6k8kkgb8v5gqh7gquriql";

async function checkDetailedHistory() {
  if (!API_KEY) return;
  const res = await fetch(`https://app.keeperhub.com/api/workflows/${WORKFLOW_ID}/history?limit=3`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const history = await res.json();
  if (history.length > 0) {
    history.forEach((h: any, i: number) => {
      console.log(`--- EXECUTION ${i} (${h.status}) ---`);
      console.log(JSON.stringify(h.triggerData, null, 2));
    });
  } else {
    console.log("No history found.");
  }
}

checkDetailedHistory();
