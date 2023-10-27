import { Contract, ethers } from "ethers";

import usdcTknAbi from "../artifacts/contracts/USDCoin.sol/USDCoin.json";
import bbitesTokenAbi from "../artifacts/contracts/BBitesToken.sol/BBitesToken.json";
import publicSaleAbi from "../artifacts/contracts/PublicSale.sol/PublicSale.json";
import nftTknAbi from "../artifacts/contracts/CuyCollectionNft.sol/CuyCollectionNft.json";

// SUGERENCIA: vuelve a armar el MerkleTree en frontend
// Utiliza la libreria buffer
import buffer from "buffer/";
import walletAndIds from "../wallets/walletList";
import { MerkleTree } from "merkletreejs";

var Buffer = buffer.Buffer;
let merkleTree;

function hashToken(tokenId, account) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
      .slice(2),
    "hex"
  );
}

function buildMerkleTree() {
  const hashedData = walletAndIds.map(({ id, address }) =>
    hashToken(id, address)
  );
  merkleTree = new MerkleTree(hashedData, ethers.keccak256, {
    sortPairs: true,
  });
}

var provider, signer, account;
var usdcTkContract, bbitesTknContract, pubSContract, nftContract;
var usdcAddress, bbitesTknAdd, pubSContractAdd;

function initSCsGoerli() {
  provider = new ethers.BrowserProvider(window.ethereum);

  usdcAddress = "0xF36280fF71df4e96F19ef9317e6B45B058915531";
  bbitesTknAdd = "0x827800444B3D5536633FBB305710F4cC80C173b0";
  pubSContractAdd = "0x0836b48784a339BB845A419147959A2b09EF8D3a";

  usdcTkContract = new Contract(usdcAddress, usdcTknAbi.abi, provider);
  bbitesTknContract = new Contract(bbitesTknAdd, bbitesTokenAbi.abi, provider);
  pubSContract = new Contract(pubSContractAdd, publicSaleAbi.abi, provider);
}

function initSCsMumbai() {
  provider = new ethers.BrowserProvider(window.ethereum);
  var nftAddress = "0x3C8f33556346b99cC876D185BdF18B10f69C2E8A";
  nftContract = new Contract(nftAddress, nftTknAbi.abi, provider);
}

function setUpListeners() {
  // Connect to Metamask
  var bttn = document.getElementById("connect");
  var walletIdEl = document.getElementById("walletId");

  bttn.addEventListener("click", async function () {
    if (window.ethereum) {
      [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Billetera metamask", account);
      walletIdEl.innerHTML = account;

      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner(account);
    }
  });

  // USDC Balance - balanceOf
  var updateUSDCBalanceBtn = document.getElementById("usdcUpdate");
  updateUSDCBalanceBtn.addEventListener("click", async function () {
    const balanceUSC = await usdcTkContract.balanceOf(account);
    let balanceUSDCEl = document.getElementById("usdcBalance");
    balanceUSDCEl.innerHTML = ethers.formatUnits(balanceUSC, 6);
  });

  // Bbites token Balance - balanceOf
  var updateBBTKNBalanceBtn = document.getElementById("bbitesTknUpdate");
  updateBBTKNBalanceBtn.addEventListener("click", async function () {
    const balanceBBTKN = await bbitesTknContract.balanceOf(account);
    let balanceBBTKNEl = document.getElementById("bbitesTknBalance");
    balanceBBTKNEl.innerHTML = ethers.formatUnits(balanceBBTKN, 18);
  });

  // APPROVE BBTKN
  // bbitesTknContract.approve
  var bttn = document.getElementById("approveButtonBBTkn");

  // APPROVE USDC
  // usdcTkContract.approve
  var bttn = document.getElementById("approveButtonUSDC");

  // purchaseWithTokens
  var bttn = document.getElementById("purchaseButton");

  // purchaseWithUSDC
  var bttn = document.getElementById("purchaseButtonUSDC");

  // purchaseWithEtherAndId
  var bttn = document.getElementById("purchaseButtonEtherId");

  // send Ether
  var bttn = document.getElementById("sendEtherButton");

  // getPriceForId
  var bttn = document.getElementById("getPriceNftByIdBttn");

  // getProofs
  var bttn = document.getElementById("getProofsButtonId");
  bttn.addEventListener("click", async () => {
    var id;
    var address;
    var proofs = merkleTree.getHexProof(hashToken(id, address));
    navigator.clipboard.writeText(JSON.stringify(proofs));
  });

  // safeMintWhiteList
  var bttn = document.getElementById("safeMintWhiteListBttnId");
  // usar ethers.hexlify porque es un array de bytes
  // var proofs = document.getElementById("whiteListToInputProofsId").value;
  // proofs = JSON.parse(proofs).map(ethers.hexlify);

  // buyBack
  var bttn = document.getElementById("buyBackBttn");
}

function setUpEventsContracts() {
  var pubSList = document.getElementById("pubSList");
  // pubSContract - "PurchaseNftWithId"

  var bbitesListEl = document.getElementById("bbitesTList");
  // bbitesCListener - "Transfer"

  var nftList = document.getElementById("nftList");
  // nftCListener - "Transfer"

  var burnList = document.getElementById("burnList");
  // nftCListener - "Burn"
}

async function setUp() {
  window.ethereum.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  initSCsGoerli();
  initSCsMumbai();

  setUpListeners();
  // setUpEventsContracts

  buildMerkleTree();
}

setUp()
  .then()
  .catch((e) => console.log(e));
