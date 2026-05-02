import { getContractAddress } from 'viem';
const deployerAddress = '0xf4c83d6f6846b6fd3e04d61459477abd03a09944';
for (let i = 0; i < 5; i++) {
  console.log("Nonce " + i + ": ", getContractAddress({ from: deployerAddress, nonce: BigInt(i) }));
}
