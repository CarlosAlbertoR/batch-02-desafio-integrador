var { expect } = require("chai");
var { ethers } = require("hardhat");

const { getRole, deploySC } = require("../utils");

const MINTER_ROLE = getRole("MINTER_ROLE");
const PAUSER_ROLE = getRole("PAUSER_ROLE");
const UPGRADER_ROLE = getRole("UPGRADER_ROLE");

describe("BBitesToken", () => {
  let owner;
  let minter;
  let user;
  let contract;

  beforeEach(async () => {
    [owner, minter, user] = await ethers.getSigners();
    contract = await deploySC("BBitesToken", [minter.address]);
  });

  describe("Initial conditions", () => {
    it("Should have the correct name, symbol and Roles", async () => {
      const expectedNameToken = "BBites Token";
      const expectedSymbolToken = "BBTKN";

      expect(await contract.name()).to.be.equal(expectedNameToken);
      expect(await contract.symbol()).to.be.equal(expectedSymbolToken);
      expect(await contract.hasRole(MINTER_ROLE, minter.address)).to.be.true;
      expect(await contract.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await contract.hasRole(UPGRADER_ROLE, owner.address)).to.be.true;
    });

    it("Should have the correct decimals value", async () => {
      const decimals = await contract.decimals();
      expect(decimals).to.equal(18);
    });

    it("Should return the correct total supply", async () => {
      const totalSupply = await contract.totalSupply();
      const expectedTotalSupply =
        BigInt("1000000") * BigInt("10") ** BigInt("18");

      expect(totalSupply.toString()).to.equal(expectedTotalSupply.toString());
    });
  });

  describe("Mint", () => {
    it("Should allow the minter to mint tokens when not paused", async () => {
      const amountToMint = 1000;
      await contract.connect(minter).mint(user.address, amountToMint);
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

    it("Should not allow minting when the contract is paused", async () => {
      await contract.connect(owner).pause();

      const amountToMint = 1000;
      await expect(
        contract.connect(minter).mint(user.address, amountToMint)
      ).to.be.revertedWith("Pausable: paused");
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

  describe("Additional functions", () => {
    it("Should call _beforeTokenTransfer when transferring tokens", async () => {
      const to = user.address;
      const amount = 100;

      const expectedTotalSupply =
        BigInt("1000000") * BigInt("10") ** BigInt("18");

      const balanceBefore = await contract.balanceOf(to);
      await contract.transfer(to, amount);

      const balanceAfter = await contract.balanceOf(to);
      const actualTotalSupply = await contract.totalSupply();

      // Compara las cantidades como cadenas
      expect(balanceAfter.toString()).to.equal(
        (balanceBefore + BigInt(amount)).toString()
      );
      expect(actualTotalSupply.toString()).to.equal(
        expectedTotalSupply.toString()
      );
    });
  });
});
