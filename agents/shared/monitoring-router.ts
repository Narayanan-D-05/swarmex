import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const router = express.Router();

/**
 * Route for KeeperHub to check the agent's gas balance on 0G Testnet.
 * If balance is below threshold, it returns a 400 error which 
 * KeeperHub can use to trigger a "Low Balance" Discord/Email alert.
 */
router.get('/check-gas', async (req, res) => {
  try {
    const rpc = process.env.OG_CHAIN_RPC || 'https://evmrpc-testnet.0g.ai';
    const provider = new ethers.JsonRpcProvider(rpc);
    
    // Check Agent Wallet
    const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!).address;
    const balance = await provider.getBalance(agentWallet);
    const balanceEth = parseFloat(ethers.formatEther(balance));

    const threshold = 1.0; // 1.0 A0GI threshold

    if (balanceEth < threshold) {
      return res.status(400).json({
        alert: true,
        message: `🚨 Low Balance Alert: Agent wallet ${agentWallet} has only ${balanceEth} A0GI.`,
        balance: balanceEth,
        threshold
      });
    }

    res.json({
      alert: false,
      message: "Balance sufficient",
      balance: balanceEth
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
