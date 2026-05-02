import { keccak256 } from 'viem';

const errors = [
  'HookCallFailed()',
];

for (const e of errors) {
  const sel = keccak256(new TextEncoder().encode(e)).slice(0, 10);
  console.log(e.padEnd(20), '->', sel);
}
