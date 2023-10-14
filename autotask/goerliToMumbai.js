const { ethers } = require("ethers");
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("@openzeppelin/defender-relay-client/lib/ethers");

exports.handler = async function (data) {
  const payload = data.request.body.events;

  const provider = new DefenderRelayProvider(data);
  const signer = new DefenderRelaySigner(data, provider, { speed: "fast" });

  // Filter events
  const onlyEvents = payload[0].matchReasons.filter((e) => e.type === "event");
  if (onlyEvents.length === 0) return;

  // Filter only PurchaseNftWithId event
  const event = onlyEvents.filter((ev) =>
    ev.signature.includes("PurchaseNftWithId")
  );
  const { account, id } = event[0].params;

  // Call safeMint method on Mumbai network
  const NFT_COLLECTION_ADDRESS = "0x3C8f33556346b99cC876D185BdF18B10f69C2E8A";
  const tokenAbi = ["function safeMint(address to, uint256 tokenId)"];
  var tokenContract = new ethers.Contract(
    NFT_COLLECTION_ADDRESS,
    tokenAbi,
    signer
  );
  var tx = await tokenContract.safeMint(account, id);
  var res = await tx.wait();
  return res;
};
