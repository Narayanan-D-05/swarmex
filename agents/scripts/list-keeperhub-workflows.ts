import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.KEEPERHUB_API;

async function listAll() {
  if (!API_KEY) return;
  const res = await fetch("https://app.keeperhub.com/api/workflows", {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const workflows = await res.json();
  console.log("ALL WORKFLOWS:");
  workflows.forEach((w: any) => {
    console.log(`- [${w.id}] ${w.name} (Status: ${w.status})`);
  });
}

listAll();
