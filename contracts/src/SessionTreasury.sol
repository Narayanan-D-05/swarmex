// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Per-session USDC escrow.
/// @dev USAGE: call usdc.approve(sessionTreasury, amount) BEFORE calling deposit().
contract SessionTreasury {
    using SafeERC20 for IERC20;

    // Base Sepolia USDC — verify current address at time of deployment
    IERC20 public immutable usdc;
    address public immutable orchestratorAgent;

    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Debited(address indexed agentWallet, uint256 amount, bytes32 indexed taskId);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address _usdc, address _orchestrator) {
        usdc = IERC20(_usdc);
        orchestratorAgent = _orchestrator;
    }

    /// @notice Step 1: call usdc.approve(address(this), amount) from frontend first (Bug #9 fix)
    function deposit(uint256 amount) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    /// @notice Called by orchestrator wallet for each inter-agent payment (Bug #10 note below)
    function debit(address agentWallet, uint256 amount, bytes32 taskId) external {
        require(msg.sender == orchestratorAgent, "not orchestrator");
        require(balances[msg.sender] >= amount, "insufficient balance");
        balances[msg.sender] -= amount;
        usdc.safeTransfer(agentWallet, amount);
        emit Debited(agentWallet, amount, taskId);
    }

    function withdraw() external {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "nothing to withdraw");
        balances[msg.sender] = 0;
        usdc.safeTransfer(msg.sender, bal);
        emit Withdrawn(msg.sender, bal);
    }
}
