// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script} from "forge-std/Script.sol";
import {HookMiner} from "../src/utils/HookMiner.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {SwarmExecutorHook} from "../src/SwarmExecutorHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("AGENT_PRIVATE_KEY");
        address poolManagerAddress = vm.envAddress("POOL_MANAGER_ADDRESS");
        address registryAddress = vm.envAddress("AGENT_REGISTRY_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Permission flags — verify against installed v4-core Hooks.sol
        uint160 permissions = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);

        (address hookAddress, bytes32 salt) = HookMiner.find(
            msg.sender,          // deployer = this script's sender
            permissions,
            type(SwarmExecutorHook).creationCode,
            abi.encode(poolManagerAddress, registryAddress)
        );

        SwarmExecutorHook hook = new SwarmExecutorHook{salt: salt}(
            IPoolManager(poolManagerAddress),
            registryAddress
        );
        require(address(hook) == hookAddress, "HookMiner: address mismatch");

        vm.stopBroadcast();
    }
}
