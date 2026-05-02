import { keccak256, encodePacked, getCreate2Address } from 'viem';

export function findSalt(
    deployer: `0x${string}`,
    permissions: number,
    initCodeHash: `0x${string}`
): `0x${string}` {
    const FLAG_MASK = BigInt((1 << 14) - 1);
    const requiredPermissions = BigInt(permissions) & FLAG_MASK;

    for (let i = 0; i < 2000000; i++) {
        // Convert i to a 32-byte hex string properly
        const saltHex = i.toString(16).padStart(64, '0');
        const salt = `0x${saltHex}` as `0x${string}`;

        const hookAddress = getCreate2Address({
            from: deployer,
            salt,
            bytecodeHash: initCodeHash
        });

        // Check if lower 14 bits match
        const addressBigInt = BigInt(hookAddress);
        if ((addressBigInt & FLAG_MASK) === requiredPermissions) {
            return salt;
        }
    }
    throw new Error('Salt not found');
}
