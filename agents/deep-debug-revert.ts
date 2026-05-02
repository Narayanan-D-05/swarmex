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

async function main() {
  const hash = '0xf90201df34836b09c50bd573bf2d7cd5b806399cd69e29328644209e6ef1bf2b';
  const tx = await client.getTransaction({ hash });
  
  const abi = parseAbi(['function swap((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks), (bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96), (bool takeClaims, bool settleUsingBurn), bytes) external payable returns (int256)']);

  try {
    // Decode inputs
    const decoded = {
        key: {
            currency0: '0x0000000000000000000000000000000000000000',
            currency1: process.env.USDC_ADDRESS,
            fee: 3000,
            tickSpacing: 120, // Our new spacing
            hooks: process.env.HOOK_ADDRESS
        },
        params: {
            zeroForOne: true,
            amountSpecified: -1000000000000000000n, // 1 0G
            sqrtPriceLimitX96: 4295128740n
        },
        testSettings: { takeClaims: false, settleUsingBurn: false },
        hookData: '0x' // We'll need the real hookData from the tx
    };
    
    // Actually, let's just use the raw input
    console.log('Simulating raw call...');
    await client.call({
        account: tx.from,
        to: tx.to,
        data: tx.input,
        value: tx.value,
        blockNumber: tx.blockNumber - 1n
    });
  } catch (e: any) {
    console.log('Error Message:', e.message);
    console.log('Full Error:', JSON.stringify(e, (k,v)=>typeof v==='bigint'?v.toString():v, 2));
  }
}
main();
