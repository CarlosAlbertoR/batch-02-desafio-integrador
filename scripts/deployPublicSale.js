const { ethers, upgrades } = require("hardhat");

// Address Contrato Proxy:
async function main() {
  const PublicSaleUpgredable = await ethers.getContractFactory("PublicSale");

  const BBTOKEN_ADDRESS = "0x827800444B3D5536633FBB305710F4cC80C173b0";
  const UDSC_ADDRESS = "0xF36280fF71df4e96F19ef9317e6B45B058915531";
  const UNISWAP_ADDRESS = "0x195250db8E525d40278eC0D7D081FD0B9bC37299";

  const proxyDeploy = await upgrades.deployProxy(
    PublicSaleUpgredable,
    [BBTOKEN_ADDRESS, UDSC_ADDRESS, UNISWAP_ADDRESS],
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
