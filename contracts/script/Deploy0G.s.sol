// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {SwarmExecutorHook} from "../src/SwarmExecutorHook.sol";
import {HookMiner} from "../src/utils/HookMiner.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

contract Deploy0G is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("AGENT_PRIVATE_KEY");
        address poolManagerAddress = vm.envAddress("POOL_MANAGER_ADDRESS_OG");
        address registryAddress = vm.envAddress("AGENT_REGISTRY_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockUSDC
        MockUSDC usdc = new MockUSDC();
        console.log("MOCK_USDC_ADDRESS=", address(usdc));

        // Mint some USDC to the user wallet immediately
        // USER_PRIVATE_KEY public address
        address userWallet = 0x7Eb0A26Dc2422675a53DbFcC9CF72EAb4570f620;
        usdc.mint(userWallet, 1000 * 10**18);
        console.log("Minted 1000 MockUSDC to user wallet:", userWallet);

        // 2. Deploy PoolSwapTest
        PoolSwapTest poolSwapTest = new PoolSwapTest(IPoolManager(poolManagerAddress));
        console.log("POOL_SWAP_TEST_ADDRESS=", address(poolSwapTest));

        // 3. Mine and Deploy Hook
        uint160 permissions = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);
        (address hookAddress, bytes32 salt) = HookMiner.find(
            vm.addr(deployerPrivateKey),
            permissions,
            type(SwarmExecutorHook).creationCode,
            abi.encode(poolManagerAddress, registryAddress)
        );

        SwarmExecutorHook hook = new SwarmExecutorHook{salt: salt}(
            IPoolManager(poolManagerAddress),
            registryAddress
        );
        console.log("HOOK_ADDRESS=", address(hook));

        vm.stopBroadcast();
    }
}
