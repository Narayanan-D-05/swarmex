import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const registryAddr = process.env.AGENT_REGISTRY_ADDRESS;
  console.log(`Checking AgentRegistry at: ${registryAddr}`);
  const code = await ethers.provider.getCode(registryAddr);
  if (code === "0x") {
    console.log("No code found at address.");
  } else {
    console.log("Code found! Contract is deployed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
