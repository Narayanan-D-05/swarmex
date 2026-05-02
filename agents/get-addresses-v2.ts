import { getContractAddress, getCreate2Address, keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';
import * as fs from 'fs';

const deployerAddress = '0xf4c83d6f6846b6fd3e04d61459477abd03a09944';

const mockUsdcAddress = getContractAddress({
  from: deployerAddress,
  nonce: 1n
});

const poolSwapTestAddress = getContractAddress({
  from: deployerAddress,
  nonce: 2n
});

const poolModifyLiquidityTestAddress = getContractAddress({
  from: deployerAddress,
  nonce: 3n
});

import * as path from 'path';
const hookArtifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../contracts/artifacts/src/SwarmExecutorHook.sol/SwarmExecutorHook.json'), 'utf8'));
const POOL_MANAGER_ADDRESS_OG = '0x0c3970a25d85Fb45BcFfB064223d69361de641D1';
const AGENT_REGISTRY_ADDRESS = '0xEC8a2f743e61ff92C2846ef308b5e62C18FBF7Fb';

const constructorArgs = encodeAbiParameters(
  parseAbiParameters('address, address'),
  [POOL_MANAGER_ADDRESS_OG, AGENT_REGISTRY_ADDRESS]
);
const initCode = hookArtifact.bytecode + constructorArgs.slice(2);
const initCodeHash = keccak256(initCode as `0x${string}`);

const hookAddress = getCreate2Address({
  from: deployerAddress,
  salt: '0x0000000000000000000000000000000000000000000000000000000000005d52',
  bytecodeHash: initCodeHash
});

console.log('MockUSDC:', mockUsdcAddress);
console.log('PoolSwapTest:', poolSwapTestAddress);
console.log('PoolModifyLiquidityTest:', poolModifyLiquidityTestAddress);
console.log('Hook:', hookAddress);
