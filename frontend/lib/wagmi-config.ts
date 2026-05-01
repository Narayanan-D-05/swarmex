import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

// OG.md: exact chain spec
const ogTestnet = {
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
  blockExplorers: { default: { name: '0G Scan', url: 'https://chainscan-galileo.0g.ai' } },
} as const;

export const wagmiConfig = createConfig({
  chains: [baseSepolia, ogTestnet],
  transports: {
    [baseSepolia.id]: http(),
    [ogTestnet.id]:   http('https://evmrpc-testnet.0g.ai'),
  },
});
