import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';

const ogTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
});

const client = createPublicClient({ transport: http('https://evmrpc-testnet.0g.ai') });
const walletClient = createWalletClient({ chain: ogTestnet, transport: http('https://evmrpc-testnet.0g.ai') });

const usdc = '0xF8BBc49BacD5678Fe8a03e5C97686B8614805F71';
const userPk = '0xcfde19b7da414b606576198b2fa4fd4ae5ca5ce2a68b9a2ad875dda1b099756c'; // user
const account = privateKeyToAccount(userPk as `0x${string}`);

const abi = parseAbi(['function mint(address to, uint256 amount)']);

async function main() {
  try {
    const tx = await walletClient.writeContract({
      account,
      address: usdc,
      abi,
      functionName: 'mint',
      args: [account.address, 1000000000000000000000n] // 1000 mUSDC
    });
    console.log('Minted mUSDC! tx:', tx);
  } catch (e: any) {
    console.error('Error minting mUSDC:', e.message);
  }
}
main();
