import "@nomicfoundation/hardhat-foundry";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    base_sepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.AGENT_PRIVATE_KEY]
    },
    og_testnet: {
      url: "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: [process.env.AGENT_PRIVATE_KEY]
    }
  }
};
