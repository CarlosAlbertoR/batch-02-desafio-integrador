var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
var { ethers, upgrades, network } = require("hardhat");
var { time } = require("@nomicfoundation/hardhat-network-helpers");

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

describe("PublicSale", function () {
  let owner;
  let minter;
  let user;
  let contract;
  let walletSigners;
});
