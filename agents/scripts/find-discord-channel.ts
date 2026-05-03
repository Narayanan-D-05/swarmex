import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.KEEPERHUB_API;
const INTEGRATION_ID = "libp44j88ukrimww72zac";

async function getChannels() {
  if (!API_KEY) return;
  // This endpoint might vary depending on KeeperHub API, but let's try to find channel info
  const res = await fetch(`https://app.keeperhub.com/api/integrations/${INTEGRATION_ID}/channels`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  if (res.ok) {
    const channels = await res.json();
    console.log("AVAILABLE CHANNELS:");
    console.log(JSON.stringify(channels, null, 2));
  } else {
    console.log("Could not fetch channels directly. Trying workflow history...");
    const WORKFLOW_ID = "6k8kkgb8v5gqh7gquriql";
    const histRes = await fetch(`https://app.keeperhub.com/api/workflows/${WORKFLOW_ID}/history?limit=1`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const history = await histRes.json();
    if (history.length > 0) {
      console.log("LAST TRIGGER DATA:");
      console.log(JSON.stringify(history[0].triggerData, null, 2));
    }
  }
}

getChannels();
