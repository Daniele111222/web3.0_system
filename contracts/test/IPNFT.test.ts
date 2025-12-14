import { expect } from "chai";
import { ethers } from "hardhat";
import { IPNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("IPNFT", function () {
  let ipnft: IPNFT;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const SAMPLE_URI = "ipfs://QmTest123456789";
  const SAMPLE_URI_2 = "ipfs://QmTest987654321";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const IPNFT = await ethers.getContractFactory("IPNFT");
    ipnft = await IPNFT.deploy();
    await ipnft.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await ipnft.name()).to.equal("IP-NFT");
      expect(await ipnft.symbol()).to.equal("IPNFT");
    });

    it("Should set the deployer as owner", async function () {
      expect(await ipnft.owner()).to.equal(owner.address);
    });

    it("Should start with token ID 1", async function () {
      expect(await ipnft.getNextTokenId()).to.equal(1);
    });
  });

  describe("Minting", function () {
    it("Should mint a new NFT", async function () {
      await expect(ipnft.mint(user1.address, SAMPLE_URI))
        .to.emit(ipnft, "NFTMinted")
        .withArgs(1, user1.address, SAMPLE_URI);

      expect(await ipnft.ownerOf(1)).to.equal(user1.address);
      expect(await ipnft.tokenURI(1)).to.equal(SAMPLE_URI);
    });

    it("Should increment token ID after minting", async function () {
      await ipnft.mint(user1.address, SAMPLE_URI);
      expect(await ipnft.getNextTokenId()).to.equal(2);

      await ipnft.mint(user2.address, SAMPLE_URI_2);
      expect(await ipnft.getNextTokenId()).to.equal(3);
    });

    it("Should record original creator", async function () {
      await ipnft.mint(user1.address, SAMPLE_URI);
      expect(await ipnft.getOriginalCreator(1)).to.equal(user1.address);
    });

    it("Should record mint timestamp", async function () {
      await ipnft.mint(user1.address, SAMPLE_URI);
      const timestamp = await ipnft.getMintTimestamp(1);
      expect(timestamp).to.be.gt(0);
    });

    it("Should revert when minting to zero address", async function () {
      await expect(
        ipnft.mint(ethers.ZeroAddress, SAMPLE_URI)
      ).to.be.revertedWith("IPNFT: mint to zero address");
    });

    it("Should revert when minting with empty URI", async function () {
      await expect(
        ipnft.mint(user1.address, "")
      ).to.be.revertedWith("IPNFT: empty metadata URI");
    });
  });

  describe("Minting with Royalty", function () {
    it("Should mint with royalty information", async function () {
      const royaltyFee = 500; // 5%
      
      await expect(ipnft.mintWithRoyalty(user1.address, SAMPLE_URI, user1.address, royaltyFee))
        .to.emit(ipnft, "NFTMinted")
        .to.emit(ipnft, "RoyaltySet");

      const [receiver, amount] = await ipnft.royaltyInfo(1, 10000);
      expect(receiver).to.equal(user1.address);
      expect(amount).to.equal(500); // 5% of 10000
    });

    it("Should revert when royalty is too high", async function () {
      await expect(
        ipnft.mintWithRoyalty(user1.address, SAMPLE_URI, user1.address, 1001)
      ).to.be.revertedWith("IPNFT: royalty too high");
    });
  });

  describe("Transfer", function () {
    beforeEach(async function () {
      await ipnft.mint(user1.address, SAMPLE_URI);
    });

    it("Should transfer NFT and emit event", async function () {
      await expect(
        ipnft.connect(user1).transferFrom(user1.address, user2.address, 1)
      )
        .to.emit(ipnft, "NFTTransferred")
        .withArgs(1, user1.address, user2.address);

      expect(await ipnft.ownerOf(1)).to.equal(user2.address);
    });

    it("Should preserve original creator after transfer", async function () {
      await ipnft.connect(user1).transferFrom(user1.address, user2.address, 1);
      expect(await ipnft.getOriginalCreator(1)).to.equal(user1.address);
    });

    it("Should revert when non-owner tries to transfer", async function () {
      await expect(
        ipnft.connect(user2).transferFrom(user1.address, user2.address, 1)
      ).to.be.reverted;
    });
  });

  describe("Token URI", function () {
    beforeEach(async function () {
      await ipnft.mint(user1.address, SAMPLE_URI);
    });

    it("Should return correct token URI", async function () {
      expect(await ipnft.tokenURI(1)).to.equal(SAMPLE_URI);
    });

    it("Should allow owner to update token URI", async function () {
      await expect(ipnft.connect(user1).updateTokenURI(1, SAMPLE_URI_2))
        .to.emit(ipnft, "MetadataUpdated")
        .withArgs(1, SAMPLE_URI_2);

      expect(await ipnft.tokenURI(1)).to.equal(SAMPLE_URI_2);
    });

    it("Should revert when non-owner tries to update URI", async function () {
      await expect(
        ipnft.connect(user2).updateTokenURI(1, SAMPLE_URI_2)
      ).to.be.revertedWith("IPNFT: not authorized");
    });
  });

  describe("Royalty", function () {
    beforeEach(async function () {
      await ipnft.mint(user1.address, SAMPLE_URI);
    });

    it("Should allow owner to set royalty", async function () {
      await expect(ipnft.connect(user1).setTokenRoyalty(1, user1.address, 500))
        .to.emit(ipnft, "RoyaltySet")
        .withArgs(1, user1.address, 500);

      const [receiver, amount] = await ipnft.royaltyInfo(1, 10000);
      expect(receiver).to.equal(user1.address);
      expect(amount).to.equal(500);
    });

    it("Should revert when non-owner tries to set royalty", async function () {
      await expect(
        ipnft.connect(user2).setTokenRoyalty(1, user2.address, 500)
      ).to.be.revertedWith("IPNFT: not authorized");
    });
  });

  describe("Enumeration", function () {
    beforeEach(async function () {
      await ipnft.mint(user1.address, SAMPLE_URI);
      await ipnft.mint(user1.address, SAMPLE_URI_2);
      await ipnft.mint(user2.address, SAMPLE_URI);
    });

    it("Should return correct total supply", async function () {
      expect(await ipnft.totalSupply()).to.equal(3);
    });

    it("Should return correct balance", async function () {
      expect(await ipnft.balanceOf(user1.address)).to.equal(2);
      expect(await ipnft.balanceOf(user2.address)).to.equal(1);
    });

    it("Should return token by index", async function () {
      expect(await ipnft.tokenByIndex(0)).to.equal(1);
      expect(await ipnft.tokenByIndex(1)).to.equal(2);
      expect(await ipnft.tokenByIndex(2)).to.equal(3);
    });

    it("Should return token of owner by index", async function () {
      expect(await ipnft.tokenOfOwnerByIndex(user1.address, 0)).to.equal(1);
      expect(await ipnft.tokenOfOwnerByIndex(user1.address, 1)).to.equal(2);
      expect(await ipnft.tokenOfOwnerByIndex(user2.address, 0)).to.equal(3);
    });
  });

  describe("Interface Support", function () {
    it("Should support ERC721 interface", async function () {
      expect(await ipnft.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("Should support ERC721Metadata interface", async function () {
      expect(await ipnft.supportsInterface("0x5b5e139f")).to.be.true;
    });

    it("Should support ERC721Enumerable interface", async function () {
      expect(await ipnft.supportsInterface("0x780e9d63")).to.be.true;
    });

    it("Should support ERC2981 interface", async function () {
      expect(await ipnft.supportsInterface("0x2a55205a")).to.be.true;
    });
  });
});
