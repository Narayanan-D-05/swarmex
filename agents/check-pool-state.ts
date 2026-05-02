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
  const pm = process.env.POOL_MANAGER_ADDRESS_OG as `0x${string}`;
  const usdc = process.env.USDC_ADDRESS as `0x${string}`;
  const hook = process.env.HOOK_ADDRESS as `0x${string}`;
  
  const pmAbi = parseAbi([
    'function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)',
    'function getLiquidity(bytes32 poolId) view returns (uint128)',
  ]);

  // Compute pool ID: keccak256(abi.encode(currency0, currency1, fee, tickSpacing, hooks))
  const { keccak256, encodeAbiParameters } = await import('viem');
  
  const poolId = keccak256(encodeAbiParameters(
    [
      { name: 'currency0', type: 'address' },
      { name: 'currency1', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'tickSpacing', type: 'int24' },
      { name: 'hooks', type: 'address' },
    ],
    ['0x0000000000000000000000000000000000000000', usdc, 3000, 120, hook]
  ));

  console.log('Pool ID (120 spacing):', poolId);

  try {
    const slot0 = await client.readContract({ address: pm, abi: pmAbi, functionName: 'getSlot0', args: [poolId] });
    const liq = await client.readContract({ address: pm, abi: pmAbi, functionName: 'getLiquidity', args: [poolId] });
    console.log('sqrtPriceX96:', slot0[0].toString());
    console.log('Current Tick:', slot0[1].toString());
    console.log('Liquidity:', liq.toString());
    console.log('');
    
    // Calculate price from sqrtPriceX96
    const sqrtPrice = Number(slot0[0]);
    const Q96 = 2 ** 96;
    const price = (sqrtPrice / Q96) ** 2;
    console.log(`Price (USDC per 0G): ${price.toFixed(8)}`);
  } catch (e: any) {
    console.error('Pool not found or not initialized:', e.message);
  }
  
  // Also check 60-spacing pool
  const poolId60 = keccak256(encodeAbiParameters(
    [
      { name: 'currency0', type: 'address' },
      { name: 'currency1', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'tickSpacing', type: 'int24' },
      { name: 'hooks', type: 'address' },
    ],
    ['0x0000000000000000000000000000000000000000', usdc, 3000, 60, hook]
  ));
  console.log('\nPool ID (60 spacing):', poolId60);
  try {
    const slot0 = await client.readContract({ address: pm, abi: pmAbi, functionName: 'getSlot0', args: [poolId60] });
    const liq = await client.readContract({ address: pm, abi: pmAbi, functionName: 'getLiquidity', args: [poolId60] });
    console.log('sqrtPriceX96:', slot0[0].toString());
    console.log('Current Tick:', slot0[1].toString());
    console.log('Liquidity:', liq.toString());
  } catch (e: any) {
    console.error('60-spacing pool not found:', e.message);
  }
}
main();
