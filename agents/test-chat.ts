const req = fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-session-id': 'test-session-123',
    'Idempotency-Key': 'test-idem-123'
  },
  body: JSON.stringify({ message: "Swap 10 USDC to ETH with max 1% slippage" })
}).then(r => r.json()).then(console.log).catch(console.error);
