const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testApi() {
  // Test mainnet pricing quote (for researcher)
  console.log('Testing Uniswap Trade API with mainnet tokens (USDC→WETH, chainId 1)...');
  const res = await fetch('https://trade-api.gateway.uniswap.org/v1/quote', {
    method: 'POST',
    headers: { 'x-api-key': process.env.UNISWAP_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tokenInChainId: 1,
      tokenIn: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      tokenOutChainId: 1,
      tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      amount: '10000000',
      type: 'EXACT_INPUT',
      swapper: '0x0000000000000000000000000000000000000001',
    }),
  });

  const text = await res.text();
  console.log(`Status: ${res.status}`);
  if (res.ok) {
    const data = JSON.parse(text);
    console.log('✅ Mainnet quote success!');
    console.log(`   Output: ${data.quote?.output?.amount} WETH-base-units`);
    console.log(`   GasFeeUSD: $${data.quote?.gasFeeUSD}`);
    console.log(`   PriceImpact: ${data.quote?.priceImpact}`);
    console.log(`   Has calldata: ${!!data.quote?.methodParameters?.calldata}`);
  } else {
    console.error('❌ Quote failed:', text);
  }

  // Test Base Sepolia execution quote (for executor)
  console.log('\nTesting Base Sepolia execution quote (USDC→WETH, chainId 84532)...');
  const res2 = await fetch('https://trade-api.gateway.uniswap.org/v1/quote', {
    method: 'POST',
    headers: { 'x-api-key': process.env.UNISWAP_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tokenInChainId: 84532,
      tokenIn: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      tokenOutChainId: 84532,
      tokenOut: '0x4200000000000000000000000000000000000006',
      amount: '10000000',
      type: 'EXACT_INPUT',
      swapper: '0x7Eb0A26Dc2422675a53DbFcC9CF72EAb4570f620',
    }),
  });
  const text2 = await res2.text();
  console.log(`Status: ${res2.status}`);
  if (res2.ok) {
    const d = JSON.parse(text2);
    console.log('✅ Base Sepolia quote success!');
    console.log(`   Has calldata: ${!!d.quote?.methodParameters?.calldata}`);
  } else {
    console.log('❌ Base Sepolia quote not available:', text2.slice(0, 200));
    console.log('   This is expected — testnet has no Trade API liquidity.');
  }
}
testApi().catch(console.error);
