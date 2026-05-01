import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function fundCompute() {
  console.log("💰 Initializing 0G Compute Ledger Funding...");

  const rpc = process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai';
  const pk = process.env.AGENT_PRIVATE_KEY;
  const providerAddress = process.env.OG_COMPUTE_PROVIDER;

  if (!pk || !providerAddress) {
    console.error("❌ Missing AGENT_PRIVATE_KEY or OG_COMPUTE_PROVIDER in .env");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);
  
  console.log(`Wallet Address: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Current On-chain Balance: ${ethers.formatEther(balance)} A0GI`);

  if (balance < ethers.parseEther("1.1")) {
    console.error("❌ Insufficient balance to fund (need at least 1.1 A0GI)");
    process.exit(1);
  }

  try {
    const broker = await createZGComputeNetworkBroker(wallet);
    
    console.log("\n[1/2] Depositing 3 A0GI into 0G Compute General Ledger...");
    // depositFund creates the account if it doesn't exist
    const depositTx = await broker.ledger.depositFund(3); // 3 A0GI minimum
    console.log(`✅ Deposit successful! Tx: ${depositTx.hash}`);

    console.log("\n[2/2] Transferring 1 A0GI to Provider Account...");
    // transferFund creates the provider-specific sub-account for payments
    const transferTx = await broker.ledger.transferFund(providerAddress, 1); // 1 A0GI
    console.log(`✅ Transfer successful! Tx: ${transferTx.hash}`);

    console.log("\n🎉 Your 0G Compute account is now funded and ready for inference!");
  } catch (err: any) {
    console.error(`❌ Funding failed: ${err.message}`);
    if (err.message.includes("Account does not exist")) {
      console.log("💡 Note: The broker will attempt to create the account during deposit.");
    }
  }
}

fundCompute().catch(console.error);
