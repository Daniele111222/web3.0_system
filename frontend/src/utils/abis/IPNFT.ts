export const IPNFT_ABI = [
  // ERC721 标准方法
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',

  // IPNFT 自定义方法
  'function mint(address to, string metadataURI) returns (uint256)',
  'function mintWithRoyalty(address to, string metadataURI, address royaltyReceiver, uint96 royaltyFeeNumerator) returns (uint256)',
  'function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator)',
  'function updateTokenURI(uint256 tokenId, string newURI)',
  'function getOriginalCreator(uint256 tokenId) view returns (address)',
  'function getMintTimestamp(uint256 tokenId) view returns (uint256)',
  'function getNextTokenId() view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function mintTimestamps(uint256) view returns (uint256)',
  'function originalCreators(uint256) view returns (address)',

  // 事件
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
  'event NFTMinted(uint256 indexed tokenId, address indexed owner, string metadataURI)',
  'event NFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to)',
  'event RoyaltySet(uint256 indexed tokenId, address receiver, uint96 feeNumerator)',
  'event MetadataUpdated(uint256 indexed tokenId, string newURI)',
];
