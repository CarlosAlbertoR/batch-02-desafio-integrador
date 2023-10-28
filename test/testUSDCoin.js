var { expect } = require("chai");
var { ethers } = require("hardhat");

const { getRole, deploySCNoUp } = require("../utils");
const MINTER_ROLE = getRole("MINTER_ROLE");

describe("USDCoin", () => {
  let owner;
  let minter;
  let user;
  let contract;

  beforeEach(async () => {
    [owner, minter, user] = await ethers.getSigners();
    contract = await deploySCNoUp("USDCoin");
  });

  describe("Initial conditions", () => {
    it("Should have the correct name, symbol and Roles", async () => {
      const name = await contract.name();
      const symbol = await contract.symbol();

      expect(name).to.equal("USD Coin");
      expect(symbol).to.equal("USDC");
      expect(await contract.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });

    it("Should return the correct decimals value", async () => {
      const decimals = await contract.decimals();
      expect(decimals).to.equal(6);
    });
  });

  describe("Mint", () => {
    it("Should allow the minter to mint tokens", async () => {
      const amountToMint = 1000;
      await contract.connect(owner).mint(user.address, amountToMint);
      const userBalance = await contract.balanceOf(user.address);

      expect(userBalance).to.equal(amountToMint);
    });

    it("Should not allow non-minters to mint tokens", async () => {
      const amountToMint = 1000;
      await expect(
        contract.connect(user).mint(owner.address, amountToMint)
      ).to.be.revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });
  });
});
