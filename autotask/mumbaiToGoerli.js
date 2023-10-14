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

  // Filter only Burn event
  const event = onlyEvents.filter((ev) => ev.signature.includes("Burn"));
  const { account, id } = event[0].params;

  // Call mint method on Goerli network
  const BBTOKEN_ADDRESS = "0x827800444B3D5536633FBB305710F4cC80C173b0";
  const tokenAbi = ["function mint(address to, uint256 amount)"];
  const tokensToMint = 10000 * 10 ** 18;
  var tokenContract = new ethers.Contract(BBTOKEN_ADDRESS, tokenAbi, signer);
  var tx = await tokenContract.mint(account, tokensToMint);
  var res = await tx.wait();
  return res;
};
