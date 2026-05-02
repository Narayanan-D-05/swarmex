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
  const poolManagerAddr = process.env.POOL_MANAGER_ADDRESS_OG;

  if (!poolManagerAddr) throw new Error("POOL_MANAGER_ADDRESS_OG missing in .env");

  console.log(`Deploying routers for PM: ${poolManagerAddr}`);

  // 1. Deploy PoolSwapTest
  console.log("Deploying PoolSwapTest...");
  const PoolSwapTest = await ethers.getContractFactory("PoolSwapTest");
  const poolSwapTest = await PoolSwapTest.deploy(poolManagerAddr);
  await poolSwapTest.waitForDeployment();
  const poolSwapTestAddr = await poolSwapTest.getAddress();
  console.log(`PoolSwapTest deployed to: ${poolSwapTestAddr}`);

  // 2. Deploy PoolModifyLiquidityTest
  console.log("Deploying PoolModifyLiquidityTest...");
  const PoolModifyLiquidityTest = await ethers.getContractFactory("PoolModifyLiquidityTest");
  const poolModifyLiquidityTest = await PoolModifyLiquidityTest.deploy(poolManagerAddr);
  await poolModifyLiquidityTest.waitForDeployment();
  const poolModifyLiquidityTestAddr = await poolModifyLiquidityTest.getAddress();
  console.log(`PoolModifyLiquidityTest deployed to: ${poolModifyLiquidityTestAddr}`);

  console.log("\nRouter Summary:");
  console.log(`POOL_SWAP_TEST_ADDRESS=${poolSwapTestAddr}`);
  console.log(`POOL_MODIFY_LIQUIDITY_TEST_ADDRESS=${poolModifyLiquidityTestAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
