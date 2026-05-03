const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testChains() {
  const apiKey = process.env.UNISWAP_API_KEY!;

  const chains = [
    {
      name: 'Ethereum Mainnet',
      chainId: 1,
      tokenIn:  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      amount: '100000000000000000', // 0.1 ETH in wei
    },
    {
      name: 'Ethereum Sepolia (11155111)',
      chainId: 11155111,
      tokenIn:  '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', // WETH Sepolia
      tokenOut: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // USDC Sepolia
      amount: '100000000000000000',
    },
    {
      name: 'Base Sepolia (84532)',
      chainId: 84532,
      tokenIn:  '0x4200000000000000000000000000000000000006', // WETH Base Sepolia
      tokenOut: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC Base Sepolia
      amount: '100000000000000000',
    },
    {
      name: 'Base Mainnet (8453)',
      chainId: 8453,
      tokenIn:  '0x4200000000000000000000000000000000000006', // WETH Base
      tokenOut: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC Base
      amount: '100000000000000000',
    },
  ];

  for (const chain of chains) {
    process.stdout.write(`Testing ${chain.name}... `);
    try {
      const res = await fetch('https://trade-api.gateway.uniswap.org/v1/quote', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenInChainId:  chain.chainId,
          tokenIn:         chain.tokenIn,
          tokenOutChainId: chain.chainId,
          tokenOut:        chain.tokenOut,
          amount:          chain.amount,
          type:            'EXACT_INPUT',
          swapper:         '0x0000000000000000000000000000000000000001',
        }),
      });
      if (res.ok) {
        const d = await res.json();
        const hasCalldata = !!d.quote?.methodParameters?.calldata;
        const output = d.quote?.output?.amount;
        console.log(`✅ ${res.status} | output=${output} | calldata=${hasCalldata}`);
      } else {
        const t = await res.text();
        console.log(`❌ ${res.status} | ${JSON.parse(t).detail || t.slice(0,60)}`);
      }
    } catch (e: any) {
      console.log(`❌ Error: ${e.message}`);
    }
  }
}
testChains();
