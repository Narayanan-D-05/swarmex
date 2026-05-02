import { createPublicClient, createWalletClient, http, defineChain } from 'viem';
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

const POOL_MANAGER = process.env.POOL_MANAGER_ADDRESS_OG as `0x${string}`;
const USDC = process.env.USDC_ADDRESS as `0x${string}`;

const poolKey = {
  currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  currency1: USDC,
  fee: 3000,
  tickSpacing: 60,
  hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`
};

async function main() {
    const pmAbi = [
      {
        "inputs": [
          {
            "components": [
              { "name": "currency0", "type": "address" },
              { "name": "currency1", "type": "address" },
              { "name": "fee", "type": "uint24" },
              { "name": "tickSpacing", "type": "int24" },
              { "name": "hooks", "type": "address" }
            ],
            "name": "key",
            "type": "tuple"
          },
          { "name": "sqrtPriceX96", "type": "uint160" },
          { "name": "hookData", "type": "bytes" }
        ],
        "name": "initialize",
        "outputs": [{ "name": "tick", "type": "int24" }],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];

    const sqrtPriceX96 = 79228162514264337593543950336n;
    
    console.log('Initializing pool WITHOUT hook (Small amount test)...');
    try {
      const initHash = await walletClient.writeContract({
        address: POOL_MANAGER,
        abi: pmAbi,
        functionName: 'initialize',
        args: [poolKey, sqrtPriceX96, '0x']
      });
      console.log('Initialize Tx:', initHash);
      await client.waitForTransactionReceipt({ hash: initHash });
      console.log('SUCCESS!');
    } catch (e: any) {
      console.error('FAILED:', e.message);
    }
}
main();
