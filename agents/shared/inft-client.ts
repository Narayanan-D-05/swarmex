import { ethers } from 'ethers';

// Bug #23 notice: For hackathon scoping, all INFTs are minted initially to the orchestrator wallet.
// In production, each agent would own its own wallet.
export async function mintAgentINFT(personaHash: string) {
  const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai');
  const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
  
  // AgentNFT address from deployments
  const nftAddress = process.env.AGENT_NFT_ADDRESS!;
  const abi = ["function safeMint(address to, bytes32 dataHash) external returns (uint256)"];
  
  const contract = new ethers.Contract(nftAddress, abi, wallet);
  const tx = await contract.safeMint(wallet.address, personaHash);
  const receipt = await tx.wait();
  
  console.log(`[INFT] Minted agent NFT in tx: ${receipt.hash}`);
  return receipt;
}
