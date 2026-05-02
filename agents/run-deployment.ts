import { createPublicClient, createWalletClient, http, encodeAbiParameters, parseAbiParameters, keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import * as fs from 'fs';
import { findSalt } from './hook-miner';

const ogTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
});

const client = createPublicClient({ transport: http('https://evmrpc-testnet.0g.ai') });
const walletClient = createWalletClient({ chain: ogTestnet, transport: http('https://evmrpc-testnet.0g.ai') });

// Read artifacts
const deployerArtifact = JSON.parse(fs.readFileSync('../contracts/artifacts/src/DeployerContract.sol/DeployerContract.json', 'utf8'));
const hookArtifact = JSON.parse(fs.readFileSync('../contracts/artifacts/src/SwarmExecutorHook.sol/SwarmExecutorHook.json', 'utf8'));

const deployerPk = '0x06a900f1264a19c5a238503b05e43d70ed8cc19e58283f5073b2204f962ed45d'; // AGENT_PRIVATE_KEY
const account = privateKeyToAccount(deployerPk as `0x${string}`);

const POOL_MANAGER_ADDRESS_OG = '0x0c3970a25d85Fb45BcFfB064223d69361de641D1';
const AGENT_REGISTRY_ADDRESS = '0xEC8a2f743e61ff92C2846ef308b5e62C18FBF7Fb';

async function main() {
  try {
    console.log('Deploying DeployerContract...');
    const hash = await walletClient.deployContract({
      account,
      abi: deployerArtifact.abi,
      bytecode: deployerArtifact.bytecode,
    });
    console.log('TxHash:', hash);
    const receipt = await client.waitForTransactionReceipt({ hash });
    const deployerAddress = receipt.contractAddress;
    console.log('DeployerContract deployed at:', deployerAddress);

    console.log('Computing CREATE2 salt for SwarmExecutorHook...');
    // Hook creation code
    const creationCode = hookArtifact.bytecode;
    const constructorArgs = encodeAbiParameters(
      parseAbiParameters('address, address'),
      [POOL_MANAGER_ADDRESS_OG, AGENT_REGISTRY_ADDRESS]
    );
    const initCode = creationCode + constructorArgs.slice(2);
    const initCodeHash = keccak256(initCode as `0x${string}`);

    // permissions = BEFORE_SWAP_FLAG (1<<7) | AFTER_SWAP_FLAG (1<<6)
    // Wait, Hook permissions in v4 are:
    // BEFORE_SWAP = 1 << 7 (128)
    // AFTER_SWAP = 1 << 6 (64)
    // Total = 192
    const permissions = 192;
    console.log('InitCodeHash:', initCodeHash);

    const salt = findSalt(deployerAddress!, permissions, initCodeHash);
    console.log('Found salt:', salt);

    console.log('Calling deployAll()...');
    const { request } = await client.simulateContract({
      account,
      address: deployerAddress!,
      abi: deployerArtifact.abi,
      functionName: 'deployAll',
      args: [POOL_MANAGER_ADDRESS_OG, AGENT_REGISTRY_ADDRESS, salt]
    });
    
    const tx = await walletClient.writeContract(request);
    console.log('deployAll TxHash:', tx);
    await client.waitForTransactionReceipt({ hash: tx });
    
    const { result } = await client.simulateContract({
      account,
      address: deployerAddress!,
      abi: deployerArtifact.abi,
      functionName: 'deployAll',
      args: [POOL_MANAGER_ADDRESS_OG, AGENT_REGISTRY_ADDRESS, salt]
    });

    console.log('RESULTS:');
    console.log('MOCK_USDC_ADDRESS:', result[0]);
    console.log('POOL_SWAP_TEST_ADDRESS:', result[1]);
    console.log('POOL_MODIFY_LIQUIDITY_TEST_ADDRESS:', result[2]);
    console.log('HOOK_ADDRESS:', result[3]);

  } catch (e: any) {
    console.error('Error deploying:', e.message);
  }
}
main();
