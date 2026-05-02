import { keccak256, toHex } from 'viem';

const errors = [
  'InvalidHookResponse()',
  'Wrap__FailedHookCall(address,(bool,bool,bool,bool,bool,bool,bool,bool,bool,bool,bool,bool,bool,bool))',
  'HookAddressNotValid(address)',
  'InvalidHookPermissions(address)',
  'FailedHookCall()',
  'HookCallFailed()',
  'ProtectedHookFlagSet()',
  'CurrencyNotSettled()',
  'SwapAmountCannotBeZero()',
  'InvalidHookData()',
  'NotPoolManager()',
  'NotSelf()',
  'NonZeroNativeValue()',
  'CurrenciesOutOfOrderOrEqual(address,address)',
  'PoolNotInitialized()',
];

for (const e of errors) {
  const sel = keccak256(new TextEncoder().encode(e)).slice(0, 10);
  if (sel === '0x90bfb865') {
    console.log('MATCH:', e, '->', sel);
  } else {
    console.log(e.padEnd(60), '->', sel);
  }
}
