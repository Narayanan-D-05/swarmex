// Bug #1 fix: exact from OG.md (ZgFile everywhere)
import { Indexer, ZgFile, getFlowContract } from '@0gfoundation/0g-ts-sdk';
import { randomUUID } from 'crypto';
import { ethers } from 'ethers';
import fs from 'fs/promises';

const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai'); // OG.md RPC
if (!process.env.AGENT_PRIVATE_KEY) throw new Error('AGENT_PRIVATE_KEY is missing');
const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);

// Bug #19 fix: read indexer from env since it scales horizontally
const indexer = new Indexer(process.env.OG_STORAGE_INDEXER || 'https://indexer-storage-testnet-standard.0g.ai');

export async function uploadMemory(data: Record<string, unknown>): Promise<string> {
  const jsonBuf = Buffer.from(JSON.stringify(data));
  const file = await ZgFile.fromBuffer(jsonBuf);
  const flow = getFlowContract('0x22E03a6A89B950F1c82ec5e74F8eCa321a105296', provider); // Galileo Testnet flow contract

  const [tree, err] = await file.merkleTree();
  if (err !== null) throw err;
  const rootHash = tree.rootHash();

  const tx = await indexer.upload(file, 0, flow.target, wallet);
  if (tx.ok) return rootHash; // returns 64-char hex string without 0x
  throw new Error(`0G Storage upload failed: ${tx.err}`);
}

export async function downloadMemory(rootHash: string): Promise<Record<string, unknown>> {
  // Bug #26 fix: slice(2) to strip 0x if present, add random UUID to prevent concurrent write crashes
  const safeHash = rootHash.startsWith('0x') ? rootHash.slice(2, 66) : rootHash.slice(0, 64);
  const tmpPath = `./tmp/mem_${safeHash}_${randomUUID()}.json`;

  const tx = await indexer.download(safeHash, tmpPath, false);
  if (tx.err) throw new Error(`0G Storage download failed: ${tx.err}`);

  const content = await fs.readFile(tmpPath, 'utf8');
  await fs.unlink(tmpPath).catch(() => {});
  return JSON.parse(content);
}
