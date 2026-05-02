import { createPublicClient, createWalletClient, http, defineChain, encodeAbiParameters, parseAbiParameters, keccak256, getCreate2Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { findSalt } from './hook-miner';

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

const POOL_MANAGER = '0x0c3970a25d85Fb45BcFfB064223d69361de641D1' as `0x${string}`;
const AGENT_REGISTRY = process.env.AGENT_REGISTRY_ADDRESS as `0x${string}`;

// Read the NEWLY compiled artifact (from hardhat compile)
const hookArtifact = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../contracts/artifacts/src/SwarmExecutorHook.sol/SwarmExecutorHook.json'), 'utf8'
));

// We need a CREATE2 factory to deploy with salt and get predictable address
// Use the standard CREATE2 deployer at 0x4e59b44847b379578588920ca78fbf26c0b4956c
const CREATE2_FACTORY = '0x4e59b44847b379578588920ca78fbf26c0b4956c' as `0x${string}`;

async function main() {
  const constructorArgs = encodeAbiParameters(
    parseAbiParameters('address, address'),
    [POOL_MANAGER, AGENT_REGISTRY]
  );
  const initCode = (hookArtifact.bytecode + constructorArgs.slice(2)) as `0x${string}`;
  const initCodeHash = keccak256(initCode);
  
  console.log('InitCode length:', initCode.length);
  console.log('InitCodeHash:', initCodeHash);

  // Check if CREATE2 factory exists on 0G
  const factoryCode = await client.getBytecode({ address: CREATE2_FACTORY });
  console.log('CREATE2 factory exists:', factoryCode && factoryCode.length > 2 ? 'YES' : 'NO');

  if (!factoryCode || factoryCode.length <= 2) {
    console.log('Deploying hook directly without CREATE2 (no permission bits)...');
    // Deploy directly using walletClient.deployContract
    const hash = await walletClient.deployContract({
      abi: hookArtifact.abi,
      bytecode: hookArtifact.bytecode,
      args: [POOL_MANAGER, AGENT_REGISTRY]
    });
    console.log('Deploy TX:', hash);
    const receipt = await client.waitForTransactionReceipt({ hash });
    console.log('Hook deployed at:', receipt.contractAddress);
    return;
  }

  // permissions = beforeSwap(7) | afterSwap(6) = 0x80 | 0x40 = 0xC0 = 192
  const permissions = 192;
  console.log('Mining salt for permissions:', permissions, '(0x' + permissions.toString(16) + ')');
  
  const salt = findSalt(CREATE2_FACTORY, permissions, initCodeHash);
  console.log('Found salt:', salt);
  
  // Deploy via CREATE2 factory
  // The CREATE2 factory takes: salt (32 bytes) + initCode
  const calldata = (salt + initCode.slice(2)) as `0x${string}`;
  const hash = await walletClient.sendTransaction({
    to: CREATE2_FACTORY,
    data: calldata,
    gas: 5000000n
  });
  console.log('Deploy TX:', hash);
  const receipt = await client.waitForTransactionReceipt({ hash });
  
  // Predict hook address
  const hookAddress = getCreate2Address({ from: CREATE2_FACTORY, salt, bytecodeHash: initCodeHash });
  console.log('Hook deployed at (predicted):', hookAddress);
  console.log('Actual contract in logs if any');
  
  // Verify permissions bits
  const addrBits = BigInt(hookAddress) & BigInt(0x3FFF);
  console.log('Address lower bits:', '0x' + addrBits.toString(16));
  console.log('Required bits:', '0x' + permissions.toString(16));
  console.log('Match:', (addrBits & BigInt(permissions)) === BigInt(permissions));
}
main();
