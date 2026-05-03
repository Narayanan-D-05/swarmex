import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.KEEPERHUB_API;

async function diagnostic() {
  if (!API_KEY) {
    console.error("Missing KEEPERHUB_API");
    return;
  }

  console.log("🔍 Checking KeeperHub Integrations...");
  const res = await fetch("https://app.keeperhub.com/api/integrations", {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });

  if (!res.ok) {
    console.error(`Failed to list integrations: ${res.status}`);
    return;
  }

  const integrations = await res.json();
  console.log("Current Integrations:", JSON.stringify(integrations, null, 2));

  const discord = integrations.find((i: any) => i.type === 'discord' || i.name.toLowerCase().includes('discord'));
  if (discord) {
    console.log(`✅ Found Discord Integration: ${discord.id} (${discord.name})`);
    if (discord.id !== "libp44j88ukrimww72zac") {
      console.warn(`⚠️ Mismatch! Config uses 'libp44j88ukrimww72zac' but found '${discord.id}'. Updating config...`);
    }
  } else {
    console.error("❌ No Discord integration found. You must add one in KeeperHub dashboard first.");
  }
}

diagnostic();
