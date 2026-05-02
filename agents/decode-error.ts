import { createPublicClient, http, defineChain, parseAbi } from 'viem';

async function main() {
  const selector = '0x486aa307';
  console.log(`Selector: ${selector}`);
  
  // Try to find matching error in Uniswap v4 ABI
  const abi = [
    'error PoolNotInitialized()',
    'error TickSpacingNotSupported()',
    'error HookAddressNotValid()',
    'error InvalidPrice()',
    'error PriceLimitBreached()',
    'error UnauthorizedRiskAgent()',
    'error invalid risk agent()',
    'error session wallet mismatch()',
    'error attestation expired()'
  ];
  
  // Actually, I can just use a dictionary of known v4 errors
  const knownErrors: Record<string, string> = {
    '0x486aa307': 'PoolNotInitialized()',
    '0x12345678': 'Dummy()'
  };
  
  console.log('Match:', knownErrors[selector] || 'Unknown');
}
main();
