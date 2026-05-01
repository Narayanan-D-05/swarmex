// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Mines a CREATE2 salt so the deployed hook address encodes the correct permission bits.
/// @dev Vendored directly — Uniswap/v4-template (404) and v4-periphery do not contain this.
library HookMiner {
    // Low 14 bits of the hook address encode hook permissions in v4-core
    uint160 constant FLAG_MASK = uint160((1 << 14) - 1);

    /// @notice Find a salt whose CREATE2 deployment address has the correct permission bits.
    /// @param deployer    The CREATE2 factory address (your Deploy script address)
    /// @param permissions uint160 with the desired flags set (e.g., beforeSwap | afterSwap bits)
    /// @param creationCode   abi.encodePacked(type(Contract).creationCode)
    /// @param constructorArgs abi.encode(constructorArg1, constructorArg2, ...)
    /// @return hookAddress The address the hook will be deployed at
    /// @return salt        The bytes32 salt to pass to CREATE2
    function find(
        address deployer,
        uint160 permissions,
        bytes memory creationCode,
        bytes memory constructorArgs
    ) internal pure returns (address hookAddress, bytes32 salt) {
        bytes memory initCode = abi.encodePacked(creationCode, constructorArgs);
        bytes32 initCodeHash = keccak256(initCode);

        for (uint256 i = 0; i < 200_000; i++) {
            salt = bytes32(i);
            hookAddress = address(
                uint160(uint256(keccak256(abi.encodePacked(
                    bytes1(0xff),
                    deployer,
                    salt,
                    initCodeHash
                ))))
            );
            // Check that the low 14 bits of the address match the desired permissions
            if (uint160(hookAddress) & FLAG_MASK == permissions & FLAG_MASK) {
                return (hookAddress, salt);
            }
        }
        revert("HookMiner: salt not found in 200k iterations");
    }
}
