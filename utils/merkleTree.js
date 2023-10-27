const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { ethers } = require("hardhat");
const walletAndIds = require("../wallets/walletList");

var merkleTree, root;
function hashToken(tokenId, account) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
      .slice(2),
    "hex"
  );
}

function getRootFromMT() {
  const hashedData = walletAndIds.map(({ id, address }) =>
    hashToken(id, address)
  );

  merkleTree = new MerkleTree(hashedData, keccak256, {
    sortPairs: true,
  });

  root = merkleTree.getHexRoot();

  return root;
}

function getRootFromMTForTest(arrData) {
  const hashedData = arrData.map(({ id, address }) => hashToken(id, address));

  merkleTree = new MerkleTree(hashedData, keccak256, {
    sortPairs: true,
  });

  root = merkleTree.getHexRoot();

  return root;
}

function getMerkleProofs(tokenId, address) {
  const hashedElement = hashToken(tokenId, address);
  const proofs = merkleTree.getHexProof(hashedElement);
  return proofs;
}

module.exports = { getRootFromMT, getMerkleProofs, getRootFromMTForTest };
