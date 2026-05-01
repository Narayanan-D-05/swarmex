import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function deploy() {
    const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
    const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);

    console.log(`Deploying from: ${wallet.address}`);

    // Helper to get Artefact
    const getAbiAndBytecode = (name: string) => {
        const filePath = path.join(__dirname, `../../contracts/out/${name}.sol/${name}.json`);
        const file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return { abi: file.abi, bytecode: file.bytecode.object };
    };

    // Since we don't have 'out/' yet (no forge build), I will use the compiler output if I can, 
    // or I'll just install hardhat quickly.
    // Actually, I'll just run 'npx hardhat' since it's easier to setup than a raw ethers deploy without bytecode.
}
