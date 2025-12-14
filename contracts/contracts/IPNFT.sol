// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IPNFT
 * @dev IP-NFT contract for enterprise intellectual property asset management
 * Implements ERC-721 with URI storage, enumeration, and ERC-2981 royalty standard
 */
contract IPNFT is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Enumerable, 
    ERC2981, 
    Ownable, 
    ReentrancyGuard 
{
    // Token ID counter
    uint256 private _nextTokenId;

    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed owner, string metadataURI);
    event NFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event RoyaltySet(uint256 indexed tokenId, address receiver, uint96 feeNumerator);
    event MetadataUpdated(uint256 indexed tokenId, string newURI);

    // Mapping to track minting timestamps
    mapping(uint256 => uint256) public mintTimestamps;

    // Mapping to track original creators
    mapping(uint256 => address) public originalCreators;

    constructor() ERC721("IP-NFT", "IPNFT") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    /**
     * @dev Mint a new IP-NFT
     * @param to Address to mint the NFT to
     * @param metadataURI IPFS URI pointing to the metadata JSON
     * @return tokenId The ID of the newly minted token
     */
    function mint(address to, string memory metadataURI) 
        external 
        nonReentrant 
        returns (uint256) 
    {
        require(to != address(0), "IPNFT: mint to zero address");
        require(bytes(metadataURI).length > 0, "IPNFT: empty metadata URI");

        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        mintTimestamps[tokenId] = block.timestamp;
        originalCreators[tokenId] = to;

        emit NFTMinted(tokenId, to, metadataURI);
        
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
        nonReentrant 
        returns (uint256) 
    {
        require(to != address(0), "IPNFT: mint to zero address");
        require(bytes(metadataURI).length > 0, "IPNFT: empty metadata URI");
        require(royaltyFeeNumerator <= 1000, "IPNFT: royalty too high"); // Max 10%

        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _setTokenRoyalty(tokenId, royaltyReceiver, royaltyFeeNumerator);
        
        mintTimestamps[tokenId] = block.timestamp;
        originalCreators[tokenId] = to;

        emit NFTMinted(tokenId, to, metadataURI);
        emit RoyaltySet(tokenId, royaltyReceiver, royaltyFeeNumerator);
        
        return tokenId;
    }

    /**
     * @dev Set royalty for a specific token (only owner or approved)
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
        require(feeNumerator <= 1000, "IPNFT: royalty too high");
        
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
        emit RoyaltySet(tokenId, receiver, feeNumerator);
    }

    /**
     * @dev Update metadata URI (only owner or approved)
     * @param tokenId Token ID to update
     * @param newURI New metadata URI
     */
    function updateTokenURI(uint256 tokenId, string memory newURI) external {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "IPNFT: not authorized");
        require(bytes(newURI).length > 0, "IPNFT: empty URI");
        
        _setTokenURI(tokenId, newURI);
        emit MetadataUpdated(tokenId, newURI);
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

    // Override functions required by Solidity

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        address result = super._update(to, tokenId, auth);
        
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
