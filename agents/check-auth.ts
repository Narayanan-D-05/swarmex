import { createPublicClient, http, defineChain } from 'viem';

const ogTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
});

const client = createPublicClient({ chain: ogTestnet, transport: http() });

const registryAbi = [
  {
    "inputs": [{ "name": "agent", "type": "address" }],
    "name": "isAuthorizedRiskAgent",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function main() {
  const agent = '0x87F4CB777F1F19C3E2409C31cc9925e7d5278727';
  const registry = '0xEC8a2f743e61ff92C2846ef308b5e62C18FBF7Fb';
  
  const isAuthorized = await client.readContract({
    address: registry,
    abi: registryAbi,
    functionName: 'isAuthorizedRiskAgent',
    args: [agent]
  });
  
  console.log('Agent:', agent);
  console.log('Registry:', registry);
  console.log('Is Authorized:', isAuthorized);
}
main();
