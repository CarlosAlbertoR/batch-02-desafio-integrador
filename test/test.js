const { deployMockContract } = require("@ethereum-waffle/mock-contract");
var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { time } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
var { ethers, upgrades, network } = require("hardhat");

import usdcTknAbi from "../artifacts/contracts/USDCoin.sol/USDCoin.json";
import bbitesTokenAbi from "../artifacts/contracts/BBitesToken.sol/BBitesToken.json";
const { getRole, deploySC, deploySCNoUp, ex, pEth } = require("../utils");
const {
  getRootFromMTForTest,
  getMerkleProofs,
} = require("../utils/merkleTree");
const walletList = require("../wallets/walletList");

const BURNER_ROLE = getRole("BURNER_ROLE");
const MINTER_ROLE = getRole("MINTER_ROLE");
const PAUSER_ROLE = getRole("PAUSER_ROLE");
const UPGRADER_ROLE = getRole("UPGRADER_ROLE");

// 00 horas del 30 de septiembre del 2023 GMT
var startDate = 1696032000;

describe("BBitesToken", () => {
  let owner;
  let minter;
  let user;
  let contract;
  let bbTokenMock; // Mock contract for BBToken
  let usdcTokenMock; // Mock contract for USDC
  let uniswapRouterMock; // Mock contract for Uniswap Router
  let walletSigners;

  beforeEach(async () => {
    [owner, minter, user] = await ethers.getSigners();

    // Deploy the mock contracts
    bbTokenMock = await deployMockContract(owner, bbitesTokenAbi);
    usdcTokenMock = await deployMockContract(owner, usdcTknAbi);
    uniswapRouterMock = await deployMockContract(
      owner,
      YOUR_UNISWAP_ROUTER_ABI
    );

    contract = await deploySC("PublicSale", []);
  });
});
