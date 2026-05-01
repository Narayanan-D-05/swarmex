pragma solidity 0.8.26;
interface IAgentRegistry {
    function isAuthorizedRiskAgent(address signer) external view returns (bool);
}
