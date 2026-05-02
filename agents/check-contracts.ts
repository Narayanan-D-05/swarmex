import { createPublicClient, http } from 'viem';

const client = createPublicClient({
  transport: http('https://evmrpc-testnet.0g.ai')
});

const addresses = {
  POOL_MANAGER_ADDRESS_OG: '0x0c3970a25d85Fb45BcFfB064223d69361de641D1',
  HOOK_ADDRESS: '0x1004FF64CAd4936473a283Ee51023847B02640C0',
  SESSION_TREASURY_ADDRESS: '0xc492652e0eb78F9DB400bE1554AE991F2dDBF79A',
  AGENT_REGISTRY_ADDRESS: '0xEC8a2f743e61ff92C2846ef308b5e62C18FBF7Fb',
  USDC_ADDRESS: '0xF8BBc49BacD5678Fe8a03e5C97686B8614805F71',
  UNIVERSAL_ROUTER_ADDRESS: '0x492e6456d9528771018deb9e87ef7750ef184104',
  PERMIT2_ADDRESS: '0x000000000022D473030F116dDEE9F6B43aC78BA3'
};

async function main() {
  for (const [name, address] of Object.entries(addresses)) {
    const code = await client.getBytecode({ address: address as `0x${string}` });
    if (!code || code === '0x') {
      console.log(`${name} (${address}): NOT DEPLOYED`);
    } else {
      console.log(`${name} (${address}): DEPLOYED (${code.length / 2} bytes)`);
    }
  }
}
main();
