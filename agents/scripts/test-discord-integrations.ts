import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_KEY = process.env.KEEPERHUB_API!;
const INTEGRATIONS = ["libp44j88ukrimww72zac", "ipq2lbhznk9wxzncwxw4w"];

async function testIntegrations() {
  for (const id of INTEGRATIONS) {
    console.log(`Testing Integration: ${id}`);
    const res = await fetch(`https://app.keeperhub.com/api/integrations/${id}/test`, {
      method: "POST",
      headers: { 
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `🔄 Testing SwarmEx Integration [${id}] - If you see this, this ID is working!`
      })
    });
    console.log(`Result: ${res.status}`);
    const data = await res.json();
    console.log(data);
  }
}

testIntegrations();
