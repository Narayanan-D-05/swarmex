import { createPublicClient, http, defineChain, parseAbi } from 'viem';
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

const REGISTRY = process.env.AGENT_REGISTRY_ADDRESS as `0x${string}`;
const RISK_AGENT = '0x87F4CB777F1F19C3E2409C31cc9925e7d5278727' as `0x${string}`;

const abi = parseAbi([
  'function isAuthorizedRiskAgent(address agent) view returns (bool)'
]);

async function main() {
  console.log('Checking registry:', REGISTRY);
  console.log('Checking agent:', RISK_AGENT);
  
  const isAuth = await client.readContract({
    address: REGISTRY,
    abi,
    functionName: 'isAuthorizedRiskAgent',
    args: [RISK_AGENT]
  });
  
  console.log('Is Authorized:', isAuth);
}
main();
