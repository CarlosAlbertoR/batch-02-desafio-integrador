async function main() {
  await hre.run("verify:verify", {
    address: "0x79c21c607ff9b12228fed3a04fb795a40aac0484",
    constructorArguments: [],
  });
}

main().catch((err) => console.log("err", err));
