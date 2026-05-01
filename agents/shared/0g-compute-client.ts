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
  messages: { role: string; content: string }[]
): Promise<string> {
  if (!initialized) throw new Error('Call initializeProvider() first (Bug #3)');
  const b = await getBroker();

  const { endpoint, model } = await b.inference.getServiceMetadata(providerAddress);
  const requestBody = JSON.stringify({ model, messages, stream: false });
  const authHeaders = await b.inference.getRequestHeaders(providerAddress, requestBody);

  // Bug #25 fix: wrap in try/catch, never let LLM failure crash the graph
  let response: Response;
  try {
    response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: requestBody,
    });
  } catch (err) {
    throw new Error(`0G Compute fetch failed: ${(err as Error).message}`);
  }

  if (!response.ok) {
    // OG.md rate limit: 30 req/min, 429 = Too Many Requests
    if (response.status === 429) throw new Error('0G Compute: rate limited (429) — retry');
    throw new Error(`0G Compute HTTP ${response.status}`);
  }

  const json = await response.json();

  // Bug #6 fix: extract usage for processResponse (if broker requires it)
  const usage = json.usage; // { prompt_tokens, completion_tokens, total_tokens }
  // Note: processResponse may or may not be required depending on broker version.
  // If broker.processResponse exists, call it:
  if (typeof (b as any).processResponse === 'function') {
    await (b as any).processResponse(providerAddress, json.id, usage);
  }

  return json.choices[0].message.content as string;
}
