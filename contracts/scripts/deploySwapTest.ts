import hardhat from "hardhat";
const { ethers } = hardhat;
import "dotenv/config";

const POOL_MANAGER = '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  console.log("Deploying PoolSwapTest...");
  // PoolSwapTest requires PoolManager in constructor
  // Wait, I don't have PoolSwapTest in my src folder.
  // I can just deploy one inline!
}

main().catch(console.error);
