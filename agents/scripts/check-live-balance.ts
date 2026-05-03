import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkBalance() {
  if (!process.env.USER_PRIVATE_KEY) return;
  const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
  const balance = await client.getBalance({ address: account.address });
  console.log(`Address: ${account.address}`);
  console.log(`Balance: ${formatEther(balance)} ETH`);
}

checkBalance();
