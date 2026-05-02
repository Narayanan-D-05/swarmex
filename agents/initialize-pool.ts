import { createPublicClient, createWalletClient, http, parseAbi, parseEther, defineChain } from 'viem';
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
const LIQUIDITY_ROUTER = process.env.POOL_MODIFY_LIQUIDITY_TEST_ADDRESS as `0x${string}`;
const USDC = process.env.USDC_ADDRESS as `0x${string}`;
const HOOK = process.env.HOOK_ADDRESS as `0x${string}`;

const poolKey = {
  currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Native 0G
  currency1: USDC,
  fee: 3000,
  tickSpacing: 60,
  hooks: HOOK
};

const PoolManagerABI = [
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

const LiquidityRouterABI = [
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
      {
        "components": [
          { "name": "tickLower", "type": "int24" },
          { "name": "tickUpper", "type": "int24" },
          { "name": "liquidityDelta", "type": "int256" },
          { "name": "salt", "type": "bytes32" }
        ],
        "name": "params",
        "type": "tuple"
      },
      { "name": "hookData", "type": "bytes" }
    ],
    "name": "modifyLiquidity",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

async function main() {
  try {
    // 1. Mint 1M MockUSDC
    console.log('Minting 1M MockUSDC...');
    const mockUsdcAbi = parseAbi(['function mint(address to, uint256 amount) public']);
    const mintHash = await walletClient.writeContract({
      address: USDC,
      abi: mockUsdcAbi,
      functionName: 'mint',
      args: [account.address, parseEther('1000000')]
    });
    console.log('Mint Tx:', mintHash);
    await client.waitForTransactionReceipt({ hash: mintHash });

    // 2. Initialize Pool
    console.log('Initializing Pool...');
    const sqrtPriceX96 = 79228162514264337593543950336n;
    
    try {
      const initHash = await walletClient.writeContract({
        address: POOL_MANAGER,
        abi: PoolManagerABI,
        functionName: 'initialize',
        args: [poolKey, sqrtPriceX96, '0x']
      });
      console.log('Initialize Tx:', initHash);
      await client.waitForTransactionReceipt({ hash: initHash });
    } catch (e: any) {
      if (e.message.includes('PoolAlreadyInitialized')) {
        console.log('Pool already initialized.');
      } else {
        console.error('Initialization error:', e.message);
      }
    }

    // 3. Approve Liquidity Router
    console.log('Approving Liquidity Router...');
    const erc20Abi = parseAbi(['function approve(address spender, uint256 amount) public returns (bool)']);
    const approveHash = await walletClient.writeContract({
      address: USDC,
      abi: erc20Abi,
      functionName: 'approve',
      args: [LIQUIDITY_ROUTER, parseEther('1000000')]
    });
    console.log('Approve Tx:', approveHash);
    await client.waitForTransactionReceipt({ hash: approveHash });

    // 4. Add Liquidity
    console.log('Adding Liquidity...');
    const addHash = await walletClient.writeContract({
      address: LIQUIDITY_ROUTER,
      abi: LiquidityRouterABI,
      functionName: 'modifyLiquidity',
      args: [
        poolKey,
        {
          tickLower: -600,
          tickUpper: 600,
          liquidityDelta: 10000000000000000000000n, // 10k units of liquidity
          salt: '0x0000000000000000000000000000000000000000000000000000000000000000'
        },
        '0x'
      ],
      value: parseEther('10') // Supply 10 Native 0G
    });
    console.log('Add Liquidity Tx:', addHash);
    await client.waitForTransactionReceipt({ hash: addHash });

    console.log('Pool initialization and liquidity provision complete!');
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

main();
