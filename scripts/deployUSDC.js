const { ethers } = require("hardhat");

async function main() {
  const usdcContract = await ethers.deployContract("USDCoin");
  console.log(`Address del contrato ${await usdcContract.getAddress()}`);

  if (
    !!process.env.HARDHAT_NETWORK &&
    process.env.HARDHAT_NETWORK != "localhost"
  ) {
    const res = await usdcContract.waitForDeployment();
    await res.deploymentTransaction().wait(10);

    await hre.run("verify:verify", {
      address: await usdcContract.getAddress(),
      constructorArguments: [],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
