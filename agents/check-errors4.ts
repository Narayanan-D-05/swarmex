import { keccak256 } from 'viem';

// Try Wrap variants specific to 0G testnet's version
const candidates = [
  'Wrap_FailedHookCall(address,bytes)',
  'WrappedError(address,bytes4,bytes,bytes)',
  'HookFailed()',
  'Hooks__ValidateHookPermissionsFailed()',
  'InvalidHookResponse(address)',
  'HookMissingPermission()',
  'Reentrancy()',
  'Manager__FailedToUpdateLiquidity()',
  'CurrencyOutOfOrderOrEqual()',
  'ERC20TransferFailed()',
  'HookAddressNotValid()',
  'PriceLimitOutOfBounds()',
  'SwapAmountMustNotBeZero()',
  'MustStartByCallingUnlockFirst()',
  'AccessLocked()',
  'AlreadyLocked()',
  'Unlock_AlreadyUnlocked()',
  'Lock_AlreadyLocked()',
];

for (const e of candidates) {
  const sel = keccak256(new TextEncoder().encode(e)).slice(0, 10);
  const mark = sel === '0x90bfb865' ? ' <--- MATCH!' : '';
  console.log(e.padEnd(60), '->', sel, mark);
}
