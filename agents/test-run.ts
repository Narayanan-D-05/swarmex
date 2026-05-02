const req = fetch('http://localhost:3001/orchestrator/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ intent: "Swap 10 USDC to ETH with max 1% slippage" })
}).then(r => r.json()).then(console.log).catch(console.error);
