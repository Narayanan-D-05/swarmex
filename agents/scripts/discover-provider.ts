// Run this ONCE: npx tsx agents/scripts/discover-provider.ts
// Then set OG_COMPUTE_PROVIDER in .env
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';

async function main() {
  const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai');
  const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
  const broker = await createZGComputeNetworkBroker(wallet);

  // Bug #3 fix: listService() to discover available providers
  const services = await broker.inference.listService();
  // services is an array of provider records. Print and pick one:
  console.log('Available providers:');
  services.forEach((svc: any, i: number) => {
    console.log(`[${i}] address=${svc.provider}, model=${svc.model}, endpoint=${svc.url}`);
  });
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
