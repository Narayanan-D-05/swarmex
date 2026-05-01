// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script} from "forge-std/Script.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {SessionTreasury} from "../src/SessionTreasury.sol";
import {SwarmExecutorHook} from "../src/SwarmExecutorHook.sol";
import {HookMiner} from "../src/utils/HookMiner.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";

contract DeployAllScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("AGENT_PRIVATE_KEY");
        address poolManagerAddress = vm.envAddress("POOL_MANAGER_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Registry
        AgentRegistry registry = new AgentRegistry();
        console.log("AGENT_REGISTRY_ADDRESS=", address(registry));

        // 2. Deploy Treasury (Mock USDC address for now - 0x...0)
        SessionTreasury treasury = new SessionTreasury(address(0x1)); // Mock USDC on Base Sepolia
        console.log("SESSION_TREASURY_ADDRESS=", address(treasury));

        // 3. Mine and Deploy Hook
        uint160 permissions = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);
        (address hookAddress, bytes32 salt) = HookMiner.find(
            vm.addr(deployerPrivateKey),
            permissions,
            type(SwarmExecutorHook).creationCode,
            abi.encode(poolManagerAddress, address(registry))
        );

        SwarmExecutorHook hook = new SwarmExecutorHook{salt: salt}(
            IPoolManager(poolManagerAddress),
            address(registry)
        );
        console.log("HOOK_ADDRESS=", address(hook));

        vm.stopBroadcast();
    }
}
