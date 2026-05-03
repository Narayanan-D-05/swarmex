import { createPublicClient, http, defineChain, parseAbiItem } from 'viem';

const baseSepolia = defineChain({
  id: 84532, name: 'Base Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
});

const POOL_MANAGER = '0x498581ff718922c3f8e6a244956af099b2652b2b' as `0x${string}`;

async function main() {
  const c = createPublicClient({ chain: baseSepolia, transport: http() });

  const latestBlock = await c.getBlockNumber();
  console.log('Latest block:', latestBlock);
  
  let fromBlock = latestBlock - 100000n; // Last ~1.5 days on 2s blocks

  console.log(`Searching for Initialize events in the last 100,000 blocks...`);
  
  const allLogs = [];
  while (fromBlock < latestBlock) {
    let toBlock = fromBlock + 9999n;
    if (toBlock > latestBlock) toBlock = latestBlock;
    
    try {
      const logs = await c.getLogs({
        address: POOL_MANAGER,
        event: parseAbiItem('event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)'),
        fromBlock,
        toBlock
      });
      allLogs.push(...logs);
    } catch (e) {
      console.log('Error getting logs chunk:', e.message.substring(0, 50));
    }
    fromBlock = toBlock + 1n;
  }

  console.log(`Found ${allLogs.length} Swap events.`);
  for (const log of allLogs.slice(-10)) {
    console.log(`Pool ID: ${log.args.id} | amount0: ${log.args.amount0} | amount1: ${log.args.amount1}`);
  }
}
main().catch(console.error);
