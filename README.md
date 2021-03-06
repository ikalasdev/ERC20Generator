# ERC20Generator

> This package is used here https://ikalas.com/app/create-token-on-bsc

## Installation

1. This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).
Before installing, [download and install Node.js](https://nodejs.org/en/download/). 
If this is a brand new project, make sure to create a `package.json` first with
the ``npm init``  [command](https://docs.npmjs.com/creating-a-package-json-file).

2.  **This module need to be in a** [**hardhat project**](https://hardhat.org/getting-started/).  
[create hardhat project](https://hardhat.org/getting-started/) with 
```
npm install hardhat --save-dev
npx hardhat
```

3. install the module using
```bash
npm install @ikalasdev/erc20generator
```

check soldity compiler version is >= 0.8.0 in hardhat.config.js

add require('@nomiclabs/hardhat-waffle') in your hardhat.config.js if you don't have it

## Network
- [To deploy to a remote network such as mainnet or any testnet, you need to add a network entry to your hardhat.config.js](https://hardhat.org/tutorial/deploying-to-a-live-network.html#deploying-to-remote-networks)

exemple of hardhat config for binance testnet:
```js
module.exports = {
  solidity: "0.8.4",
  networks: {
    bsc: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts: [`${YOURPRIVATE_KEY}`]
    }
  }
};
```

- you can specify the network to use with the `--network` flag.
```
npx hardhat run .\mySuperScript.js --network mySuperBlockchain
```
- or you can specify the network rpc and the private key in the fonction parameters

## Verification
you can specify in the parameters a etherscan api key to verify the contract and publish the source code on etherscan.io
- work with polygonscan.com, bscscan.com... and their testnet. 

## Examples

```js
//import the module
const erc20Generator = require('@ikalasdev/erc20generator');
//specify the contract properties
const parameters = {
            name: name,
            symbol: symbol,
            initialSupply: initialSupply,
            decimal: 18,
            
            //optional parameters

            options: ["burnable", "snapshots", "mintable", "pausable", "permit", "vote", "flashminting"],
            //if you have the holdersfee option you need to specify the fee
            feeForTransaction: "1",
            //you can add a tax to your transactions
            tax: {
                taxForTransaction: "1",  // 0.01% of the transaction will be charged
                address: addr1.address   // the address that will receive the tax
            },
            //you can specify the network name if you decare it in the hardhat.config.js
            network: "smartchain",
            // OR you can specify the the private key and (rpc or chainId)   
            privateKey: YOUR_PRIVATE_KEY,
            rpc: "https://data-seed-prebsc-1-s1.binance.org:8545/",
            chainId: "0x38" // hex value must start with 0x or decimal value
            futurOwner: "0x324..",
            //you can specify the etherscan api key
            etherscanApiKey: "YOUR_API_KEY"

};
```

generate new Contract to deploy
```js
//contract contains all the information to deploy the contract (bytecode, abi, ...)
const contract = await erc20Generator.createERC20Contract(parameters);
//for example see https://docs.ethers.io/v4/api-contract.html to deploy it 
```
#### OR 
directly deploy new erc20 contract with hardhat
```js
//if you don't specify the privateKey and the rpc hardhat will use the default network in your hardhat.config.js
const token = await erc20Generator.deployERC20Contract(parameters);
```
  

## Error
- if you have a compilation error try to execute 
```bash
npx hardhat clean
```


## Logs

the lib will log the events in the file `erc20generator.log`


Want to see more ? [Check the test code in the repository](https://github.com/ikalasdev/ERC20Generator)



