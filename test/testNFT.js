const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const { getRole, deploySC } = require("../utils");
const {
  getRootFromMTForTest,
  getMerkleProofs,
} = require("../utils/merkleTree");
const walletList = require("../wallets/walletList");

const MINTER_ROLE = getRole("MINTER_ROLE");
const PAUSER_ROLE = getRole("PAUSER_ROLE");
const UPGRADER_ROLE = getRole("UPGRADER_ROLE");

describe("CuyCollectionNft", () => {
  let owner;
  let minter;
  let user;
  let contract;
  let walletSigners;

  beforeEach(async () => {
    [owner, minter, user] = await ethers.getSigners();

    contract = await deploySC("CuyCollectionNft", [
      "CuyCollection",
      "CUY",
      minter.address,
    ]);

    const listForTests = walletList.slice(0, 5);
    const ONE_ETHER = `0x${ethers.parseEther("1").toString(16)}`;
    walletSigners = listForTests.map(async ({ address, privateKey }) => {
      await network.provider.send("hardhat_setBalance", [address, ONE_ETHER]);
      return new ethers.Wallet(privateKey, ethers.provider);
    });

    const root = getRootFromMTForTest(listForTests);
    await contract.connect(owner).updateRoot(root);
  });

  describe("Initial conditions", () => {
    it("Should have the correct name, symbol and Roles", async () => {
      const expectedNameToken = "CuyCollection";
      const expectedSymbolToken = "CUY";

      expect(await contract.name()).to.be.equal(expectedNameToken);
      expect(await contract.symbol()).to.be.equal(expectedSymbolToken);
      expect(await contract.hasRole(MINTER_ROLE, minter.address)).to.be.true;
      expect(await contract.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await contract.hasRole(UPGRADER_ROLE, owner.address)).to.be.true;
    });

    it("Should return the correct base URI for a token", async () => {
      for (let i = 0; i < 5; i++) {
        const tokenIdToCheck = i + 100;
        await contract.connect(minter).safeMint(user.address, tokenIdToCheck);
        const baseURI = await contract.tokenURI(tokenIdToCheck);
        const expectedBaseURI = `ipfs://QmaGQooCF9jFDJ9XHUNvxK837JWaS1x7unxEQKba1mXntP/${tokenIdToCheck}`;
        expect(baseURI).to.equal(expectedBaseURI);
      }
    });
  });

  describe("Safe Mint", () => {
    it("Should allow minting tokens by a minter", async () => {
      await contract.connect(minter).safeMint(user.address, 0);
      const ownerOfToken = await contract.ownerOf(0);
      expect(ownerOfToken).to.equal(user.address);

      await expect(
        contract.connect(user).safeMint(user.address, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("Should not allow minting tokens outside the minting range", async () => {
      await expect(
        contract.connect(minter).safeMint(user.address, 10000)
      ).to.be.revertedWith("El tokenId debe estar en el rango de 0 a 999.");
    });

    it("Should not allow minting an already minted token", async () => {
      await contract.connect(minter).safeMint(user.address, 1);
      await expect(
        contract.connect(minter).safeMint(user.address, 1)
      ).to.be.revertedWith("Token previamente minteado. Elige otro tokenId.");
    });

    it("Should not allow minting when the contract is paused", async () => {
      await contract.connect(owner).pause();
      expect(await contract.paused()).to.be.true;
      let tokenId = 10;
      await expect(
        contract.connect(minter).safeMint(user.address, tokenId)
      ).to.be.revertedWith("Pausable: paused");

      tokenId = 1000;
      const wallet = await walletSigners[0];
      const merkleProof = getMerkleProofs(tokenId, wallet.address);
      await expect(
        contract
          .connect(wallet)
          .safeMintWhiteList(wallet.address, tokenId, merkleProof)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Minting with whitelist", () => {
    it("Should allow minting tokens within the whitelist range using a merkle proof", async () => {
      for (let index = 0; index < walletSigners.length; index++) {
        const wallet = await walletSigners[index];
        const tokenId = index + 1000;
        const merkleProof = getMerkleProofs(tokenId, wallet.address);

        await contract
          .connect(wallet)
          .safeMintWhiteList(wallet.address, tokenId, merkleProof);
        const ownerOfToken = await contract.ownerOf(tokenId);
        expect(ownerOfToken).to.equal(wallet.address);
      }
    });

    it("Should revert if the recipient is not the same as the caller", async () => {
      for (let index = 0; index < walletSigners.length; index++) {
        const wallet = await walletSigners[index];
        const tokenId = index + 1000;
        const invalidRecipient = user.address;
        const merkleProof = getMerkleProofs(tokenId, wallet.address);

        await expect(
          contract
            .connect(wallet)
            .safeMintWhiteList(invalidRecipient, tokenId, merkleProof)
        ).to.be.revertedWith(
          "El destinatario del token debe ser el mismo que el minteador."
        );
      }
    });

    it("Should not allow minting tokens outside the whitelist range", async () => {
      let tokenId = 999;
      let merkleProof = getMerkleProofs(tokenId, owner.address);
      await expect(
        contract.safeMintWhiteList(owner.address, tokenId, merkleProof)
      ).to.be.revertedWith(
        "Intentas mintear un NFT que no es elegible en la lista blanca."
      );

      tokenId = 1999;
      merkleProof = getMerkleProofs(tokenId, owner.address);
      await expect(
        contract.safeMintWhiteList(owner.address, tokenId, merkleProof)
      ).to.be.revertedWith(
        "Este tokenId y/o destinatario no pertenece a la lista blanca."
      );
    });

    it("Should not allow minting an already minted token using safeMintWhiteList", async () => {
      for (let index = 0; index < walletSigners.length; index++) {
        const wallet = await walletSigners[index];
        const tokenId = index + 1000;
        const merkleProof = getMerkleProofs(tokenId, wallet.address);

        await contract
          .connect(wallet)
          .safeMintWhiteList(wallet.address, tokenId, merkleProof);
        await expect(
          contract
            .connect(wallet)
            .safeMintWhiteList(wallet.address, tokenId, merkleProof)
        ).to.be.revertedWith("Token previamente minteado. Elige otro tokenId.");
      }
    });
  });

  describe("Burn NFT and buy back", () => {
    it("Should allow the owner to buy back a valid NFT and emit the Burn event", async () => {
      for (let index = 0; index < walletSigners.length; index++) {
        const wallet = await walletSigners[index];
        const tokenId = index + 1000;
        const merkleProof = getMerkleProofs(tokenId, wallet.address);

        await contract
          .connect(wallet)
          .safeMintWhiteList(wallet.address, tokenId, merkleProof);
        expect(await contract.balanceOf(wallet)).to.equal(1);

        expect(await contract.connect(wallet).buyBack(tokenId))
          .to.emit(contract, "Burn")
          .withArgs(wallet, tokenId);
        expect(await contract.balanceOf(wallet)).to.equal(0);
      }
    });

    it("Should revert if the user tries to buy back an invalid NFT", async () => {
      const invalidNFTId = 999; // NFT fuera del rango permitido
      await contract.connect(minter).safeMint(user.address, invalidNFTId);

      const wallet = await walletSigners[0];
      const tokenId = 1000;
      const merkleProof = getMerkleProofs(tokenId, wallet.address);
      await contract
        .connect(wallet)
        .safeMintWhiteList(wallet.address, tokenId, merkleProof);

      // User intenta comprar de vuelta un NFT que no le pertenece
      await expect(contract.connect(user).buyBack(tokenId)).to.be.revertedWith(
        "Este NFT no te pertenece."
      );

      // User intenta comprar de vuelta un NFT fuera del rango
      await expect(
        contract.connect(user).buyBack(invalidNFTId)
      ).to.be.revertedWith("El tokenId debe estar en el rango de 1000 a 1999.");
    });
  });

  describe("Pause and unpause", () => {
    it("Should allow the owner to pause and unpause the contract", async () => {
      // Pausar el contrato
      await expect(contract.connect(owner).pause())
        .to.emit(contract, "Paused")
        .withArgs(owner.address);
      expect(await contract.paused()).to.be.true;

      // Reanudar el contrato
      await expect(contract.connect(owner).unpause())
        .to.emit(contract, "Unpaused")
        .withArgs(owner.address);

      expect(await contract.paused()).to.be.false;
    });

    it("Should not allow pausing or unpausing the contract by a non-owner", async () => {
      await expect(contract.connect(user).pause()).to.be.revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${PAUSER_ROLE}`
      );

      await expect(contract.connect(user).unpause()).to.be.revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${PAUSER_ROLE}`
      );
    });
  });
});
