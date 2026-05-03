import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_KEY = process.env.KEEPERHUB_API!;

async function listIntegrations() {
  const res = await fetch(`https://app.keeperhub.com/api/integrations`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

listIntegrations();
