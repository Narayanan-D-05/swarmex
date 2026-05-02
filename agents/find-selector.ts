import { keccak256, toHex, encodeErrorResult } from 'viem';

const errors = [
  "TicksMisordered(int24,int24)",
  "TickLowerOutOfBounds(int24)",
  "TickUpperOutOfBounds(int24)",
  "TickLiquidityOverflow(int24)",
  "PoolAlreadyInitialized()",
  "PoolNotInitialized()",
  "PriceLimitAlreadyExceeded(uint160,uint160)",
  "PriceLimitOutOfBounds(uint160)",
  "NoLiquidityToReceiveFees()",
  "InvalidFeeForExactOut()",
  "CurrencyNotSettled()",
  "AlreadyUnlocked()",
  "ManagerLocked()",
  "TickSpacingTooLarge(int24)",
  "TickSpacingTooSmall(int24)",
  "CurrenciesOutOfOrderOrEqual(address,address)",
  "UnauthorizedDynamicLPFeeUpdate()",
  "SwapAmountCannotBeZero()",
  "NonzeroNativeValue()",
  "MustClearExactPositiveDelta()",
  "WrappedError(address,bytes4,bytes)"
];

for (const err of errors) {
  const selector = keccak256(Buffer.from(err)).slice(0, 10);
  if (selector === '0x7c9c6e8f') {
    console.log('MATCH FOUND:', err);
  }
}
console.log('Done.');
