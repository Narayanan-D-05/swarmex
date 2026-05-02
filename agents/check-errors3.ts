import { keccak256 } from 'viem';

// More errors from v4 (including BaseHook and access control)
const moreErrors = [
  'NotAuthorized()',
  'OnlyPoolManager()',
  'HookNotImplemented()',
  'WrongPoolManager()',
  'InvalidPool()',
  'PoolLocked()',
  'SwapFailed()',
  'BeforeSwapFailed()',
  'AfterSwapFailed()',
  'ManagerLocked()',
  'CurrencyAlreadySettled()',
  'AddLiquidityFailed()',
  'AlreadyUnlocked()',
  'LockedBy(address,address)',
  'Wrap__FailedHookCall(address)',
];

for (const e of moreErrors) {
  const sel = keccak256(new TextEncoder().encode(e)).slice(0, 10);
  const mark = sel === '0x90bfb865' ? ' <--- MATCH!' : '';
  console.log(e.padEnd(55), '->', sel, mark);
}
