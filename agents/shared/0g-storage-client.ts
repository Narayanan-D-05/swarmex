// Bug #1 fix: exact from OG.md (ZgFile everywhere)
import { Indexer, ZgFile, getFlowContract } from '@0gfoundation/0g-storage-ts-sdk';
import { randomUUID } from 'crypto';
import { ethers } from 'ethers';
import fs from 'fs/promises';

const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai'); // OG.md RPC
if (!process.env.AGENT_PRIVATE_KEY) throw new Error('AGENT_PRIVATE_KEY is missing');
const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);

// Bug #19 fix: read indexer from env since it scales horizontally
const indexer = new Indexer(process.env.OG_STORAGE_INDEXER || 'https://indexer-storage-testnet-standard.0g.ai');

export async function uploadMemory(data: Record<string, unknown>): Promise<{ rootHash: string, txHash: string | null }> {
  const jsonBuf = Buffer.from(JSON.stringify(data));
  const tmpPath = `./tmp/upload_${randomUUID()}.json`;
  
  // Create tmp dir if not exists
  await fs.mkdir('./tmp', { recursive: true });
  await fs.writeFile(tmpPath, jsonBuf);

  try {
    const file = await ZgFile.fromFilePath(tmpPath);
    try {
      const flow = getFlowContract('0x22E03a6A89B950F1c82ec5e74F8eCa321a105296', provider); // Galileo Testnet flow contract

      const [tree, err] = await file.merkleTree();
      if (err !== null) throw err;
      const rootHash = tree.rootHash();

      // Use SDK's built-in retry functionality instead of manual retry loop
      // This avoids the url.clone() issue that occurs with manual retries
      const retryOpts = {
        Retries: 3,
        Interval: 3000, // 3 seconds between retries
        MaxGasPrice: 100000000000 // 100 gwei
      };

      const [tx, uploadErr] = await indexer.upload(
        file,
        process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai',
        wallet,
        undefined, // uploadOpts
        retryOpts // retryOpts - use SDK's built-in retry
      );

      if (uploadErr) {
        throw new Error(`0G Storage upload failed: ${uploadErr.message}`);
      }

      let txHash = null;
      if (tx) {
        if (typeof tx === 'string') txHash = tx;
        else if (tx.txHash) txHash = tx.txHash;
        else if (tx.txHashes && tx.txHashes.length > 0) txHash = tx.txHashes[0];
      }
      return { rootHash, txHash };
    } finally {
      await file.close(); // Crucial: Fix DEP0137 warning
    }
  } finally {
    await fs.unlink(tmpPath).catch(() => {});
  }
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
