import { createPublicClient, http, defineChain, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ogTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
});

const client = createPublicClient({ chain: ogTestnet, transport: http() });

async function main() {
  const registry = process.env.AGENT_REGISTRY_ADDRESS as `0x${string}`;
  const riskAgentAccount = privateKeyToAccount(process.env.RISK_AGENT_PRIVATE_KEY as `0x${string}`);
  
  console.log('Registry:', registry);
  console.log('Risk Agent Address:', riskAgentAccount.address);

  const isAuthorized = await client.readContract({
    address: registry,
    abi: parseAbi(['function isAuthorizedRiskAgent(address) view returns (bool)']),
    functionName: 'isAuthorizedRiskAgent',
    args: [riskAgentAccount.address]
  });

  console.log('Is Authorized:', isAuthorized);
}
main();
