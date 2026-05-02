import { createPublicClient, createWalletClient, http, defineChain, parseEther, parseAbi } from 'viem';
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
const account = privateKeyToAccount(process.env.USER_PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({ account, chain: ogTestnet, transport: http() });

async function main() {
  const pm = process.env.POOL_MANAGER_ADDRESS_OG as `0x${string}`;
  const usdc = process.env.USDC_ADDRESS as `0x${string}`;

  console.log('--- Isolation Test: No-Hook Pool ---');
  const poolKey = {
    currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    currency1: usdc,
    fee: 3000,
    tickSpacing: 60,
    hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`
  };

  try {
    const hash = await walletClient.writeContract({
      address: pm,
      abi: parseAbi(['function initialize((address,address,uint24,int24,address),uint160) returns (int24)']),
      functionName: 'initialize',
      args: [[poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks], 79228162514264337593543950336n]
    });
    console.log('Init Hash:', hash);
    const receipt = await client.waitForTransactionReceipt({ hash });
    console.log('Init Status:', receipt.status);
  } catch (e: any) {
    console.log('Init failed:', e.message.slice(0, 100));
  }
}
main();
