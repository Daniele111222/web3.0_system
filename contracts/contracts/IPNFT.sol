// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IPNFT
 * @dev IP-NFT contract for enterprise intellectual property asset management
 * Implements ERC-721 with URI storage, enumeration, and ERC-2981 royalty standard
 * Includes Pausable for emergency stops, batch operations, and enhanced security
 */
contract IPNFT is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Enumerable, 
    ERC2981, 
    Ownable, 
    ReentrancyGuard,
    Pausable
{
    // Token ID counter
    uint256 private _nextTokenId;

    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed creator, address indexed owner, string metadataURI);
    event NFTBurned(uint256 indexed tokenId, address indexed owner);
    event NFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event NFTTransferredWithReason(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        address operator,
        string reason
    );
    event RoyaltySet(uint256 indexed tokenId, address receiver, uint96 feeNumerator);
    event MetadataUpdated(uint256 indexed tokenId, string newURI);
    event MetadataLocked(uint256 indexed tokenId, address indexed creator);
    event RoyaltyLocked(uint256 indexed tokenId, address indexed creator);

    // Mapping to track minting timestamps
    mapping(uint256 => uint256) public mintTimestamps;

    // Mapping to track original creators
    mapping(uint256 => address) public originalCreators;

    // Mapping to track locked metadata (cannot be changed once locked)
    mapping(uint256 => bool) public metadataLocked;

    // Mapping to track locked royalties (cannot be changed once locked)
    mapping(uint256 => bool) public royaltyLocked;

    // Mapping for transfer whitelist (if enabled)
    mapping(address => bool) public transferWhitelist;

    // Transfer restrictions
    bool public transferWhitelistEnabled;
    uint256 public transferLockTime; // Minimum time before token can be transferred after mint

    constructor() ERC721("IP-NFT", "IPNFT") Ownable(msg.sender) {
        _nextTokenId = 1;
        transferLockTime = 0;
        transferWhitelistEnabled = false;
    }

    /**
     * @dev Pause the contract - stops minting and transfers
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Set transfer lock time (minimum time before token can be transferred)
     * @param lockTime Time in seconds
     */
    function setTransferLockTime(uint256 lockTime) external onlyOwner {
        transferLockTime = lockTime;
    }

    /**
     * @dev Enable/disable transfer whitelist
     * @param enabled Whether to enable whitelist
     */
    function setTransferWhitelistEnabled(bool enabled) external onlyOwner {
        transferWhitelistEnabled = enabled;
    }

    /**
     * @dev Add/remove address from transfer whitelist
     * @param account Address to modify
     * @param allowed Whether address is allowed
     */
    function setTransferWhitelist(address account, bool allowed) external onlyOwner {
        transferWhitelist[account] = allowed;
    }

    /**
     * @dev Mint a new IP-NFT
     * @param to Address to mint the NFT to
     * @param metadataURI IPFS URI pointing to the metadata JSON
     * @return tokenId The ID of the newly minted token
     */
    function mint(address to, string memory metadataURI) 
        external 
        whenNotPaused
        nonReentrant 
        returns (uint256) 
    {
        require(to != address(0), "IPNFT: mint to zero address");
        require(bytes(metadataURI).length > 0, "IPNFT: empty metadata URI");

        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        mintTimestamps[tokenId] = block.timestamp;
        // Record the caller (creator), not the receiver
        originalCreators[tokenId] = msg.sender;

        emit NFTMinted(tokenId, msg.sender, to, metadataURI);
        
        return tokenId;
    }

    /**
     * @dev Mint with royalty information
     * @param to Address to mint the NFT to
     * @param metadataURI IPFS URI pointing to the metadata JSON
     * @param royaltyReceiver Address to receive royalties
     * @param royaltyFeeNumerator Royalty fee in basis points (e.g., 500 = 5%)
     * @return tokenId The ID of the newly minted token
     */
    function mintWithRoyalty(
        address to, 
        string memory metadataURI,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) 
        external 
        whenNotPaused
        nonReentrant 
        returns (uint256) 
    {
        require(to != address(0), "IPNFT: mint to zero address");
        require(bytes(metadataURI).length > 0, "IPNFT: empty metadata URI");
        // Check royaltyReceiver is not zero address
        require(royaltyReceiver != address(0), "IPNFT: royalty receiver is zero address");
        require(royaltyFeeNumerator <= 1000, "IPNFT: royalty too high"); // Max 10%

        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _setTokenRoyalty(tokenId, royaltyReceiver, royaltyFeeNumerator);
        
        mintTimestamps[tokenId] = block.timestamp;
        // Record the caller (creator), not the receiver
        originalCreators[tokenId] = msg.sender;

        emit NFTMinted(tokenId, msg.sender, to, metadataURI);
        emit RoyaltySet(tokenId, royaltyReceiver, royaltyFeeNumerator);
        
        return tokenId;
    }

    /**
     * @dev Batch mint multiple IP-NFTs
     * @param to Address to mint the NFTs to
     * @param metadataURIs Array of IPFS URIs pointing to metadata JSON files
     * @return tokenIds Array of newly minted token IDs
     */
    function batchMint(address to, string[] memory metadataURIs) 
        external 
        whenNotPaused
        nonReentrant 
        returns (uint256[] memory tokenIds) 
    {
        require(to != address(0), "IPNFT: mint to zero address");
        require(metadataURIs.length > 0, "IPNFT: empty metadata URIs");
        require(metadataURIs.length <= 50, "IPNFT: batch too large"); // Limit to 50 to prevent gas limit issues

        tokenIds = new uint256[](metadataURIs.length);

        for (uint256 i = 0; i < metadataURIs.length; i++) {
            require(bytes(metadataURIs[i]).length > 0, "IPNFT: empty metadata URI in batch");
            
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, metadataURIs[i]);
            
            mintTimestamps[tokenId] = block.timestamp;
            originalCreators[tokenId] = msg.sender;

            emit NFTMinted(tokenId, msg.sender, to, metadataURIs[i]);
        }

        return tokenIds;
    }

    /**
     * @dev Transfer NFT with an optional reason string for audit trail
     * @param from Current owner address
     * @param to Recipient address
     * @param tokenId Token ID to transfer
     * @param reason Human-readable reason for the transfer (stored in event log)
     */
    function transferNFT(
        address from,
        address to,
        uint256 tokenId,
        string calldata reason
    ) external nonReentrant whenNotPaused {
        require(from != address(0), "IPNFT: transfer from zero address");
        require(to != address(0), "IPNFT: transfer to zero address");
        require(
            _isAuthorized(_ownerOf(tokenId), msg.sender, tokenId),
            "IPNFT: caller is not owner nor approved"
        );

        _transfer(from, to, tokenId);

        emit NFTTransferredWithReason(tokenId, from, to, msg.sender, reason);
    }

    /**
     * @dev Get all token IDs owned by an address (uses ERC721Enumerable)
     * @param owner Address to query
     * @return Array of token IDs
     */
    function getOwnerTokenIds(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokenIds;
    }

    /**
     * @dev Burn (destroy) a token
     * @param tokenId Token ID to burn
     */
    function burn(uint256 tokenId) external {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "IPNFT: not authorized");
        
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        
        // Clean up mappings
        delete mintTimestamps[tokenId];
        delete originalCreators[tokenId];
        delete metadataLocked[tokenId];
        delete royaltyLocked[tokenId];
        
        emit NFTBurned(tokenId, owner);
    }

    /**
     * @dev Set royalty for a specific token (only owner or approved, and only if not locked)
     * @param tokenId Token ID to set royalty for
     * @param receiver Address to receive royalties
     * @param feeNumerator Royalty fee in basis points
     */
    function setTokenRoyalty(
        uint256 tokenId, 
        address receiver, 
        uint96 feeNumerator
    ) external {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "IPNFT: not authorized");
        require(!royaltyLocked[tokenId], "IPNFT: royalty is locked");
        // Check receiver is not zero address
        require(receiver != address(0), "IPNFT: royalty receiver is zero address");
        require(feeNumerator <= 1000, "IPNFT: royalty too high");
        
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
        emit RoyaltySet(tokenId, receiver, feeNumerator);
    }

    /**
     * @dev Lock royalty for a specific token (permanent, cannot be unlocked)
     * @param tokenId Token ID to lock royalty for
     */
    function lockRoyalty(uint256 tokenId) external {
        require(msg.sender == originalCreators[tokenId], "IPNFT: only creator can lock");
        require(!royaltyLocked[tokenId], "IPNFT: royalty already locked");
        
        royaltyLocked[tokenId] = true;
        emit RoyaltyLocked(tokenId, msg.sender);
    }

    /**
     * @dev Update metadata URI (only owner or approved, and only if not locked)
     * @param tokenId Token ID to update
     * @param newURI New metadata URI
     */
    function updateTokenURI(uint256 tokenId, string memory newURI) external {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "IPNFT: not authorized");
        require(!metadataLocked[tokenId], "IPNFT: metadata is locked");
        require(bytes(newURI).length > 0, "IPNFT: empty URI");
        
        _setTokenURI(tokenId, newURI);
        emit MetadataUpdated(tokenId, newURI);
    }

    /**
     * @dev Lock metadata for a specific token (permanent, cannot be unlocked)
     * @param tokenId Token ID to lock metadata for
     */
    function lockMetadata(uint256 tokenId) external {
        require(msg.sender == originalCreators[tokenId], "IPNFT: only creator can lock");
        require(!metadataLocked[tokenId], "IPNFT: metadata already locked");
        
        metadataLocked[tokenId] = true;
        emit MetadataLocked(tokenId, msg.sender);
    }

    /**
     * @dev Get the original creator of a token
     * @param tokenId Token ID to query
     * @return Address of the original creator
     */
    function getOriginalCreator(uint256 tokenId) external view returns (address) {
        require(_ownerOf(tokenId) != address(0), "IPNFT: token does not exist");
        return originalCreators[tokenId];
    }

    /**
     * @dev Get the mint timestamp of a token
     * @param tokenId Token ID to query
     * @return Timestamp when the token was minted
     */
    function getMintTimestamp(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "IPNFT: token does not exist");
        return mintTimestamps[tokenId];
    }

    /**
     * @dev Get the current token ID counter
     * @return The next token ID that will be minted
     */
    function getNextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Check if metadata is locked for a token
     * @param tokenId Token ID to check
     * @return True if metadata is locked
     */
    function isMetadataLocked(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "IPNFT: token does not exist");
        return metadataLocked[tokenId];
    }

    /**
     * @dev Check if royalty is locked for a token
     * @param tokenId Token ID to check
     * @return True if royalty is locked
     */
    function isRoyaltyLocked(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "IPNFT: token does not exist");
        return royaltyLocked[tokenId];
    }

    // Override functions required by Solidity

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        // Get the from address BEFORE calling super._update to ensure we capture the original owner
        address from = _ownerOf(tokenId);
        
        // P0 FIX: Enforce transfer restrictions (time lock and whitelist)
        // Only check for actual transfers (not mints or burns)
        if (from != address(0) && to != address(0)) {
            require(
                block.timestamp >= mintTimestamps[tokenId] + transferLockTime,
                "IPNFT: transfer lock time not expired"
            );
            // P0 FIX: Check whitelist on the recipient (to), not the owner
            if (transferWhitelistEnabled) {
                require(transferWhitelist[to], "IPNFT: recipient not whitelisted");
            }
        }
        
        // Call parent update
        address result = super._update(to, tokenId, auth);
        
        // Emit transfer event only for actual transfers (not mints or burns)
        if (from != address(0) && to != address(0) && from != to) {
            emit NFTTransferred(tokenId, from, to);
        }
        
        return result;
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
