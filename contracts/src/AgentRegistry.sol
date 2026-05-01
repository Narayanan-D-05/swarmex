// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Registry for SwarmEx agent identities and performance tracking.
/// @dev Called off-chain by Reporter Agent after swap confirmation — NOT from hook (Bug #5 fix).
contract AgentRegistry is Ownable {
    enum AgentType { Orchestrator, Research, Backtester, RiskGuard, Executor, Reporter }

    struct AgentRecord {
        address inftAddress;
        uint256 tokenId;
        AgentType agentType;
        uint256 executionCount;
        uint256 successCount;
        uint256 reputationBps;  // 0–10000 bps = 0–100%
        bool    isRegistered;
    }

    mapping(address => AgentRecord) public agents;
    mapping(address => bool) public authorizedRiskAgents;

    event AgentRegistered(address indexed agentWallet, AgentType agentType, uint256 tokenId);
    event ExecutionRecorded(address indexed agentWallet, bool success, uint256 newReputation);

    constructor() Ownable(msg.sender) {}

    function authorizeRiskAgent(address agentWallet, bool status) external onlyOwner {
        authorizedRiskAgents[agentWallet] = status;
    }

    function registerAgent(
        address agentWallet,
        address inftAddress,
        uint256 tokenId,
        AgentType agentType
    ) external onlyOwner {
        agents[agentWallet] = AgentRecord({
            inftAddress:    inftAddress,
            tokenId:        tokenId,
            agentType:      agentType,
            executionCount: 0,
            successCount:   0,
            reputationBps:  5000,  // start at 50%
            isRegistered:   true
        });
        if (agentType == AgentType.RiskGuard) {
            authorizedRiskAgents[agentWallet] = true;
        }
        emit AgentRegistered(agentWallet, agentType, tokenId);
    }

    /// @notice Called by Reporter Agent off-chain after swap receipt confirmed (Bug #5 fix)
    function recordExecution(address agentWallet, bool success) external onlyOwner {
        AgentRecord storage rec = agents[agentWallet];
        require(rec.isRegistered, "not registered");
        rec.executionCount++;
        if (success) {
            rec.successCount++;
            rec.reputationBps = _clamp(rec.reputationBps + 50, 0, 10000);
        } else {
            rec.reputationBps = _clamp(rec.reputationBps - 100, 0, 10000);
        }
        emit ExecutionRecorded(agentWallet, success, rec.reputationBps);
    }

    function isAuthorizedRiskAgent(address signer) external view returns (bool) {
        return authorizedRiskAgents[signer];
    }

    function _clamp(uint256 val, uint256 lo, uint256 hi) internal pure returns (uint256) {
        if (val < lo) return lo;
        if (val > hi) return hi;
        return val;
    }
}
