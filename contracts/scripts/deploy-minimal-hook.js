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

  console.log(`Deploying MinimalHook for PM: ${poolManagerAddr}`);
  const MinimalHook = await ethers.getContractFactory("MinimalHook");
  
  const permissions = 0xC0;
  let salt = 0;
  let hookAddr = "";
  const factoryAddr = "0x4e59b44847b379578588920cA78FbF26c0B4956C";
  
  const creationCode = MinimalHook.bytecode;
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [poolManagerAddr]);
  const initCode = ethers.concat([creationCode, constructorArgs]);
  const initCodeHash = ethers.keccak256(initCode);

  while (true) {
    const saltBytes = ethers.zeroPadValue(ethers.toBeHex(salt), 32);
    hookAddr = ethers.getCreate2Address(factoryAddr, saltBytes, initCodeHash);
    if ((parseInt(hookAddr.slice(-4), 16) & 0x3FFF) === permissions) {
      console.log(`Found salt: ${saltBytes}`);
      console.log(`Predicted Hook Address: ${hookAddr}`);
      
      const factory = await ethers.getContractAt(["function deploy(uint256,bytes32,bytes) public returns(address)"], factoryAddr);
      const tx = await factory.deploy(0, saltBytes, initCode);
      await tx.wait();
      console.log(`MinimalHook deployed to: ${hookAddr}`);
      break;
    }
    salt++;
  }
}

main().catch(console.error);
