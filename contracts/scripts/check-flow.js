import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const flowAddr = "0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9";
  console.log(`Checking Flow/Entrance at: ${flowAddr}`);
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
