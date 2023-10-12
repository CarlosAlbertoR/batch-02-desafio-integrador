const { ethers, upgrades } = require("hardhat");

// Address Contrato Proxy:
async function main() {
  const NFTCollectionUpgredable = await ethers.getContractFactory(
    "CuyCollectionNft"
  );

  const NAME_TOKEN = "Cuy collection of Carlos Rios";
  const SYMBOL_TOKEN = "CCOCR";
  const MINTER_ADDRESS = "0xD0782f189FC222576E1f10cEd595afD752AC5733";

  const proxyDeploy = await upgrades.deployProxy(
    NFTCollectionUpgredable,
    [NAME_TOKEN, SYMBOL_TOKEN, MINTER_ADDRESS],
    { kind: "uups" }
  );

  if (
    !!process.env.HARDHAT_NETWORK &&
    process.env.HARDHAT_NETWORK != "localhost"
  ) {
    const tx = await proxyDeploy.waitForDeployment();
    await tx.deploymentTransaction().wait(5);
  }

  const implementationAdd = await upgrades.erc1967.getImplementationAddress(
    await proxyDeploy.getAddress()
  );

  console.log(`Address del Proxy es: ${await proxyDeploy.getAddress()}`);
  console.log(`Address de Impl es: ${implementationAdd}`);

  if (
    !!process.env.HARDHAT_NETWORK &&
    process.env.HARDHAT_NETWORK != "localhost"
  ) {
    // verificación del address de implementación
    await hre.run("verify:verify", {
      address: implementationAdd,
      constructorArguments: [],
    });
  }
}

async function upgrade() {
  const ProxyAddress = "0x8d7aADd7093BF0b19cadFE1a820Bd8E98072Ff52";
  const NFTCollectionUpgredableV2 = await ethers.getContractFactory(
    "CuyCollectionNft"
  );

  const proxyUpgrade = await upgrades.upgradeProxy(
    ProxyAddress,
    NFTCollectionUpgredableV2
  );

  if (
    !!process.env.HARDHAT_NETWORK &&
    process.env.HARDHAT_NETWORK != "localhost"
  ) {
    await proxyUpgrade.deployProxy.wait(5);
  }

  const implAddressV2 = await upgrades.erc1967.getImplementationAddress(
    ProxyAddress
  );

  console.log(`Address Proxy: ${ProxyAddress}`);
  console.log(`Address Impl V2: ${implAddressV2}`);

  if (
    !!process.env.HARDHAT_NETWORK &&
    process.env.HARDHAT_NETWORK != "localhost"
  ) {
    await hre.run("verify:verify", {
      address: implAddressV2,
      constructorArguments: [],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});