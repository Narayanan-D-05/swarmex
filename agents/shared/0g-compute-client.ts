import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai'); // OG.md
if (!process.env.AGENT_PRIVATE_KEY) throw new Error('AGENT_PRIVATE_KEY is missing');
const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);

let broker: Awaited<ReturnType<typeof createZGComputeNetworkBroker>> | null = null;
let initialized = false;

async function getBroker() {
  if (!broker) broker = await createZGComputeNetworkBroker(wallet);
  return broker;
}

// Bug #3 fix: must acknowledge provider ONCE before any getRequestHeaders call
export async function initializeProvider(providerAddress: string): Promise<void> {
  const b = await getBroker();
  await b.inference.acknowledgeProviderSigner(providerAddress);
  initialized = true;
}

export async function fundProvider(providerAddress: string): Promise<void> {
  const b = await getBroker();
  // Deposit to main account, then transfer to provider sub-account
  await b.ledger.depositFund(BigInt('1000000000000000000'));    // 1 0G
  await b.ledger.transferFund(providerAddress, BigInt('100000000000000000'));  // 0.1 0G
}

export async function runInference(
  providerAddress: string,
  messages: { role: string; content: string }[],
  maxRetries = 3
): Promise<string> {
  if (!initialized) throw new Error('Call initializeProvider() first (Bug #3)');
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const b = await getBroker();
      const { endpoint, model } = await b.inference.getServiceMetadata(providerAddress);
      const requestBody = JSON.stringify({ model, messages, stream: false });
      const authHeaders = await b.inference.getRequestHeaders(providerAddress, requestBody);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: requestBody,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) throw new Error('0G Compute: rate limited (429)');
        if (response.status === 503) throw new Error('0G Compute: Service Unavailable (503)');
        throw new Error(`0G Compute HTTP ${response.status}`);
      }

      const json = await response.json();
      console.log(`[0G Compute] Raw JSON:`, JSON.stringify(json));

      const usage = json.usage;
      if (typeof (b as any).processResponse === 'function') {
        await (b as any).processResponse(providerAddress, json.id, usage);
      }

      return json.choices[0].message.content as string;
    } catch (err: any) {
      if (attempt === maxRetries) {
        throw new Error(`0G Compute failed after ${maxRetries} attempts: ${err.message}`);
      }
      console.warn(`[0G Compute] Attempt ${attempt} failed: ${err.message}. Retrying in 3 seconds...`);
      await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds before retrying
    }
  }
  throw new Error("Unreachable");
}
