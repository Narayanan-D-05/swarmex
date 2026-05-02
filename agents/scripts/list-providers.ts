import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai');
  const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
  const broker = await createZGComputeNetworkBroker(wallet);

  console.log("Fetching providers...");
  const services = await broker.inference.listService();
  
  for (const s of services) {
    console.log(`\nProvider: ${s.provider}`);
    const meta = await broker.inference.getServiceMetadata(s.provider);
    console.log(`Endpoint: ${meta.endpoint}`);
    console.log(`Model: ${meta.model}`);
  }
}

main().catch(console.error);
