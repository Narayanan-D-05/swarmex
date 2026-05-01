import { Request, Response, NextFunction } from 'express';
// Using the real validating middleware (throws 402, verifies macroons via facilitator)
import { paymentMiddleware } from 'x402-express';

import { ethers } from 'ethers';

let onPaymentClaim: (sessionId: string, claim: any) => void = () => {};
export function setPaymentEmitter(fn: typeof onPaymentClaim) {
  onPaymentClaim = fn;
}

const facilitatorUrl = process.env.X402_FACILITATOR_URL || 'https://facilitator.cdp.coinbase.com';

// Extract agent address to receive payments
const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!);

// Create the real validating middleware
const realPaymentGuard = paymentMiddleware(
  agentWallet.address as `0x${string}`,
  {
    price: '$0.20', // USDC amount in dollars
    network: 'base-sepolia'
  },
  {
    url: facilitatorUrl
  }
);

export const x402Gate = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.headers['x-session-id'] as string;
  const idempotencyKey = req.headers['x-idempotency-key'] as string;

  if (!sessionId || !idempotencyKey) {
    res.status(400).json({ error: 'Missing session or idempotency key' });
    return;
  }

  // Intercept the NextFunction to inject our SSE logging after real x402 verifies the payment
  const wrappedNext = ((err?: any) => {
    if (err) return next(err);
    
    // If we reach here, the real paymentMiddleware successfully validated the L402!
    onPaymentClaim(sessionId, {
      agent: req.path.split('/')[2] || 'unknown',
      amount: "0.20",
      taskId: idempotencyKey,
      timestamp: Date.now()
    });

    next();
  }) as NextFunction;

  // Execute the real protocol guard
  realPaymentGuard(req, res, wrappedNext);
};
