import pkg from "hardhat";
const { ethers } = pkg;
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // 1. Deploy PoolManager
  console.log("Deploying PoolManager...");
  const PoolManager = await ethers.getContractFactory("SwarmExPoolManager");
  const poolManager = await PoolManager.deploy(deployer.address);
  await poolManager.waitForDeployment();
  const poolManagerAddr = await poolManager.getAddress();
  console.log(`PoolManager deployed to: ${poolManagerAddr}`);

  // 2. Deploy AgentNFT
  console.log("Deploying AgentNFT...");
  const AgentNFT = await ethers.getContractFactory("AgentNFT");
  const agentNFT = await AgentNFT.deploy();
  await agentNFT.waitForDeployment();
  const agentNFTAddr = await agentNFT.getAddress();
  console.log(`AgentNFT deployed to: ${agentNFTAddr}`);

  // 3. Deploy AgentRegistry
  console.log("Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddr = await agentRegistry.getAddress();
  console.log(`AgentRegistry deployed to: ${agentRegistryAddr}`);

  // Set registry in NFT if needed (AgentNFT doesn't have a setRegistry but uses onlyOwner)
  // SwarmExecutorHook needs AgentRegistry to check authorizedRiskAgents.
  // We should authorize the RISK_AGENT_PRIVATE_KEY wallet.
  const riskAgentWallet = new ethers.Wallet(process.env.RISK_AGENT_PRIVATE_KEY);
  await agentRegistry.authorizeRiskAgent(riskAgentWallet.address, true);
  console.log(`Authorized Risk Agent: ${riskAgentWallet.address}`);

  // 4. Deploy MockUSDC
  console.log("Deploying MockUSDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUSDC = await MockERC20.deploy("Mock USDC", "mUSDC");
  await mockUSDC.waitForDeployment();
  const mockUSDCAddr = await mockUSDC.getAddress();
  console.log(`MockUSDC deployed to: ${mockUSDCAddr}`);

  // 5. Deploy SessionTreasury
  console.log("Deploying SessionTreasury...");
  const SessionTreasury = await ethers.getContractFactory("SessionTreasury");
  const sessionTreasury = await SessionTreasury.deploy(mockUSDCAddr, deployer.address); // Using deployer as orchestrator for now
  await sessionTreasury.waitForDeployment();
  const sessionTreasuryAddr = await sessionTreasury.getAddress();
  console.log(`SessionTreasury deployed to: ${sessionTreasuryAddr}`);

  // 6. Deploy SwarmExecutorHook
  console.log("Deploying SwarmExecutorHook...");
  const SwarmExecutorHook = await ethers.getContractFactory("SwarmExecutorHook");
  
  // Mining salt for flags (beforeSwap=0x80, afterSwap=0x40 -> Total 0xC0)
  const permissions = 0xC0;
  let salt = 0;
  let hookAddr = "";
  const factoryAddr = "0x4e59b44847b379578588920cA78FbF26c0B4956C";
  
  const creationCode = SwarmExecutorHook.bytecode;
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address"],
    [poolManagerAddr, agentRegistryAddr]
  );
  
  const initCode = ethers.concat([creationCode, constructorArgs]);
  const initCodeHash = ethers.keccak256(initCode);

  console.log("Mining salt for hook address (bits 7,6)...");
  while (true) {
    const saltBytes = ethers.zeroPadValue(ethers.toBeHex(salt), 32);
    hookAddr = ethers.getCreate2Address(
      factoryAddr,
      saltBytes,
      initCodeHash
    );
    
    // Low 14 bits check
    if ((parseInt(hookAddr.slice(-4), 16) & 0x3FFF) === permissions) {
      console.log(`Found salt: ${saltBytes}`);
      console.log(`Predicted Hook Address: ${hookAddr}`);
      break;
    }
    salt++;
    if (salt % 10000 === 0) console.log(`Salt: ${salt}...`);
  }

  // Deploy using Factory
  const factory = await ethers.getContractAt([
    "function deploy(uint256 value, bytes32 salt, bytes initCode) public returns (address)"
  ], factoryAddr);
  
  const tx = await factory.deploy(0, ethers.zeroPadValue(ethers.toBeHex(salt), 32), initCode);
  await tx.wait();
  console.log(`SwarmExecutorHook deployed via Factory to: ${hookAddr}`);

  console.log("\nDeployment Summary:");
  console.log(`POOL_MANAGER_ADDRESS=${poolManagerAddr}`);
  console.log(`AGENT_REGISTRY_ADDRESS=${agentRegistryAddr}`);
  console.log(`AGENT_NFT_ADDRESS=${agentNFTAddr}`);
  console.log(`SESSION_TREASURY_ADDRESS=${sessionTreasuryAddr}`);
  console.log(`HOOK_ADDRESS=${hookAddr}`);
  console.log(`USDC_ADDRESS=${mockUSDCAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
