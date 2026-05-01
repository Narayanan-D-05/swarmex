import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const factoryAddr = "0x4e59b44847b379578588920cA78FbF26c0B4956C";
  console.log(`Checking Factory at: ${factoryAddr}`);
  const code = await ethers.provider.getCode(factoryAddr);
  if (code === "0x") {
    console.log("No code found at address.");
  } else {
    console.log("Code found! Factory is available.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
