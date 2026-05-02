import { createPublicClient, http, parseAbi } from 'viem';

const client = createPublicClient({ transport: http('https://evmrpc-testnet.0g.ai') });

const usdc = '0xF8BBc49BacD5678Fe8a03e5C97686B8614805F71';
const user = '0x7Eb0A26Dc2422675a53DbFcC9CF72EAb4570f620';
const abi = parseAbi([
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)'
]);

async function main() {
  try {
    const symbol = await client.readContract({ address: usdc, abi, functionName: 'symbol' });
    const decimals = await client.readContract({ address: usdc, abi, functionName: 'decimals' });
    const balance = await client.readContract({ address: usdc, abi, functionName: 'balanceOf', args: [user] });
    console.log(`USDC: ${symbol} (${decimals} decimals)`);
    console.log(`User Balance: ${balance}`);
  } catch (e: any) {
    console.error('Error reading USDC:', e.message);
  }
}
main();
