import fetch from 'node-fetch';

async function main() {
  const txHash = '0x8d4412d99d49d439076555af163f3911935e0e98b7a7094411f9c4377a4822de';
  const rpcUrl = 'https://evmrpc-testnet.0g.ai';
  
  console.log(`Tracing ${txHash}...`);
  
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'debug_traceTransaction',
      params: [txHash, { tracer: 'callTracer' }],
      id: 1
    })
  });
  
  const data: any = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
main();
