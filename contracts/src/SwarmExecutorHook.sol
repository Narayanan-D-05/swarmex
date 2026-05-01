// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

// Exact imports from uniswap.md verified paths
import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {IAgentRegistry} from "./interfaces/IAgentRegistry.sol";

contract SwarmExecutorHook is BaseHook, EIP712 {
    // Bug #15 fix: EIP-712 type hash — must exactly match TypeScript domain in eip712-signer.ts
    bytes32 public constant RISK_ATTESTATION_TYPEHASH = keccak256(
        "RiskAttestation(address sessionWallet,address tokenIn,address tokenOut,"
        "uint256 maxSlippageBps,uint256 maxAmountIn,uint256 expiresAt,bytes32 swarmConsensusHash)"
    );

    struct RiskAttestation {
        address sessionWallet;
        address tokenIn;
        address tokenOut;
        uint256 maxSlippageBps;
        uint256 maxAmountIn;
        uint256 expiresAt;
        bytes32 swarmConsensusHash;
    }

    IAgentRegistry public immutable agentRegistry;

    event SwapExecuted(
        address indexed sender,
        bytes32 indexed poolId,
        bool zeroForOne,
        int128 amount0,
        int128 amount1
    );

    constructor(IPoolManager _manager, address _registry)
        BaseHook(_manager)
        // Bug #15 fix: name/version MUST match eip712-signer.ts domain exactly
        EIP712("SwarmExecutorHook", "1")
    {
        agentRegistry = IAgentRegistry(_registry);
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false, afterInitialize: false,
            beforeAddLiquidity: false, afterAddLiquidity: false,
            beforeRemoveLiquidity: false, afterRemoveLiquidity: false,
            beforeSwap: true,   // verify Risk Agent EIP-712 attestation
            afterSwap: true,    // emit SwapExecuted event (Bug #5: NO cross-chain call)
            beforeDonate: false, afterDonate: false,
            beforeSwapReturnDelta: false, afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false, afterRemoveLiquidityReturnDelta: false
        });
    }

    function _beforeSwap(
        address sender,
        PoolKey calldata,
        SwapParams calldata,
        bytes calldata hookData
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        (RiskAttestation memory att, bytes memory sig) = abi.decode(
            hookData, (RiskAttestation, bytes)
        );

        // Verify EIP-712 signature
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            RISK_ATTESTATION_TYPEHASH,
            att.sessionWallet, att.tokenIn, att.tokenOut,
            att.maxSlippageBps, att.maxAmountIn, att.expiresAt, att.swarmConsensusHash
        )));
        address signer = ECDSA.recover(digest, sig);

        require(agentRegistry.isAuthorizedRiskAgent(signer), "invalid risk agent");
        require(att.expiresAt > block.timestamp, "attestation expired");
        require(att.sessionWallet == sender, "session wallet mismatch");

        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function _afterSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata
    ) internal override returns (bytes4, int128) {
        emit SwapExecuted(
            sender,
            PoolId.unwrap(PoolIdLibrary.toId(key)),
            params.zeroForOne,
            delta.amount0(),
            delta.amount1()
        );
        return (BaseHook.afterSwap.selector, 0);
    }
}
