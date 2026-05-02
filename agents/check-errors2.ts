import { keccak256 } from 'viem';

const moreErrors = [
  'FailedERC20Transfer()',
  'BalanceTooLow()',
  'InvalidToken()',
  'InsufficientBalance()',
  'TickLiquidityOverflow(int24)',
  'TicksMisordered(int24,int24)',
  'TickLowerOutOfBounds(int24)',
  'TickUpperOutOfBounds(int24)',
  'PoolAlreadyInitialized()',
  'PriceLimitAlreadyExceeded(uint160,uint160)',
  'PriceLimitOutOfBounds(uint160)',
  'SqrtPriceOutOfBounds(uint160)',
  'LiquidityOverflow()',
  'MaxCurrenciesExceeded()',
  'Unauthorized()',
  'InvalidSender()',
  'InvalidInitialPrice()',
];

for (const e of moreErrors) {
  const sel = keccak256(new TextEncoder().encode(e)).slice(0, 10);
  const mark = sel === '0x90bfb865' ? ' <--- MATCH!' : '';
  console.log(e.padEnd(50), '->', sel, mark);
}
