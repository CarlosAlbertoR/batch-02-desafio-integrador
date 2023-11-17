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
  var approveButtonBBTkn = document.getElementById("approveButtonBBTkn");
  approveButtonBBTkn.addEventListener("click", async function () {
    try {
      document.getElementById("approveError").textContent = "";
      let approveInput = document.getElementById("approveInput").value;

      if (approveInput.value == 0)
        return (approveError.innerText = "Introduce un numero mayor que 0");

      approveInput = approveInput.trim() + "000000000000000000";
      const tx = await bbitesTknContract
        .connect(signer)
        .approve(pubSContractAdd, approveInput);
      const response = await tx.wait();
      const transactionHash = response.hash;
      console.log("Tx Hash de aprobacion de BBites: ", transactionHash);
      approveError.innerText = "";
      approveInput = "";
    } catch (error) {
      approveError.innerText = error.reason;
      console.error("Error al hacer el BBites Token approve:", error);
    }
  });

  // APPROVE USDC
  // usdcTkContract.approve
  var approveButtonUSDC = document.getElementById("approveButtonUSDC");
  approveButtonUSDC.addEventListener("click", async function () {
    try {
      document.getElementById("approveErrorUSDC").textContent = "";
      let approveInput = document.getElementById("approveInputUSDC").value;

      if (approveInput.value == 0)
        return (approveError.innerText = "Introduce un numero mayor que 0");

      approveInput = approveInput.trim() + "000000";
      const tx = await usdcTkContract
        .connect(signer)
        .approve(pubSContractAdd, approveInput);
      const response = await tx.wait();
      const transactionHash = response.hash;
      console.log("Tx Hash de aprobacion de USDC: ", transactionHash);
      approveErrorUSDC.innerHTML = "";
      approveInput = "";
    } catch (error) {
      approveErrorUSDC.innerText = error.reason;
      console.error("Error al hacer el USDC approve:", error);
    }
  });

  // purchaseWithTokens
  var purchaseWithTokensBttn = document.getElementById("purchaseButton");
  purchaseWithTokensBttn.addEventListener("click", async function () {
    try {
      document.getElementById("purchaseError").textContent = "";
      const purchaseInput = document.getElementById("purchaseInput").value;
      const tx = await pubSContract
        .connect(signer)
        .purchaseWithTokens(purchaseInput);
      const response = await tx.wait();
      const transactionHash = response.hash;
      console.log(
        "Tx Hash de compra de NFT con BBites Tokens:",
        transactionHash
      );
      purchaseInput = "";
      purchaseError.innerText = "";
    } catch (error) {
      purchaseError.innerText = error.reason;
    }
  });

  // purchaseWithUSDC
  var purchaseWithUSDCBttn = document.getElementById("purchaseButtonUSDC");
  purchaseWithUSDCBttn.addEventListener("click", async function () {
    try {
      purchaseErrorUSDC.textContent = "";
      const idInput = document.getElementById("purchaseInputUSDC").value;
      let amountIn = document.getElementById("amountInUSDCInput").value;
      amountIn = amountIn.trim() + "000000";
      console.log(idInput, amountIn);
      const tx = await pubSContract
        .connect(signer)
        .purchaseWithUSDC(idInput, amountIn);
      const response = await tx.wait();
      const transactionHash = response.hash;
      console.log("Tx Hash de compra de NFT con USDC Tokens:", transactionHash);
    } catch (error) {
      purchaseErrorUSDC.textContent = error.reason;
    }
  });

  // purchaseWithEtherAndId
  var purchaseWithEtherAndIdBttn = document.getElementById(
    "purchaseButtonEtherId"
  );
  purchaseWithEtherAndIdBttn.addEventListener("click", async function () {
    try {
      document.getElementById("purchaseEtherIdError").textContent = "";
      const idInput = document.getElementById("purchaseInputEtherId").value;

      var tx = await pubSContract
        .connect(signer)
        .purchaseWithEtherAndId(idInput, { value: ethers.parseEther("0.01") });
      var response = await tx.wait();
      const transactionHash = response.hash;
      console.log("Tx Hash de compra de NFT con Ether:", transactionHash);
    } catch (error) {
      purchaseEtherIdError.innerText = error.reason;
    }
  });

  // send Ether
  var sendEtherButton = document.getElementById("sendEtherButton");
  sendEtherButton.addEventListener("click", async function () {
    try {
      sendEtherError.innerText = "";
      const tx = await pubSContract.connect(signer).depositEthForARandomNft({
        value: ethers.parseEther("0.01"),
      });
      const response = await tx.wait();
      const transactionHash = response.hash;
      console.log("Tx Hash de compra de NFT con Ether:", transactionHash);
    } catch (error) {
      sendEtherError.innerText = error.reason;
    }
  });

  // getPriceForId
  var getPriceNftByIdBttn = document.getElementById("getPriceNftByIdBttn");
  getPriceNftByIdBttn.addEventListener("click", async function () {
    try {
      const tx = await pubSContract
        .connect(signer)
        .getPriceForId(priceNftIdInput.value);
      const NFTvalue = tx / BigInt(1 * 10 ** 18);
      priceNftByIdText.innerText = `El precio del NFT con ID ${priceNftIdInput.value} es de: ${NFTvalue}.0 BBTKN`;
      getPriceNftError.innerText = "";
    } catch (error) {
      getPriceNftError.innerText = error.reason;
      priceNftByIdText.innerText = "";
      console.log(
        "Ocurrio un error al obtener el precio del token:",
        error.message
      );
    }
  });

  // getProofs
  var getProofsBttn = document.getElementById("getProofsButtonId");
  getProofsBttn.addEventListener("click", async () => {
    const id = document.getElementById("inputIdProofId").value;
    const address = document.getElementById("inputAccountProofId").value;
    const proofs = merkleTree.getHexProof(hashToken(id, address));
    navigator.clipboard.writeText(JSON.stringify(proofs));
    showProofsTextId.innerText = proofs;
  });

  // safeMintWhiteList
  var safeMintWhiteListBttn = document.getElementById(
    "safeMintWhiteListBttnId"
  );
  safeMintWhiteListBttn.addEventListener("click", async function () {
    try {
      let proofs = document.getElementById("whiteListToInputProofsId").value;
      const to = document.getElementById("whiteListToInputId").value;
      const tokenId = document.getElementById("whiteListToInputTokenId").value;
      proofs = JSON.parse(proofs).map(ethers.hexlify);

      const tx = await nftContract
        .connect(signer)
        .safeMintWhiteList(to, tokenId, proofs);

      const response = await tx.wait();
      const transactionHash = response.hash;
      console.log("Tx Hash ", transactionHash);
      whiteListErrorId.innerText = "";
      whiteListToInputTokenId.innerText = "";
      whiteListToInputId.innerText = "";
    } catch (error) {
      whiteListErrorId.innerText = error.reason;
      console.log(
        "Ocurrio un error en la acuñación por white list",
        error.message
      );
    }
  });

  // buyBack
  var buyBackBttn = document.getElementById("buyBackBttn");
  buyBackBttn.addEventListener("click", async function () {
    try {
      const tokenId = document.getElementById("buyBackInputId").value;
      buyBackErrorId.innerText = "";

      const tx = await nftContract.connect(signer).buyBack(tokenId);
      const response = await tx.wait();
      const transactionHash = response.hash;
      console.log("Tx Hash buyBack", transactionHash);
    } catch (error) {
      console.log("error", error);
      buyBackErrorId.innerText = error.reason;
    }
  });
}

function setUpEventsContracts() {
  var pubSList = document.getElementById("pubSList");
  pubSContract.on("PurchaseNftWithId", (account, id) => {
    console.log(account, id);
    var text = pubSList.textContent;
    pubSList.textContent = `${text} \n El evento purchase fue ejecutado por ${account} para el id ${id}`;
  });

  var bbitesListEl = document.getElementById("bbitesTList");
  bbitesTknContract.on("Transfer", (from, to, value) => {
    var text = bbitesListEl.textContent;
    bbitesListEl.textContent = `${text} \n Se han tranferido ${ethers.parseEther(
      value
    )} BBTK desde ${from} hacia ${to} `;
  });

  var nftList = document.getElementById("nftList");
  nftContract.on("Transfer", (from, to, tokenId) => {
    var text = nftList.textContent;
    nftList.textContent = `${text} \n Se ha transferido el token ${tokenId} desde ${from} a ${to} `;
  });

  var burnList = document.getElementById("burnList");
  nftContract.on("Burn", (account, id) => {
    var text = burnList.textContent;
    burnList.textContent = `${text} \n La cuenta ${account} ha quemado el token ${id}`;
  });
}

async function setUp() {
  window.ethereum.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  initSCsGoerli();
  initSCsMumbai();

  setUpListeners();
  setUpEventsContracts();

  buildMerkleTree();
}

setUp()
  .then()
  .catch((e) => console.log(e));
