import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const flowAddr = "0x22E03a6A89B950F1c82ec5e74F8eCa321a105296";
  console.log(`Checking Flow at: ${flowAddr}`);
  const code = await ethers.provider.getCode(flowAddr);
  if (code === "0x") {
    console.log("No code found.");
  } else {
    console.log("Code found!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
