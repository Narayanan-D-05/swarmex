// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AgentNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    struct AgentMeta {
        bytes32 dataHash;      // keccak256 of persona JSON (content address)
        bytes32 storageRoot;   // 0G Storage merkle root (updated after each write)
    }

    mapping(uint256 => AgentMeta) public agentMeta;

    event StorageRootUpdated(uint256 indexed tokenId, bytes32 newRoot);

    constructor() ERC721("SwarmExAgentNFT", "SXNFT") Ownable(msg.sender) {}

    function safeMint(address to, bytes32 dataHash) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        agentMeta[tokenId] = AgentMeta({ dataHash: dataHash, storageRoot: bytes32(0) });
        return tokenId;
    }

    /// @notice Updated by agent runtime after each 0G Storage write
    function updateStorageRoot(uint256 tokenId, bytes32 newRoot) external onlyOwner {
        agentMeta[tokenId].storageRoot = newRoot;
        emit StorageRootUpdated(tokenId, newRoot);
    }
}
