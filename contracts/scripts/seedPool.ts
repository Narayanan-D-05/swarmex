import hardhat from "hardhat";
const { ethers } = hardhat;
import "dotenv/config";

const NATIVE_ETH = '0x0000000000000000000000000000000000000000';
const POOL_MANAGER = '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408';
const MODIFY_ROUTER = '0x37429cd17cb1454c34e7f50b09725202fd533039';

const POOL_MANAGER_ABI = [
  "function initialize((address,address,uint24,int24,address),uint160) external returns (int24)"
];

const MODIFY_ROUTER_ABI = [
  "function modifyLiquidity((address,address,uint24,int24,address), (int24,int24,int256,bytes32), bytes) external payable returns (int256)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)"
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Use the existing MockUSDC if deployed, otherwise deploy a new one.
  const usdcAddress = process.env.SEPOLIA_USDC_ADDRESS || (await (await ethers.deployContract("MockUSDC")).waitForDeployment()).target;
  console.log("MockUSDC address:", usdcAddress);

  const manager = new ethers.Contract(POOL_MANAGER, POOL_MANAGER_ABI, deployer);
  const router = new ethers.Contract(MODIFY_ROUTER, MODIFY_ROUTER_ABI, deployer);

  const currency0 = NATIVE_ETH < usdcAddress.toLowerCase() ? NATIVE_ETH : usdcAddress;
  const currency1 = NATIVE_ETH < usdcAddress.toLowerCase() ? usdcAddress : NATIVE_ETH;

  const poolKeyArray = [
    currency0,
    currency1,
    500,
    10,
    "0x0000000000000000000000000000000000000000"
  ];

  const sqrtPriceX96 = BigInt("79228162514264337593543950336");

  // 3. Initialize Pool
  console.log("Initializing pool...");
  try {
    const initTx = await manager.initialize(poolKeyArray, sqrtPriceX96);
    await initTx.wait();
    console.log("Pool initialized!");
  } catch (err: any) {
    console.log("Initialization issue (could be OK if already init):", err.message);
    if (err.walk) {
      const e = err.walk();
      console.log("Inner:", e.message);
    }
  }

  // 4. Approve router
  console.log("Approving modify router...");
  const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, deployer);
  await (await usdcContract.approve(MODIFY_ROUTER, ethers.MaxUint256)).wait();

  // 5. Add liquidity
  console.log("Adding liquidity...");
  const modifyParamsArray = [
    -887270,
    887270,
    "10000000000000000", // 0.01 
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  ];

  try {
    const liqTx = await router.modifyLiquidity(poolKeyArray, modifyParamsArray, "0x", { value: ethers.parseEther("0.05") });
    await liqTx.wait();
    console.log("Liquidity added!");
  } catch (e: any) {
    console.log("Liquidity add failed:", e.message.substring(0, 100));
  }

  console.log("--- DONE ---");
  console.log(`UPDATE .env: SEPOLIA_USDC_ADDRESS=${usdcAddress}`);
}

main().catch(console.error);
