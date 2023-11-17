const { ethers, upgrades } = require("hardhat");

// Address Contrato Proxy: 0x8d7aADd7093BF0b19cadFE1a820Bd8E98072Ff52
async function main() {
  const BBtokenUpgredable = await ethers.getContractFactory("BBitesToken");

  const MINTER_ADDRESS = "0xD0782f189FC222576E1f10cEd595afD752AC5733";
  const proxyDeploy = await upgrades.deployProxy(
    BBtokenUpgredable,
    [MINTER_ADDRESS],
    {
      kind: "uups",
    }
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
  const ProxyAddress = "0x827800444B3D5536633FBB305710F4cC80C173b0";
  const BBtokenUpgredableV2 = await ethers.getContractFactory("BBitesToken");

  await upgrades.upgradeProxy(ProxyAddress, BBtokenUpgredableV2);

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
