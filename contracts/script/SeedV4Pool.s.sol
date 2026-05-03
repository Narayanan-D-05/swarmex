// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

interface IMockERC20 {
    function mint(address to, uint256 amount) external;
}

interface IPoolManager {
    function initialize(
        PoolKey memory key,
        uint160 sqrtPriceX96,
        bytes calldata hookData
    ) external returns (int24 tick);
}

interface IPoolModifyLiquidityTest {
    function modifyLiquidity(
        PoolKey memory key,
        IPoolManager.ModifyLiquidityParams memory params,
        bytes memory hookData
    ) external payable returns (int256 delta0, int256 delta1);
}

struct PoolKey {
    address currency0;
    address currency1;
    uint24 fee;
    int24 tickSpacing;
    address hooks;
}

contract MockUSDC {
    string public name = "Mock USDC";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract InitAndSeedPool is Script {
    IPoolManager manager = IPoolManager(0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408);
    IPoolModifyLiquidityTest modifyRouter = IPoolModifyLiquidityTest(0x0952b61Bbdc593E2B63aCA38104D653f57De1c1a);
    address NATIVE_ETH = 0x0000000000000000000000000000000000000000;

    function run() external {
        uint256 pk = vm.envUint("USER_PRIVATE_KEY");
        address me = vm.addr(pk);
        vm.startBroadcast(pk);

        // 1. Deploy Mock USDC
        MockUSDC usdc = new MockUSDC();
        usdc.mint(me, 1000000 * 10**6); // Mint 1M USDC
        usdc.approve(address(modifyRouter), type(uint256).max);

        // Sort currencies
        address currency0;
        address currency1;
        if (NATIVE_ETH < address(usdc)) {
            currency0 = NATIVE_ETH;
            currency1 = address(usdc);
        } else {
            currency0 = address(usdc);
            currency1 = NATIVE_ETH;
        }

        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 500,
            tickSpacing: 10,
            hooks: address(0)
        });

        // 2. Initialize pool at 1:1 price (approx)
        // sqrtPriceX96 for 1:1 when decimals differ (18 vs 6) requires math
        // Let's just use 1 ETH = 3000 USDC.
        // Price = token1/token0. If currency0 is ETH (18 decimals) and currency1 is USDC (6 decimals).
        // 1 ETH = 10^18 units. 3000 USDC = 3000 * 10^6 = 3 * 10^9 units.
        // P = (3 * 10^9) / 10^18 = 3 * 10^-9
        // sqrtP = sqrt(3 * 10^-9) = 5.4772 * 10^-5
        // sqrtPriceX96 = sqrtP * 2^96 = (5.4772 * 10^-5) * 7.9228 * 10^28 = 4.339 * 10^24
        uint160 startingPrice = 4339505179874558296064000; 

        manager.initialize(key, startingPrice, new bytes(0));

        // 3. Add liquidity
        IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
            tickLower: -887270,
            tickUpper: 887270,
            liquidityDelta: 1000000000000000,
            salt: 0
        });

        modifyRouter.modifyLiquidity{value: 0.1 ether}(key, params, new bytes(0));

        vm.stopBroadcast();
        
        // Print the new USDC address so we can update .env
        // Use console.log via revert to output it easily
        revert(string(abi.encodePacked("NEW_USDC_ADDRESS=", vm.toString(address(usdc)))));
    }
}
