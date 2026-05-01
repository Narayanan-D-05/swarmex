import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const addr = "0x0460aA47b41a66694c0a73f667a1b795A5ED3556";
  console.log(`Checking address at: ${addr}`);
  const code = await ethers.provider.getCode(addr);
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
