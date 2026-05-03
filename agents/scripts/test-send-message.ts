import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_KEY = process.env.KEEPERHUB_API!;
const INTEGRATIONS = ["libp44j88ukrimww72zac", "ipq2lbhznk9wxzncwxw4w"];

async function testSendMessage() {
  for (const id of INTEGRATIONS) {
    console.log(`Testing send-message for ID: ${id}`);
    const res = await fetch(`https://app.keeperhub.com/api/actions/discord/send-message/execute`, {
      method: "POST",
      headers: { 
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        integrationId: id,
        discordMessage: `🚀 Testing SwarmEx [${id}] - Send Message Action`
      })
    });
    console.log(`Result: ${res.status}`);
    const data = await res.json();
    console.log(data);
  }
}

testSendMessage();
