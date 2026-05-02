import { keccak256 } from 'viem';

const functions = [
  'beforeSwap(address,PoolKey,SwapParams,bytes)',
  'beforeSwap(PoolKey,SwapParams,bytes)',
  '_beforeSwap(address,PoolKey,SwapParams,bytes)',
  '_beforeSwap(PoolKey,SwapParams,bytes)',
];

for (const f of functions) {
  const sel = keccak256(new TextEncoder().encode(f)).slice(0, 10);
  console.log(f.padEnd(45), '->', sel);
}
