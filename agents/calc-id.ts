import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';
const poolKey = {
  currency0: '0x0000000000000000000000000000000000000000',
  currency1: '0xf4131cC0a6E8a482dfeF634001E43c07dD1f82f8',
  fee: 3000,
  tickSpacing: 120,
  hooks: '0x45748D4a3f037a21F32A00F455e2C026436d80c0'
};
const id = keccak256(encodeAbiParameters(
  parseAbiParameters('address, address, uint24, int24, address'),
  [poolKey.currency0, poolKey.currency1, BigInt(poolKey.fee), poolKey.tickSpacing, poolKey.hooks]
));
console.log('Calculated Pool ID:', id);
