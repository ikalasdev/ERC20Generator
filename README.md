# ERC20Generator


## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).

Before installing, [download and install Node.js](https://nodejs.org/en/download/).

If this is a brand new project, make sure to create a `package.json` first with
the [`npm init` command](https://docs.npmjs.com/creating-a-package-json-file).

Installation is done using the
[`npm install @ikalasdev/erc20generator` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):


This module need to be in a [hardhat project](https://hardhat.org/getting-started/).

create hardhat project with 
[`npx hardhat` command](https://hardhat.org/getting-started/)

check soldity compiler version is >= 0.8.0 in hardhat.config.js

## Network

- you can specify the network to use with the `--network` flag.
``npx hardhat run .\mySuperScript.js --network mySuperBlockchain``
- or you can specify the network name in the fonction parameters
```js
const network = "mySuperBlockchain";
deployERC20Contract(name, symbol, inicialSupply, decimals, options, network);
```
## Examples

```js
//import the module
const erc20Generator = require('@ikalasdev/erc20generator');
//specify the contract properties
const name = "MyToken";
const symbol = "MTK";
const inicialSupply = 10000;
const decimals = 18;
//all available options :
const options =  ["burnable", "snapshots", "mintable", "pausable", "permit", "vote", "flashminting"];
```

- generate new Contract to deploy
```js
//contract contains all the information to deploy the contract (bytecode, abi, ...)
const contract = await generator.createERC20Contract(name, symbol, inicialSupply, decimals, options);
//for example see https://docs.ethers.io/v4/api-contract.html to deploy it 
```

- directly deploy new erc20 contract with hardhat
```js
const token = await generator.deployERC20Contract(name, symbol, inicialSupply, decimals, options);
```
  
Want to see more ? [Check the test code in the repository](https://github.com/ikalasdev/ERC20Generator)



