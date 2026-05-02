import { keccak256 } from 'viem';
import * as fs from 'fs';

const art = JSON.parse(fs.readFileSync('../contracts/artifacts/src/SwarmExecutorHook.sol/SwarmExecutorHook.json', 'utf8'));
console.log('Bytecode Hash:', keccak256(art.bytecode));
