// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MockUSDC} from "./MockUSDC.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {PoolModifyLiquidityTest} from "@uniswap/v4-core/src/test/PoolModifyLiquidityTest.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {SwarmExecutorHook} from "./SwarmExecutorHook.sol";

contract DeployerContract {
    function deployAll(address poolManagerAddress, address registryAddress, bytes32 salt) external returns (address mockUsdc, address poolSwapTest, address poolModifyLiquidityTest, address hook) {
        // 1. Deploy MockUSDC
        MockUSDC usdc = new MockUSDC();
        mockUsdc = address(usdc);

        // 2. Deploy PoolSwapTest
        PoolSwapTest pst = new PoolSwapTest(IPoolManager(poolManagerAddress));
        poolSwapTest = address(pst);

        // 3. Deploy PoolModifyLiquidityTest
        PoolModifyLiquidityTest pmlt = new PoolModifyLiquidityTest(IPoolManager(poolManagerAddress));
        poolModifyLiquidityTest = address(pmlt);

        // 4. Deploy Hook using CREATE2
        SwarmExecutorHook h = new SwarmExecutorHook{salt: salt}(
            IPoolManager(poolManagerAddress),
            registryAddress
        );
        hook = address(h);
    }
}
