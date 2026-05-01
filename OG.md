Developer Hub
🚀 The Problem We Solve
Your AI application needs:

Massive storage for training data (TBs of datasets)
GPU compute for model inference ($10K+/month on centralized providers)
Fast data availability for real-time responses
Decentralization without sacrificing performance
Modular Infrastructure
0G provides all of this in one integrated ecosystem - or use just the parts you need.

0G Services
⛓️ 0G Chain
EVM-compatible blockchain optimized for AI

Deploy Contracts
Precompiles Reference
Chain Architecture
0G Compute
Decentralized GPU marketplace for AI workloads

Overview & Architecture
SDK Reference
Become a Provider
💾 0G Storage
High-performance storage for massive datasets

SDK Integration
CLI Commands
Architecture Details
📊 0G DA
Scalable data availability for any chain

Technical Deep Dive
Integration Guide
Rollup Integrations
Community Projects
Explore our growing ecosystem of DeAI applications in the awesome-0g repository, which showcases community projects, tools, and resources built on 0G.

Ready to build? Pick a service above and start in minutes, or join our Discord for help.


Deploy Smart Contracts on 0G Chain
Deploy smart contracts on 0G Chain - an EVM-compatible blockchain with built-in AI capabilities.

Why Deploy on 0G Chain?
⚡ Performance Benefits
11,000 TPS per Shard: Higher throughput than Ethereum
Low Fees: Fraction of mainnet costs
Sub-second Finality: Near-instant transaction confirmation
🔧 Latest EVM Compatibility
Pectra & Cancun-Deneb Support: Leverage newest Ethereum capabilities
Future-Ready: Architecture designed for quick integration of upcoming EVM upgrades
Familiar Tools: Use Hardhat, Foundry, Remix
No Learning Curve: Deploy like any EVM chain
Prerequisites
Before deploying contracts on 0G Chain, ensure you have:

Node.js 16+ installed (for Hardhat/Truffle)
Rust installed (for Foundry)
A wallet with testnet 0G tokens (get from faucet)
Basic Solidity knowledge
Steps to Deploy Your Contract
Step 1: Prepare Your Smart Contract Code
Write your contract code as you would for any Ethereum-compatible blockchain, ensuring that it meets the requirements for your specific use case.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MyToken {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;

    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply;
        balances[msg.sender] = _initialSupply;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }
}

Step 2: Compile Your Smart Contract
Use solc or another compatible Solidity compiler to compile your smart contract.

Important: When compiling, specify --evm-version cancun to ensure compatibility with the latest EVM upgrades supported by 0G Chain.

Using solc directly:

solc --evm-version cancun --bin --abi MyToken.sol

Using Hardhat:

// hardhat.config.js
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

Using Foundry:

# foundry.toml
[profile.default]
evm_version = "cancun"

This step will generate the binary and ABI (Application Binary Interface) for your contract.

Step 3: Deploy the Contract on 0G Chain
Once compiled, you can use your preferred Ethereum-compatible deployment tools, such as web3.js, ethers.js, or hardhat, to deploy the contract on 0G Chain.

Configure Network Connection:

// For Hardhat
networks: {
  "testnet": {
    url: "https://evmrpc-testnet.0g.ai",
    chainId: 16602,
    accounts: [process.env.PRIVATE_KEY]
  },
  "mainnet": {
    url: "https://evmrpc.0g.ai",
    chainId: 16661,
    accounts: [process.env.PRIVATE_KEY]
  }
}

// For Foundry
[rpc_endpoints]
0g_testnet = "https://evmrpc-testnet.0g.ai"
0g_mainnet = "https://evmrpc.0g.ai"

Deploy Using Your Preferred Tool:

Hardhat Deployment
Foundry Deployment
Truffle Deployment
Follow the same deployment steps as you would on Ethereum, using your 0G Chain node or RPC endpoint.

For complete working examples using different frameworks, check out the official deployment scripts repository: 🔗 0G Deployment Scripts

Step 4: Verify Deployment Results on 0G Chain Scan
After deployment, you can verify your contract on 0G Chain Scan, the block explorer for 0G Chain or via the provided API below:

Hardhat
Forge
Make sure you have the following plugins installed:

npm install --save-dev @nomicfoundation/hardhat-verify @nomicfoundation/viem @nomicfoundation/hardhat-toolbox-viem dotenv 


To verify your contract using Hardhat, please use the following settings in your hardhat.config.js:

solidity: {
  ...
  settings: {
    evmVersion: "cancun", // Make sure this matches your compiler setting
    optimizer: {
      enabled: true,
      runs: 200, // Adjust based on your optimization needs
    },
    viaIR: true, // Enable if your contract uses inline assembly
    metadata: {
      bytecodeHash: "none", // Optional: Set to "none" to exclude metadata hash
    },
  },
}

Add the network configuration:

networks: {
  "testnet": {
    url: "https://evmrpc-testnet.0g.ai",
    chainId: 16602,
    accounts: [process.env.PRIVATE_KEY]
  },
  "mainnet": {
    url: "https://evmrpc.0g.ai",
    chainId: 16661,
    accounts: [process.env.PRIVATE_KEY]
  }
}

and finally, add the etherscan configuration:

etherscan: {
  apiKey: {
    testnet: "YOUR_API_KEY", // Use a placeholder if you don't have one
    mainnet: "YOUR_API_KEY"  // Use a placeholder if you don't have one
  },
  customChains: [
    {
      // Testnet
      network: "testnet",
      chainId: 16602,
      urls: {
        apiURL: "https://chainscan-galileo.0g.ai/open/api",
        browserURL: "https://chainscan-galileo.0g.ai",
      },
    },
    {
      // Mainnet
      network: "mainnet",
      chainId: 16661,
      urls: {
        apiURL: "https://chainscan.0g.ai/open/api",
        browserURL: "https://chainscan.0g.ai",
      },
    },
  ],
},

To verify your contract, run the following command:

npx hardhat verify DEPLOYED_CONTRACT_ADDRESS --network <Network>

You should get a success message like this:

Successfully submitted source code for contract
contracts/Contract.sol:ContractName at DEPLOYED_CONTRACT_ADDRESS
for verification on the block explorer. Waiting for verification result...

Successfully verified contract TokenDist on the block explorer.
https://chainscan.0g.ai/address/<DEPLOYED_CONTRACT_ADDRESS>#code

Using 0G Precompiles
Available Precompiles
Precompile	Address	Purpose
DASigners	0x...1000	Data availability signatures
Wrapped0GBase	0x...1002	Wrapped 0G token operations
Troubleshooting
Transaction failing with "invalid opcode"?
Can't connect to RPC?
What's Next?
Learn Precompiles: Precompiles Overview
Storage Integration: 0G Storage SDK
Compute Integration: 0G Compute Guide
Need help? Join our Discord for developer support.

0G Chain Precompiles
Precompiled contracts that extend 0G Chain with powerful native features for AI and blockchain operations.

What Are Precompiles?
Precompiles are special contracts deployed at fixed addresses that execute native code instead of EVM bytecode. They provide:

Gas Efficiency: 10-100x cheaper than Solidity implementations
Native Features: Access chain-level functionality
Complex Operations: Cryptographic functions and state management
0G Chain Precompiles
Beyond standard Ethereum precompiles, 0G Chain adds specialized contracts for decentralized AI infrastructure:

🔐 DASigners
0x0000000000000000000000000000000000001000

Manages data availability signatures for 0G's DA layer.

Key Features:

Register and manage DA node signers
Query quorum information
Verify data availability proofs
Common Use Case: Building applications that need to verify data availability directly on-chain.

🪙 Wrapped0GBase
0x0000000000000000000000000000000000001002

Wrapped version of native 0G token for DeFi compatibility.

Key Features:

Wrap/unwrap native 0G tokens
ERC20-compatible interface
Efficient gas operations
Common Use Case: Integrating 0G tokens with DEXs, lending protocols, or other DeFi applications.

Questions? Get help in our Discord #dev-support channel.

0G Chain: The Fastest Modular AI Chain
The Problem with AI on Blockchain
Try running an AI model on Ethereum today:

Cost: $1M+ in gas fees for a simple model
Speed: 15 transactions per second (AI needs thousands)
Data: Can't handle AI's massive data requirements
What is 0G Chain?
0G Chain is a blockchain built specifically for AI applications. Think of it as Ethereum, but optimized for AI workloads with significantly higher throughput.

EVM Compatibility
Your existing Ethereum code works without changes 🤝

How 0G Chain Works
Modular Architecture
0G Chain features an advanced modular design that distinctly separates consensus from execution. This separation into independent, yet interconnected, layers is a cornerstone of 0G Chain's architecture, delivering enhanced flexibility, scalability, and a faster pace of innovation.

Architecture Overview:

Consensus Layer: Dedicated to achieving network agreement. It manages validator coordination, block production, and ensures the overall security and finality of the chain.
Execution Layer: Focused on state management. It handles smart contract execution, processes transactions, and maintains compatibility with the EVM (Ethereum Virtual Machine).
Key Technical Advantages:

Independent Upgradability: The execution layer can rapidly incorporate new EVM features (such as EIP-4844, account abstraction, or novel opcodes) without requiring changes to the underlying consensus mechanism.
Focused Optimization: Conversely, the consensus layer can be upgraded with critical performance or security enhancements without impacting the EVM or ongoing execution processes.
Accelerated Development: This decoupling allows for parallel development and faster iteration cycles for both layers, leading to quicker adoption of new technologies and improvements in both performance and features.
This design makes 0G Chain flexible and fast. When new blockchain features come out, we can add them quickly without breaking anything. This keeps 0G optimized for AI while staying up-to-date with the latest technology.

Optimized Consensus
0G Chain employs a highly optimized version of CometBFT (formerly Tendermint) as its consensus mechanism, with meticulously tuned parameters that achieve maximum performance while maintaining security. The system features carefully calibrated block production intervals and timeout configurations that work together to deliver high throughput, ensure network stability, and enable faster consensus rounds—all without compromising the fundamental safety guarantees.

These optimizations enable 0G Chain to achieve maximum performance:

11,000 TPS per Shard: Current throughput significantly exceeds traditional blockchain networks
Sub-second Finality: Near-instant transaction confirmation for AI applications
Consistent Performance: Maintains high throughput even under heavy network load
Scaling Roadmap
DAG-Based Consensus: Transitioning to Directed Acyclic Graph (DAG) based consensus for exponentially higher efficiency
Parallel transaction processing capabilities
Elimination of sequential block limitations
Shared Security Model: Implementing shared staking mechanisms to enhance network security
Validators can secure multiple services simultaneously
Increased capital efficiency for stakers
Technical Deep Dive
How does 0G achieve high throughput?
How does the validator system work?
What makes 0G different from other fast chains?
0G Chain Architecture
0G Chain's modular architecture enables seamless integration with storage, compute, and DA layers

Validator Participation
Validators earn rewards through:

Block rewards: For producing valid blocks
Transaction fees: From network usage
Staking rewards: Based on stake size and uptime
0G Validator Economics
Validator reward and penalty structure in the 0G network

Frequently Asked Questions
Is 0G Chain truly decentralized?
Do I need to rewrite my Ethereum dApp?
Why is it faster than Ethereum?
Next Steps
Ready to build? Start here:

Quick Start Guide - Deploy in 5 minutes
Migration from Ethereum - Move existing dApps
Technical Whitepaper - Deep architecture details
0G Chain: Where AI meets blockchain at scale.

0G Compute Network
Access affordable GPU computing power for AI workloads through a decentralized marketplace.

AI Computing Costs Are Crushing Innovation
Running AI models today means choosing between:

Cloud Providers: $5,000-50,000/month for dedicated GPUs
API Services: $0.03+ per request, adding up to thousands monthly
Building Infrastructure: Millions in hardware investment
Result: Only well-funded companies can afford AI at scale.

Decentralized GPU Marketplace
0G Compute Network connects idle GPU owners with AI developers, creating a marketplace that's:

90% Cheaper: Pay only for compute used, no monthly minimums
Instantly Available: Access 1000s of GPUs globally
Verifiable: Cryptographic proofs ensure computation integrity
Think of it as "Uber for GPUs" - matching supply with demand efficiently.

Architecture Overview
0G Compute Network Architecture

The network consists of:

Smart Contracts: Handle payments and verification
Provider Network: GPU owners running compute services
Client SDKs: Easy integration for developers
Verification Layer: Ensures computation integrity
Key Components
🤖 Supported Services
Service Type	What It Does	Status
Inference	Run pre-trained models (LLMs)	✅ Live
Fine-tuning	Fine-tune models with your data	✅ Live
Training	Train models from scratch	🔜 Coming
🔐 Trust & Verification
Verifiable Computation: Proof that work was done correctly

TEE (Trusted Execution Environment) for secure processing
Cryptographic signatures on all results
Can't fake or manipulate outputs
What makes it trustworthy?
Quick Start Paths
👨‍💻 "I want to use AI services"
Build AI-powered applications without infrastructure:

Install SDK - 5 minute setup
Fund your account - Pre-pay for usage
Send requests - OpenAI SDK compatible
🖥️ "I have GPUs to monetize"
Turn idle hardware into revenue:

Check hardware requirements
Set up provider software
🎯 "I need to fine-tune AI models"
Fine-tune models with your data:

Install CLI tools
Prepare your dataset
Start fine-tuning
Frequently Asked Questions
How much can I save compared to OpenAI?
Is my data secure?
How fast is it compared to centralized services?
0G Compute Network: Democratizing AI computing for everyone.

0G Compute Inference
0G Compute Network provides decentralized AI inference services, supporting various AI models including Large Language Models (LLM), text-to-image generation, and speech-to-text processing.

Prerequisites
Node.js >= 22.0.0
A wallet with 0G tokens (either testnet or mainnet)
EVM compatible wallet (for Web UI)
Supported Service Types
Chatbot Services: Conversational AI with models like GPT, DeepSeek, and others
Text-to-Image: Generate images from text descriptions using Stable Diffusion and similar models
Speech-to-Text: Transcribe audio to text using Whisper and other speech recognition models
Available Services
Testnet Services
View Testnet Services (2 Available)
Mainnet Services
View Mainnet Services (7 Available)
Choose Your Interface
Feature	Web UI	CLI	SDK
Setup time	~1 min	~2 min	~5 min
Interactive chat	✅	❌	❌
Automation	❌	✅	✅
App integration	❌	❌	✅
Direct API access	❌	❌	✅
Web UI
CLI
SDK
Best for: Quick testing, experimentation and direct frontend integration.

Option 1: Use the Hosted Web UI
Visit the official 0G Compute Marketplace directly — no installation required:

https://compute-marketplace.0g.ai/inference

Option 2: Run Locally
Installation
pnpm add @0glabs/0g-serving-broker -g

Launch Web UI
0g-compute-cli ui start-web

Open http://localhost:3090 in your browser.

Getting Started
1. Connect & Fund
Connect your wallet (MetaMask recommended)
Deposit some 0G tokens using the account dashboard
Browse available AI models and their pricing
2. Start Using AI Services
Option A: Chat Interface

Click "Chat" on any chatbot provider
Start conversations immediately
Perfect for testing and experimentation
Option B: Get API Integration

Click "Build" on any provider
Get step-by-step integration guides
Copy-paste ready code examples
Understanding Delayed Fee Settlement
How Fee Settlement Works
0G Compute Network uses delayed (batch) settlement for provider fees. This means:

Fees are not deducted immediately after each inference request. Instead, the provider accumulates usage fees and settles them on-chain in batches.
Your sub-account balance may appear to drop suddenly when a batch settlement occurs. For example, if you make 10 requests and the provider settles all at once, you'll see a single larger deduction rather than 10 small ones.
You are only charged for actual usage — no extra fees are deducted. The total amount settled always matches the sum of your individual request costs.
This is by design to reduce on-chain transaction costs and improve efficiency for both users and providers.
What this means in practice:

After making requests, your provider sub-account balance may temporarily appear higher than your "true" available balance
When settlement occurs, the balance updates to reflect all accumulated fees at once
If you see a sudden balance decrease, check your usage history — the total will match your actual usage
This behavior is visible in the Web UI (provider sub-account balances), CLI (get-account), and SDK (getAccount()).

Rate Limits
Per-User Rate Limits
Each provider enforces per-user rate limits to ensure fair resource sharing across all users. The default limits are:

30 requests per minute per user (sustained)
Burst allowance of 5 requests (short spikes allowed)
5 concurrent requests per user
If you exceed these limits, the provider will return HTTP 429 Too Many Requests. Wait briefly and retry. These limits are set by individual providers and may vary.

Troubleshooting
Common Issues
Error: Too many requests (429)
Error: Insufficient balance
Error: Provider not acknowledged
Error: No funds in provider sub-account
Web UI not starting
Next Steps
Manage Accounts → Account Management Guide
Fine-tune Models → Fine-tuning Guide
Become a Provider → Provider Setup
View Examples → GitHub
Questions? Join our Discord for support.

Become an Inference Provider
Transform your AI services into verifiable, revenue-generating endpoints on the 0G Compute Network. This guide covers setting up your service and connecting it through the provider broker.

Why Become a Provider?
Monetize Your Infrastructure: Turn idle GPU resources into revenue
Automated Settlements: The broker handles billing and payments automatically
Trust Through Verification: Offer verifiable services for premium rates
Prerequisites
Docker Compose 1.27+
OpenAI-compatible model service
Wallet with 0G tokens for gas fees
Setup Process
Prepare Your Model Service
Service Interface Requirements
Your AI service must implement the OpenAI API Interface for compatibility. This ensures consistent user experience across all providers.

Verification Interfaces
To ensure the integrity and trustworthiness of services, different verification mechanisms are employed. Each mechanism comes with its own specific set of protocols and requirements to ensure service verification and security.

TEE Verification (TeeML)
OPML, ZKML (Coming Soon)
TEE (Trusted Execution Environment) verification ensures your computations are tamper-proof. Services running in TEE:

Generate signing keys within the secure environment
Provide CPU and GPU attestations
Sign all inference results
These attestations should include the public key of the signing key, verifying its creation within the TEE. All inference results must be signed with this signing key.

Hardware Requirements
CPU: Intel TDX (Trusted Domain Extensions) enabled
GPU: NVIDIA H100 or H200 with TEE support
TEE Node Setup
There are two ways to start a TEE node for your inference service:

Method 1: Using Dstack
Follow the Dstack Getting Started Guide to prepare your TEE node using Dstack.

Method 2: Using Cryptopilot
Follow the 0G-TAPP README to set up your TEE node using Cryptopilot.

Download and Configure Inference Broker
To register and manage TEE services, handle user request proxies, and perform settlements, you need to use the Inference Broker.

Please visit the releases page to download and extract the latest version of the installation package. After extracting, use the executable config file to generate the configuration file and docker-compose.yml file according to your setup.

# Download from releases page
tar -xzf inference-broker.tar.gz
cd inference-broker

# Generate configuration files
./config

Launch Provider Broker
Follow the instructions in Dstack or 0G-TAPP documentation to start the service using the config file and docker-compose.yml file generated in the previous step.

The broker will:

Register your service on the network
Handle user authentication and request routing
Manage automatic settlement of payments
Troubleshooting
Broker fails to start
Service not accessible
Settlement issues
Next Steps
Join Community → Discord for support
Explore Inference → Inference Documentation for integration details

0G Storage SDKs
Build decentralized storage into your applications with our powerful SDKs designed for modern development workflows.

Available SDKs
Go SDK: Ideal for backend systems and applications built with Go
TypeScript SDK: Perfect for frontend development and JavaScript-based projects
Core Features
Both SDKs provide a streamlined interface to interact with the 0G Storage network:

Upload and Download Files: Securely store and retrieve data of various sizes and formats
Manage Data: List uploaded files, check their status, and control access permissions
Leverage Decentralization: Benefit from the 0G network's distributed architecture for enhanced data availability, immutability, and censorship resistance
Quick Start Resources
Starter Kits Available
Get up and running quickly with our starter kits:

TypeScript Starter Kit - CLI scripts, importable library, and browser UI with MetaMask wallet connect. Supports turbo/standard modes.
Go Starter Kit - Ready-to-use examples with Gin server and CLI tool
# TypeScript — upload a file in under 5 minutes
git clone https://github.com/0gfoundation/0g-storage-ts-starter-kit
cd 0g-storage-ts-starter-kit && npm install
cp .env.example .env   # Add your PRIVATE_KEY
npm run upload -- ./file.txt

Go SDK
TypeScript SDK
Installation
Install the 0G Storage Client library:

go get github.com/0gfoundation/0g-storage-client

Setup
Import Required Packages
import (
    "context"
    "github.com/0gfoundation/0g-storage-client/common/blockchain"
    "github.com/0gfoundation/0g-storage-client/common"
    "github.com/0gfoundation/0g-storage-client/indexer"
    "github.com/0gfoundation/0g-storage-client/transfer"
    "github.com/0gfoundation/0g-storage-client/core"
)

Initialize Clients
Create the necessary clients to interact with the network:

// Create Web3 client for blockchain interactions
w3client := blockchain.MustNewWeb3(evmRpc, privateKey)
defer w3client.Close()

// Create indexer client for node management
indexerClient, err := indexer.NewClient(indRpc, indexer.IndexerClientOption{
    LogOption: common.LogOption{},
})
if err != nil {
    // Handle error
}

Parameters: evmRpc is the chain RPC endpoint, privateKey is your signer key, and indRpc is the indexer RPC endpoint. Use the current values published in the network overview docs for your network.

Core Operations
Node Selection
Select storage nodes before performing file operations:

nodes, err := indexerClient.SelectNodes(ctx, expectedReplicas, droppedNodes, method, fullTrusted)
if err != nil {
    // Handle error
}

Parameters: ctx is the context for the operation. expectedReplicas is the number of replicas to maintain. droppedNodes is a list of nodes to exclude, method can be min, max, random, or a positive number string, and fullTrusted limits selection to trusted nodes.

File Upload
Upload files to the network with the indexer client:

file, err := core.Open(filePath)
if err != nil {
    // Handle error
}
defer file.Close()

fragmentSize := int64(4 * 1024 * 1024 * 1024)
opt := transfer.UploadOption{
    ExpectedReplica:  1,
    TaskSize:         10,
    SkipTx:           true,
    FinalityRequired: transfer.TransactionPacked,
    FastMode:         true,
    Method:           "min",
    FullTrusted:      true,
}

txHashes, roots, err := indexerClient.SplitableUpload(ctx, w3client, file, fragmentSize, opt)
if err != nil {
    // Handle error
}

fragmentSize controls the split size for large files. The returned roots contain the merkle root(s) to download later.

File Hash Calculation
Calculate a file's Merkle root hash for identification:

rootHash, err := core.MerkleRoot(filePath)
if err != nil {
    // Handle error
}
fmt.Printf("File hash: %s\n", rootHash.String())

Important
Save the root hash - you'll need it to download the file later!

File Download
Download files from the network:

rootHex := rootHash.String()
err = indexerClient.Download(ctx, rootHex, outputPath, withProof)
if err != nil {
    // Handle error
}

withProof enables merkle proof verification during download.

Best Practices
Error Handling: Implement proper error handling and cleanup
Context Management: Use contexts for operation timeouts and cancellation
Resource Cleanup: Always close clients when done using defer client.Close()
Verification: Enable proof verification for sensitive files
Monitoring: Track transaction status for important uploads
Additional Resources
Go SDK Repository
Go Starter Kit
Need more control? Consider running your own storage node to participate in the network and earn rewards.
0G Storage CLI
The 0G Storage CLI is your command-line gateway to interact directly with the 0G Storage network. It simplifies the process of uploading and downloading files while providing full control over your decentralized storage operations.

Why Use the CLI?
Direct Control: Manage data location and versioning with precision
Automation Ready: Build scripts and cron jobs for regular operations
Full Feature Access: Access all storage and KV operations from the terminal
Developer Friendly: Perfect for integrating into your development workflow
Web-Based Alternative
For a quick and easy web interface, try the 0G Storage Web Tool - perfect for one-off uploads and downloads.

Installation
Prerequisites
Go 1.18 or higher installed on your system
Git for cloning the repository
Setup Steps
1. Clone the Repository

git clone https://github.com/0gfoundation/0g-storage-client.git
cd 0g-storage-client

2. Build the Binary

go build

3. Add to PATH (Optional but recommended)

# Move binary to Go bin directory
mv 0g-storage-client ~/go/bin

# Add to PATH if not already configured
export PATH=~/go/bin:$PATH

Command Overview
The CLI provides a comprehensive set of commands for storage operations:

0g-storage-client [command] [flags]

Available Commands:
  upload      Upload file to 0G Storage network
  download    Download file from 0G Storage network
  upload-dir  Upload directory to 0G Storage network
  download-dir Download directory from 0G Storage network
  diff-dir    Diff directory from 0G Storage network
  gen         Generate test files
  kv-write    Write to KV streams
  kv-read     Read KV streams
  gateway     Start gateway service
  indexer     Start indexer service
  deploy      Deploy storage contracts
  completion  Generate shell completion scripts
  help        Get help for any command

Global Flags:
  --gas-limit uint                Custom gas limit to send transaction
  --gas-price uint                Custom gas price to send transaction
  --log-level string              Log level (default "info")
  --log-color-disabled            Force to disable colorful logs
  --rpc-retry-count int           Retry count for rpc request (default 5)
  --rpc-retry-interval duration   Retry interval for rpc request (default 5s)
  --rpc-timeout duration          Timeout for single rpc request (default 30s)
  --web3-log-enabled              Enable Web3 RPC logging

Core Operations
File Upload
Upload files to the 0G Storage network using the indexer service or explicit nodes:

0g-storage-client upload \
  --url <blockchain_rpc_endpoint> \
  --key <private_key> \
  --indexer <storage_indexer_endpoint> \
  --file <file_path>

Parameters: --url is the chain RPC endpoint, --key is your private key, and --file is the path to the file you want to upload. Use exactly one of --indexer or --node.

Common flags include --tags, --submitter, --expected-replica, --skip-tx, --finality-required, --task-size, --fast-mode, --fragment-size, --routines, --fee, --nonce, --max-gas-price, --n-retries, --step, --method, --full-trusted, --timeout, --flow-address, and --market-address.

Fee notes (turbo):

unitPrice = 11 / pricePerToken / 1024 * 256. If pricePerToken = 1, then unitPrice = 2.75 (tokens), or 2.75e18 0G.
pricePerSector(256B)/month = lifetimeMonth * unitPrice * 1e18 / 1024 / 1024 / 1024 (no /12 since $11 is per TB per month).
File Download
Download files from the network using the indexer or explicit nodes:

0g-storage-client download \
  --indexer <storage_indexer_endpoint> \
  --root <file_root_hash> \
  --file <output_file_path>

Parameters: --file is the output path. Use exactly one of --indexer or --node. Use exactly one of --root or --roots.

Download with Verification
Enable proof verification for enhanced security:

0g-storage-client download \
  --indexer <storage_indexer_endpoint> \
  --root <file_root_hash> \
  --file <output_file_path> \
  --proof

The --proof flag requests cryptographic proof of data integrity from the storage node.

Directory Upload
Upload an entire directory using explicit storage nodes:

0g-storage-client upload-dir \
  --url <blockchain_rpc_endpoint> \
  --key <private_key> \
  --node <storage_node_endpoint> \
  --file <directory_path>

Directory Download
Download a directory by root:

0g-storage-client download-dir \
  --indexer <storage_indexer_endpoint> \
  --root <directory_root_hash> \
  --file <output_directory>

Directory Diff
Compare a local directory with the on-chain version:

0g-storage-client diff-dir \
  --indexer <storage_indexer_endpoint> \
  --root <directory_root_hash> \
  --file <local_directory>

Practical Examples
Upload Example
# Upload a document to 0G Storage
0g-storage-client upload \
  --url <blockchain_rpc_endpoint> \
  --key YOUR_PRIVATE_KEY \
  --indexer <storage_indexer_endpoint> \
  --file ./documents/report.pdf

# Output:
# ✓ File uploaded successfully
# Root hash: 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
# Transaction: 0x742d35cc6634c0532925a3b844bc454e8e4a0e3f...

Download Example
# Download file using root hash
0g-storage-client download \
  --indexer <storage_indexer_endpoint> \
  --root 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 \
  --file ./downloads/report.pdf

# With verification
0g-storage-client download \
  --indexer <storage_indexer_endpoint> \
  --root 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 \
  --file ./downloads/report.pdf \
  --proof

Key-Value Operations
Write to KV Store (Batch Operations)
Write multiple key-value pairs in a single operation:

0g-storage-client kv-write \
  --url <blockchain_rpc_endpoint> \
  --key <private_key> \
  --indexer <storage_indexer_endpoint> \
  --stream-id <stream_id> \
  --stream-keys <comma_separated_keys> \
  --stream-values <comma_separated_values>

Important: --stream-keys and --stream-values are comma-separated string lists and their length must be equal.

You can use --indexer for node selection or pass storage nodes directly with --node. If --indexer is omitted, --node is required.

Example:

0g-storage-client kv-write \
  --url <blockchain_rpc_endpoint> \
  --key YOUR_PRIVATE_KEY \
  --indexer <storage_indexer_endpoint> \
  --stream-id 1 \
  --stream-keys "key1,key2,key3" \
  --stream-values "value1,value2,value3"

Read from KV Store
0g-storage-client kv-read \
  --node <kv_node_rpc_endpoint> \
  --stream-id <stream_id> \
  --stream-keys <comma_separated_keys>

KV Read Endpoint
Note that for KV read operations, you need to specify --node as the URL of a KV node, not the indexer endpoint.

RESTful API Gateway
The indexer service provides a RESTful API gateway for easy HTTP-based file access:

File Downloads via HTTP
By Transaction Sequence Number:

GET /file?txSeq=7

By File Merkle Root:

GET /file?root=0x0376e0d95e483b62d5100968ed17fe1b1d84f0bc5d9bda8000cdfd3f39a59927

With Custom Filename:

GET /file?txSeq=7&name=foo.log

Folder Support
Download specific files from within structured folders:

By Transaction Sequence:

GET /file/{txSeq}/path/to/file

By Merkle Root:

GET /file/{merkleRoot}/path/to/file

Advanced Features
Custom Gas Settings
Control transaction costs with custom gas parameters:

0g-storage-client upload \
  --gas-limit 3000000 \
  --gas-price 10000000000 \
  # ... other parameters

RPC Configuration
Configure RPC retry behavior and timeouts:

0g-storage-client upload \
  --rpc-retry-count 10 \
  --rpc-retry-interval 3s \
  --rpc-timeout 60s \
  # ... other parameters

Logging Configuration
Adjust logging for debugging:

# Verbose logging with Web3 details
0g-storage-client upload \
  --log-level debug \
  --web3-log-enabled \
  # ... other parameters

# Minimal logging
0g-storage-client download \
  --log-level error \
  --log-color-disabled \
  # ... other parameters

Shell Completion
Enable tab completion for easier command entry:

# Bash
0g-storage-client completion bash > /etc/bash_completion.d/0g-storage-client

# Zsh
0g-storage-client completion zsh > "${fpath[1]}/_0g-storage-client"

# Fish
0g-storage-client completion fish > ~/.config/fish/completions/0g-storage-client.fish

Indexer Service
The indexer service provides two types of storage node discovery:

Trusted Nodes
Well-maintained nodes that provide stable and reliable service.

Discovered Nodes
Nodes discovered automatically through the P2P network.

The indexer intelligently routes data to appropriate storage nodes based on their shard configurations, eliminating the need to manually specify storage nodes or contract addresses.

Important Considerations
Network Configuration
Required Information
RPC endpoints and indexer endpoints are published in the network overview docs. Use the current values for your network. Keep private keys secure and never share them.

File Management
Root Hash Storage: Save file root hashes after upload - they're required for downloads
Transaction Monitoring: Track upload transactions on the blockchain explorer
Indexer Benefits: The indexer automatically selects optimal storage nodes for better reliability
Running Services
Indexer Service
The indexer helps users find suitable storage nodes:

0g-storage-client indexer \
  --endpoint :12345 \
  --node <storage_node_endpoint>

Or start with a trusted node list:

0g-storage-client indexer \
  --endpoint :12345 \
  --trusted <node1,node2>

Gateway Service
Run a gateway to provide HTTP access to storage:

0g-storage-client gateway \
  --nodes <storage_node_endpoint>

Optionally specify a local file repo:

0g-storage-client gateway \
  --nodes <storage_node_endpoint> \
  --repo <local_path>

Automation Examples
Backup Script
Create automated backup scripts:

#!/bin/bash
# backup.sh - Daily backup to 0G Storage

DATE=$(date +%Y%m%d)
BACKUP_FILE="/backups/daily-${DATE}.tar.gz"

# Create backup
tar -czf $BACKUP_FILE /important/data

# Upload to 0G
ROOT_HASH=$(0g-storage-client upload \
  --url $RPC_URL \
  --key $PRIVATE_KEY \
  --indexer $INDEXER_URL \
  --file $BACKUP_FILE | grep "root =" | awk '{print $NF}')

# Save root hash
echo "${DATE}: ${ROOT_HASH}" >> /backups/manifest.txt

Monitoring Integration
Monitor uploads with logging:

# upload-with-monitoring.sh
0g-storage-client upload \
  --file $1 \
  --log-level info \
  # ... other parameters \
  2>&1 | tee -a /var/log/0g-uploads.log

Troubleshooting
Upload fails with "insufficient funds" error
"Indexer not found" error during upload/download
RPC timeout errors
Best Practices
Security First: Store private keys in environment variables, not command line
Backup Root Hashes: Always save file root hashes after uploads
Use Verification: Enable --proof for important downloads
Monitor Transactions: Track uploads on the blockchain explorer
Test with Gen: Use the gen command to create test files for development
HTTP Access: Leverage the RESTful API for web applications and integrations
Batch KV Operations: Use comma-separated lists for efficient key-value operations
Need more control? Consider running your own storage node to participate in the network and earn rewards.

0G Storage: Built for Massive Data
Current storage options force impossible tradeoffs:

Cloud providers: Fast but expensive with vendor lock-in
Decentralized options: Either slow (IPFS), limited (Filecoin), or prohibitively expensive (Arweave)
What is 0G Storage?
0G Storage breaks these tradeoffs - a decentralized storage network that's as fast as AWS S3 but built for Web3. Purpose-designed for AI workloads and massive datasets.

New to decentralized storage?
Why Choose 0G Storage?
🚀 The Complete Package
What You Get	Why It Matters
95% lower costs than AWS	Sustainable for large datasets
Instant retrieval	No waiting for critical data
Structured + unstructured data	One solution for all storage needs
Universal compatibility	Works with any blockchain or Web2 app
Proven scale	Already handling TB-scale workloads
How It Works
0G Storage is a distributed data storage system designed with on-chain elements to incentivize storage nodes to store data on behalf of users. Anyone can run a storage node and receive rewards for maintaining one.

Technical Architecture
0G Storage uses a two-lane system:

📤 Data Publishing Lane
💾 Data Storage Lane
Storage Architecture
Storage Layers for Different Needs
📁 Log Layer (Immutable Storage)
Perfect for: AI training data, archives, backups

Append-only (write once, read many)
Optimized for large files
Lower cost for permanent storage
Use cases:

ML datasets
Video/image archives
Blockchain history
General Large file storage
🔑 Key-Value Layer (Mutable Storage)
Perfect for: Databases, dynamic content, state storage

Update existing data
Fast key-based retrieval
Real-time applications
Use cases:

On-chain databases
User profiles
Game state
Collaborative documents
How Storage Providers Earn
0G Storage is maintained by a network of miners incentivized to store and manage data through a unique consensus mechanism known as Proof of Random Access (PoRA).

How It Works
Random Challenges: System randomly asks miners to prove they have specific data
Cryptographic Proof: Miners must generate a valid hash (like Bitcoin mining)
Quick Response: Must respond fast to prove data is readily accessible
Fair Rewards: Successful proofs earn storage fees
What's PoRA in simple terms?
PoRA
Fair Competition = Fair Reward
To promote fairness, the mining range is capped at 8 TB of data per mining operation.

Why 8TB limit?

Small miners can compete with large operations
Prevents centralization
Lower barrier to entry
For large operators: Run multiple 8TB instances.

For individuals: Focus on single 8TB range, still profitable

Mining Ranges
How 0G Compares
Solution	Best For	Limitation
0G Storage	AI/Web3 apps needing speed + scale	Newer ecosystem
AWS S3	Traditional apps	Centralized, expensive
Filecoin	Cold storage archival	Slow retrieval, unstructured only
Arweave	Permanent storage	Extremely expensive
IPFS	Small files, hobby projects	Very slow, no guarantees
0G's Unique Position
Only solution supporting both structured and unstructured data
Instant access unlike other decentralized options
Built for AI from the ground up
Frequently Asked Questions
Is my data really safe if nodes go offline?
How fast can I retrieve large files?
What happens to pricing as the network grows?
Can I migrate from existing storage?
Get Started
🧑‍💻 For Developers
Integrate 0G Storage in minutes → SDK Documentation

⛏️ For Storage Providers
Earn by providing storage capacity → Run a Storage Node

0G Storage: Purpose-built for AI and Web3's massive data needs.

0G DA Technical Deep Dive
The Data Availability (DA) module allows users to submit a piece of data, referred to as a DA blob. This data is redundantly encoded by the client's proxy and divided into several slices, which are then sent to DA nodes. DA nodes gain eligibility to verify the correctness of DA slices by staking. Each DA node verifies the integrity and correctness of its slice and signs it. Once more than 2/3 of the aggregated signatures are on-chain, the data behind the related hash is considered to be published decentrally.

To incentivize DA nodes to store the signed data for a period, the signing process itself does not provide any rewards. Instead, rewards are distributed through a process called DA Sampling. During each DA Sample round, any DA slice within a certain timeframe can generate a lottery chance for a reward. DA nodes must store the corresponding slice to redeem the lottery chance and claim the reward.

The process of generating DA nodes is the same as the underlying chain's PoS process, both achieved through staking. During each DA epoch (approximately 8 hours), DA nodes are assigned to several quorums. Within each quorum, nodes are assigned numbers 0 through 3071. Each number is assigned to exactly one node, but a node may be assigned to multiple quorums, depending on its staking weight.

DA Processing Flow
DA takes an input of data up to 32,505,852 bytes in length and processes it as follows:

Padding and Size Encoding:

Pad the data with zeros until it reaches 32,505,852 bytes
Add a little-endian format 4-byte integer at the end to indicate the original input size
Matrix Formation:

Slice the padded data into a 1024-row by 1024-column matrix, filling each row consecutively, with each element being 31 bytes
Pad each 31-byte element with an additional 1-byte zero, making it 32 bytes per element
Redundant Encoding:

Expand the data to a 3072-row by 1024-column matrix using redundancy coding
Calculate the erasure commitment and data root of the expanded matrix
Submission to DA Contract:

Submit the erasure commitment and data root to the DA contract and pay the fee
The DA contract will determine the epoch to which the data belongs and assign a quorum
Data Distribution:

Send the erasure commitment, data root, each row of the matrix, and necessary proofs of correctness to the corresponding DA nodes
Signature Aggregation:

More than 2/3 of the DA nodes sign the erasure commitment and data root
Aggregate the signatures using the BLS signature algorithm and submit the aggregated signature to the DA contract
Details of Erasure Encoding
After matrix formation, each element is processed into a 32-byte data unit, which can be viewed interchangeably as either 32 bytes of data or a 256-bit little-endian integer. Denote the element in the 
i
i-th row and 
j
j-th column as 
c
i
,
j
c 
i,j
​
 .

Let the finite field 
F
F be the scalar field of the BN254 curve. Each element 
c
i
,
j
c 
i,j
​
  is also considered an integer within the finite field 
F
F. Let 
p
p be the order of 
F
F, a known large number that can be expressed as 
2
28
×
A
+
1
2 
28
 ×A+1, where 
A
A is an odd number. The number 3 is a generator of the multiplicative group of the 
F
F. Define 
u
=
3
2
6
×
A
u=3 
2 
6
 ×A
  and 
w
=
3
2
8
×
A
w=3 
2 
8
 ×A
 , so 
w
2
20
=
1
w 
2 
20
 
 =1 and 
u
4
=
w
u 
4
 =w.

Now we define a polynomial 
f
f over 
F
→
F
F→F with degree 
d
=
2
20
−
1
d=2 
20
 −1 satisfying

∀
 
0
≤
i
<
1024
,
 
0
≤
j
<
1024
,
 
f
(
w
1024
j
+
i
)
=
c
i
,
j
∀0≤i<1024,0≤j<1024,f(w 
1024j+i
 )=c 
i,j
​
 

Then we extend the 
1024
×
1024
1024×1024 matrix into 
1024
×
3072
1024×3072 matrix, where

∀
 
1024
≤
i
<
2048
,
 
0
≤
j
<
1024
,
 
c
i
,
j
=
f
(
u
2
⋅
w
1024
j
+
(
i
−
1024
)
)
∀1024≤i<2048,0≤j<1024,c 
i,j
​
 =f(u 
2
 ⋅w 
1024j+(i−1024)
 )

∀
 
2048
≤
i
<
3072
,
 
0
≤
j
<
1024
,
 
c
i
,
j
=
f
(
u
⋅
w
1024
j
+
(
i
−
2048
)
)
∀2048≤i<3072,0≤j<1024,c 
i,j
​
 =f(u⋅w 
1024j+(i−2048)
 )

The erasure commitment is the KZG commitment of 
f
f, defined as 
f
(
τ
)
⋅
G
f(τ)⋅G, where 
G
G is the starting point of BN254 G1 curve, and 
τ
τ is a latent parameter from the perpetual powers of tau trusted setup ceremony.

The data root is defined as the input root by treating the 1024*3072 32-byte elements as a continuous storage submission input. Specifically, according to the storage submission requirements, these data does not need to pad any zeros, and will be divided into a 16384-element sector array and an 8192-element sector array.

DA nodes need to verify two parts:

The consistency between the received slice and the data root, mainly achieved through Merkle proofs
The consistency between the received slice and the erasure commitment, verified using KZG proofs. Here, we use the AMT protocol optimization introduced in LVMT to reduce the proving overhead
DA Sampling
The blockchain will periodically release DA Sampling tasks at preset height every SAMPLE_PERIOD blocks, with the parent block hash of these heights used as the sampleSeed for DA Sampling.

List of Parameters
Constant parameters

Parameter	Requirement	Default value
MAX_PODAS_TARGET		2^256 / 128 - 1
Admin adjustable parameters

Parameter	Requirement	Default value	Code
TARGET_SUBMITS		20	Link
EPOCH_WINDOW_SIZE		300 (about 3 months)	Link
SAMPLE_PERIOD		30 (about 1.5 minutes)	Link
Responses
During each period, each DA slice (one row) can be divided into 32 sub-lines. For each sub-line, the podasQuality will be computed using the dataRoot and assigned epoch and quorumId of its corresponding DA blob.

note
By default, all integers are in 256-bit big-endian format when computing hash values. lineIndex is the only exception, which is in 64-bit big-endian format.

The hash value can be viewed interchangeably as either 32 bytes of data or a 256-bit big-endian integer.

lineQuality = keccak256(sampleSeed, epoch, quorumId, dataRoot, lineIndex);
dataQuality = keccak256(lineQuality, sublineIndex, data);
podasQuality = lineQuality + dataQuality

If the podasQuality is less than the current podasTarget in the DA contract and the epoch falls within [currentEpoch - EPOCH_WINDOW_SIZE, currentEpoch), then this sub-line is regarded as a valid DAS response and is eligible for the reward. The DA node assigned to this row can claim the reward.

During a sample period, at most TARGET_SUBMITS × 2 DAS responses can be submitted and rewarded; any submissions exceeding this limit will be rejected.

Difficulty Adjustment
TARGET_SUBMITS valid responses are expected in a sample period. If more or fewer responses are submitted during a sample period, the podasTarget will be adjusted as follows:

podasTarget -= podasTarget * (actualSubmits - TARGET_SUBMITS) / TARGET_SUBMITS / 8

Economic Model
List of Parameters
Admin adjustable parameters

Parameter	Requirement	Default value	Code
BASE_REWARD		0	Link
BLOB_PRICE		0	Link
SERVICE_FEE_RATE_BP		0	Link
REWARD_RATIO	[1]	1,200,000	Link
[1] TARGET_SUBMITS × Time elapsed for EPOCH_WINDOW_SIZE epochs / Time elapsed in SAMPLE_PERIOD / REWARD_RATIO should be approximately 0.5 to 2.

Pricing
When users submit the metadata for a DA blob, they need to pay a fee in amount of BLOB_PRICE.

Reward
When a DA epoch ends, all the rewards from that DA epoch will be stored in the DA reward pool. Each time a valid response is submitted, 1 / REWARD_RATIO of the reward pool will be distributed to the corresponding DA node.

System Rewards
In the early stages of the ecosystem, the foundation can reserve a portion of tokens for system rewards. When the DA node submits a valid response, an additional reward of BASE_REWARD will be issued.

The funds for the base reward will be manually deposited into the reward contract and tracked separately. If the balance for the base reward is insufficient to cover a single base reward, miners will not be able to receive the full base reward.

Service Fee
A system service fee is charged as a proportion of the DA fees paid by the user, according to the parameter SERVICE_FEE_RATE_BP.

Run a Node
See here for instructions to become DA signer and run your own node.

Ready to dive deeper into 0G DA? Join our Discord for technical discussions.

0G Data Availability (DA): Integration
To submit data to the 0G DA, you must run a DA Client node and the Encoder node. The DA client interfaces with the Encoder for data encoding and the Retriever for data access.

Overview
Maximum Blob Size
Users can submit data blobs up to 32,505,852 bytes in length, which are then processed, encoded, and distributed across a network of DA nodes. The system employs a sophisticated data processing flow that includes padding, matrix formation, redundant encoding, and signature aggregation.

Fee Market
As the DA user, you pay a fee which is the (BLOB_PRICE) when submitting DA blob data.

Submitting Data
See example here: https://github.com/0gfoundation/0g-da-example-rust/blob/main/src/disperser.proto

Hardware Requirements
The following table outlines the hardware requirements for different types of DA Client nodes:

Node Type	Memory	CPU	Disk	Bandwidth	Additional Notes
DA Client	8 GB	2 cores	-	100 MBps	For Download / Upload
DA Encoder	-	-	-	-	NVIDIA Drivers: 12.04 on the RTX 4090*
DA Retriever	8 GB	2 cores	-	100 MBps	For Download / Upload
Standing up DA Client, Encoder, Retriever
DA Client
DA Encoder
DA Retriever
DA Client Node Installation
1. Clone the DA Client Node Repo

git clone https://github.com/0gfoundation/0g-da-client.git

2. Build the Docker Image

cd 0g-da-client
docker build -t 0g-da-client -f combined.Dockerfile .

3. Set Environment Variables

Create a file named envfile.env with the following content. Be sure you paste in your private key.

# envfile.env
COMBINED_SERVER_CHAIN_RPC=https://evmrpc-testnet.0g.ai
COMBINED_SERVER_PRIVATE_KEY=YOUR_PRIVATE_KEY
ENTRANCE_CONTRACT_ADDR=0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9

COMBINED_SERVER_RECEIPT_POLLING_ROUNDS=180
COMBINED_SERVER_RECEIPT_POLLING_INTERVAL=1s
COMBINED_SERVER_TX_GAS_LIMIT=2000000
COMBINED_SERVER_USE_MEMORY_DB=true
COMBINED_SERVER_KV_DB_PATH=/runtime/
COMBINED_SERVER_TimeToExpire=2592000
DISPERSER_SERVER_GRPC_PORT=51001
BATCHER_DASIGNERS_CONTRACT_ADDRESS=0x0000000000000000000000000000000000001000
BATCHER_FINALIZER_INTERVAL=20s
BATCHER_CONFIRMER_NUM=3
BATCHER_MAX_NUM_RETRIES_PER_BLOB=3
BATCHER_FINALIZED_BLOCK_COUNT=50
BATCHER_BATCH_SIZE_LIMIT=500
BATCHER_ENCODING_INTERVAL=3s
BATCHER_ENCODING_REQUEST_QUEUE_SIZE=1
BATCHER_PULL_INTERVAL=10s
BATCHER_SIGNING_INTERVAL=3s
BATCHER_SIGNED_PULL_INTERVAL=20s
BATCHER_EXPIRATION_POLL_INTERVAL=3600
BATCHER_ENCODER_ADDRESS=DA_ENCODER_SERVER
BATCHER_ENCODING_TIMEOUT=300s
BATCHER_SIGNING_TIMEOUT=60s
BATCHER_CHAIN_READ_TIMEOUT=12s
BATCHER_CHAIN_WRITE_TIMEOUT=13s

4. Run the Docker Node

docker run -d --env-file envfile.env --name 0g-da-client -v ./run:/runtime -p 51001:51001 0g-da-client combined

Configuration
Field	Description
--chain.rpc	JSON RPC node endpoint for the blockchain network.
--chain.private-key	Hex-encoded signer private key.
--chain.receipt-wait-rounds	Maximum retries to wait for transaction receipt.
--chain.receipt-wait-interval	Interval between retries when waiting for transaction receipt.
--chain.gas-limit	Transaction gas limit.
--combined-server.use-memory-db	Whether to use mem-db for blob storage.
--combined-server.storage.kv-db-path	Path for level db.
--combined-server.storage.time-to-expire	Expiration duration for blobs in level db.
--combined-server.log.level-file	File log level.
--combined-server.log.level-std	Standard output log level.
--combined-server.log.path	Log file path.
--disperser-server.grpc-port	Server listening port.
--disperser-server.retriever-address	GRPC host for retriever.
--batcher.da-entrance-contract	Hex-encoded da-entrance contract address.
--batcher.da-signers-contract	Hex-encoded da-signers contract address.
--batcher.finalizer-interval	Interval for finalizing operations.
--batcher.finalized-block-count	Default number of blocks between finalized block and latest block.
--batcher.confirmer-num	Number of Confirmer threads.
--batcher.max-num-retries-for-sign	Number of retries before signing fails.
--batcher.batch-size-limit	Maximum batch size in MiB.
--batcher.encoding-request-queue-size	Size of the encoding request queue.
--batcher.encoding-interval	Interval between blob encoding requests.
--batcher.pull-interval	Interval for pulling from the encoded queue.
--batcher.signing-interval	Interval between slice signing requests.
--batcher.signed-pull-interval	Interval for pulling from the signed queue.
--encoder-socket	GRPC host of the encoder.
--encoding-timeout	Total time to wait for a response from encoder.
--signing-timeout	Total time to wait for a response from signer.
Troubleshooting
DA Client connection issues
Encoder GPU not detected
Retriever fails to start
Next Steps
Integration Examples → DA Examples Repository
Join Community → Discord for support
Run a DA Node → DA Node Guide
Ready to integrate 0G DA into your application? Start with the DA Client and connect to the network.

Run an OP Stack Rollup on 0G DA
Optimism is a lightning-fast Ethereum L2 blockchain, built with the OP Stack. 0G DA is a high-performance data availability layer that can be used with Optimism to provide a cost-effective and secure solution for storing transaction data.

Overview
To implement this server specification, 0G DA provides a da-server that runs as a sidecar process alongside the OP Stack rollup node. This server connects to a 0G DA client to securely communicate with the 0G DA network.

Required Components
0G DA client node
0G DA encoder node
0G DA Server (deployment guide below)
OP Stack components with configuration adjustments
GitHub Repository
Find the repository for this integration at: https://github.com/0gfoundation/0g-da-op-plasma

The Optimism codebase has been extended to integrate with the 0G DA da-server. This server utilizes the 0G DA Open API to efficiently store and retrieve rollup data.

Deployment Steps
1. Deploy DA Server
Run with Docker
Build from Source
Build the Docker image:

docker build -t 0g-da-op-plasma .

Run the Docker container:

Adjust commands and parameters as required for your setup:

docker run -p 3100:3100 0g-da-op-plasma:latest da-server \
  --addr 0.0.0.0 \
  --port 3100 \
  --zg.server rpc_to_a_da_client  # default: 127.0.0.1:51001

DA Server Configuration Flags:

Flag	Description	Default
--zg.server	0G DA client server endpoint	localhost:51001
--addr	Server listening address	-
--port	Server listening port	-
2. Deploy DA Client and DA Encoder
For guidance on setting up a 0G DA client and DA Encoder, refer to the DA integration documentation.

3. Deploy OP Stack
Prerequisites
Ensure you have installed the following software:

Software	Version
Git	OS default
Go	1.21.6
Node	^20
just	1.34.0
Make	OS default
jq	OS default
direnv	Latest
Required releases:

op-node/v1.9.1
op-proposer/v1.9.1
op-batcher/v1.9.1
op-geth v1.101408.0
Build the Optimism Monorepo
1. Clone and navigate to the Optimism Monorepo:

git clone https://github.com/ethereum-optimism/optimism.git
cd optimism
git fetch --tag --all
git checkout v1.9.1
git submodule update --init --recursive

2. Check your dependencies:

./packages/contracts-bedrock/scripts/getting-started/versions.sh

3. Compile the necessary packages:

make op-node op-batcher op-proposer
make build

Build the Optimism Geth Source
1. Clone and navigate to op-geth:

git clone https://github.com/ethereum-optimism/op-geth.git
cd op-geth
git fetch --tag --all
git checkout v1.101408.0

2. Compile op-geth:

make geth

Get Access to a Sepolia Node
For deploying to Sepolia, access an L1 node using a provider like Alchemy (easier) or run your own Sepolia node (harder).

Configure Environment Variables
1. Enter the Optimism Monorepo:

cd ~/optimism

2. Duplicate the sample environment variable file:

cp .envrc.example .envrc

3. Fill out the environment variables:

Variable Name	Description
L1_RPC_URL	URL for your L1 node (a Sepolia node in this case)
L1_RPC_KIND	Kind of L1 RPC you're connecting to (alchemy, quicknode, infura, parity, nethermind, debug_geth, erigon, basic, any)
Generate Addresses
You'll need four addresses and their private keys:

Admin: Has the ability to upgrade contracts
Batcher: Publishes Sequencer transaction data to L1
Proposer: Publishes L2 transaction results (state roots) to L1
Sequencer: Signs blocks on the p2p network
1. Navigate to the contracts-bedrock package:

cd ~/optimism/packages/contracts-bedrock

2. Generate accounts:

./scripts/getting-started/wallets.sh

you will get the following output:

Copy the following into your .envrc file:
  
# Admin address
export GS_ADMIN_ADDRESS=0x9625B9aF7C42b4Ab7f2C437dbc4ee749d52E19FC
export GS_ADMIN_PRIVATE_KEY=0xbb93a75f64c57c6f464fd259ea37c2d4694110df57b2e293db8226a502b30a34
# Batcher address
export GS_BATCHER_ADDRESS=0xa1AEF4C07AB21E39c37F05466b872094edcf9cB1
export GS_BATCHER_PRIVATE_KEY=0xe4d9cd91a3e53853b7ea0dad275efdb5173666720b1100866fb2d89757ca9c5a
  
# Proposer address
export GS_PROPOSER_ADDRESS=0x40E805e252D0Ee3D587b68736544dEfB419F351b
export GS_PROPOSER_PRIVATE_KEY=0x2d1f265683ebe37d960c67df03a378f79a7859038c6d634a61e40776d561f8a2
  
# Sequencer address
export GS_SEQUENCER_ADDRESS=0xC06566E8Ec6cF81B4B26376880dB620d83d50Dfb
export GS_SEQUENCER_PRIVATE_KEY=0x2a0290473f3838dbd083a5e17783e3cc33c905539c0121f9c76614dda8a38dca


3. Save the addresses:

Copy the output from the above command and paste it into your .envrc file. Fund the addresses with Sepolia ETH:

Admin: 0.5 ETH
Proposer: 0.2 ETH
Batcher: 0.1 ETH
Production Note
Use secure hardware for key management in production environments. cast wallet is not designed for production deployments.

Load Environment Variables
1. Enter the Optimism Monorepo:

cd ~/optimism

2. Load the variables with direnv:

direnv allow

Deploy Core Contracts
1. Update the deployment configuration:

cd packages/contracts-bedrock
./scripts/getting-started/config.sh

2. Add 0G DA configuration:

Add the following at the bottom of getting_started.json:

{
  "useAltDA": true,
  "daCommitmentType": "GenericCommitment",
  "daChallengeWindow": 160,
  "daResolveWindow": 160,
  "daBondSize": 1000000,
  "daResolverRefundPercentage": 0
}

3. Deploy contracts (this can take up to 15 minutes):

DEPLOYMENT_OUTFILE=deployments/artifact.json \
DEPLOY_CONFIG_PATH=deploy-config/getting-started.json \
forge script scripts/deploy/Deploy.s.sol:Deploy \
  --broadcast --private-key $GS_ADMIN_PRIVATE_KEY \
  --rpc-url $L1_RPC_URL --slow

4. Generate L2 allocations:

CONTRACT_ADDRESSES_PATH=deployments/artifact.json \
DEPLOY_CONFIG_PATH=deploy-config/getting-started.json \
STATE_DUMP_PATH=deploy-config/statedump.json \
forge script scripts/L2Genesis.s.sol:L2Genesis \
  --sig 'runWithStateDump()' --chain <YOUR_L2_CHAINID>

Set Up L2 Configuration
1. Navigate to the op-node directory:

cd ~/optimism/op-node

2. Generate genesis and rollup configuration:

go run cmd/main.go genesis l2 \
  --deploy-config ../packages/contracts-bedrock/deploy-config/getting-started.json \
  --l1-deployments ../packages/contracts-bedrock/deployments/artifact.json \
  --outfile.l2 genesis.json \
  --outfile.rollup rollup.json \
  --l1-rpc $L1_RPC_URL \
  --l2-allocs ../packages/contracts-bedrock/deploy-config/statedump.json

3. Add alt_da configuration to rollup.json:

{
  "alt_da": {
    "da_challenge_contract_address": "0x0000000000000000000000000000000000000000",
    "da_commitment_type": "GenericCommitment",
    "da_challenge_window": 160,
    "da_resolve_window": 160
  }
}

4. Generate JWT secret:

openssl rand -hex 32 > jwt.txt

5. Copy files to op-geth directory:

cp genesis.json ~/op-geth
cp jwt.txt ~/op-geth

Initialize and Run Components
Initialize op-geth
cd ~/op-geth
mkdir datadir
build/bin/geth init --datadir=datadir genesis.json

Run op-geth
cd ~/op-geth
./build/bin/geth \
  --datadir ./datadir \
  --http \
  --http.corsdomain="*" \
  --http.vhosts="*" \
  --http.addr=0.0.0.0 \
  --http.port=9545 \
  --http.api=web3,debug,eth,txpool,net,engine \
  --ws \
  --ws.addr=0.0.0.0 \
  --ws.port=9546 \
  --ws.origins="*" \
  --ws.api=debug,eth,txpool,net,engine \
  --syncmode=full \
  --nodiscover \
  --maxpeers=0 \
  --networkid=42069 \
  --authrpc.vhosts="*" \
  --authrpc.addr=0.0.0.0 \
  --authrpc.port=9551 \
  --authrpc.jwtsecret=./jwt.txt \
  --rollup.disabletxpoolgossip=true \
  --state.scheme=hash

Run op-node
cd ~/optimism/op-node
./bin/op-node \
  --l2=http://localhost:9551 \
  --l2.jwt-secret=./jwt.txt \
  --sequencer.enabled \
  --sequencer.l1-confs=5 \
  --verifier.l1-confs=4 \
  --rollup.config=./rollup.json \
  --rpc.addr=0.0.0.0 \
  --rpc.port=8547 \
  --p2p.disable \
  --rpc.enable-admin \
  --p2p.sequencer.key=$GS_SEQUENCER_PRIVATE_KEY \
  --l1=$L1_RPC_URL \
  --l1.rpckind=$L1_RPC_KIND \
  --altda.enabled=true \
  --altda.da-server=<DA_SERVER_HTTP_URL> \
  --altda.da-service=true \
  --l1.beacon.ignore=true

Run op-batcher
cd ~/optimism/op-batcher
./bin/op-batcher \
  --l2-eth-rpc=http://localhost:9545 \
  --rollup-rpc=http://localhost:8547 \
  --poll-interval=1s \
  --sub-safety-margin=6 \
  --num-confirmations=1 \
  --safe-abort-nonce-too-low-count=3 \
  --resubmission-timeout=30s \
  --rpc.addr=0.0.0.0 \
  --rpc.port=8548 \
  --rpc.enable-admin \
  --max-channel-duration=1 \
  --l1-eth-rpc=$L1_RPC_URL \
  --private-key=$GS_BATCHER_PRIVATE_KEY \
  --altda.enabled=true \
  --altda.da-service=true \
  --altda.da-server=<DA_SERVER_HTTP_URL>

Controlling Batcher Costs
The --max-channel-duration=n setting controls how often data is written to L1. Lower values mean faster synchronization but higher costs. Set to 0 to disable or increase for lower costs.

Run op-proposer
cd ~/optimism/op-proposer
./bin/op-proposer \
  --poll-interval=12s \
  --rpc.port=9560 \
  --rollup-rpc=http://localhost:8547 \
  --l2oo-address=$L2OO_ADDR \
  --private-key=$GS_PROPOSER_PRIVATE_KEY \
  --l1-eth-rpc=$L1_RPC_URL

Acquire Sepolia ETH for Layer 2
1. Navigate to contracts-bedrock:

cd ~/optimism/packages/contracts-bedrock

2. Find the L1 standard bridge contract address:

cat deployments/artifact.json | jq -r .L1StandardBridgeProxy

3. Send Sepolia ETH to the bridge contract address

Test Your Rollup
You now have a fully operational 0G DA-powered Optimism-based EVM Rollup. Experiment with it as you would with any other test blockchain.

Notes
This is a beta integration with active development ongoing
Ensure all necessary ports are open in your firewall configuration
Refer to the Optimism documentation for additional configuration options and troubleshooting
Congratulations on setting up your OP Stack rollup with 0G DA!