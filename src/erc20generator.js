const fs = require('fs');
const { ethers } = require('hardhat');
const hre = require("hardhat");

const pathFile = "./contracts/erc20contract.sol"
let modulesList = require("./template.json");
const blockchains = require("./blockchains.json");

function modulesToAdd(modules, options) {
    for (const moduleName of options) {
        const moduleToPush = modulesList[moduleName];
        if (!moduleToPush) console.log(`module ${moduleName} not found`);
        if (!modules.includes(moduleToPush)) {
            modules.splice(moduleToPush.priority ? moduleToPush.priority : modules.length, 0, moduleToPush);
            if (moduleToPush.dependency) {
                modules = modulesToAdd(modules, moduleToPush.dependency);
            }
        }
    }
    return modules;
}


function createERC20ContractFile(name = "defaultName", symbol = "DN", inicialSupply, decimal = 18, options = [], futurOwner, feeForTransaction, tax) {
    if (name[0].match(/[0-9]/)) {
        throw new Error("name must start with a letter");
    }

    let contractName = name.replace(/\s/g, "");


    if (!hre.config.solidity.compilers[0].version.match(/^[0-9]+\.(([8-9])|([1-9]([0-9])+))\..*/)) {
        throw new Error("solidity compiler version must be >= 0.8.0");
    }

    try {
        const fs = require('fs');
        let nodeModule = require.resolve('@ikalasdev/erc20generator/src/erc20contractTemplate.sol');
        var template = fs.readFileSync(nodeModule).toString();
    } catch (error) {
        const fs = require('fs');
        var template = fs.readFileSync(`./src/erc20contractTemplate.sol`).toString();
    }

    var modules = Array();
    modules = modulesToAdd(modules, options);

    if (decimal != 18) {
        modules.push(modulesList[`decimal`]);
    }

    if (tax) {
        modulesToAdd(modules, [`tax`]);
    }

    if (feeForTransaction) {
        modulesToAdd(modules, [`holdersFee`]);
    }

    if (futurOwner) {
        modulesToAdd(modules, [`mintable`]);
    }

    var replacements = ["IMPORT", "INHERITANCE", "INITIALISATION", "SUPERCONSTRUCTOR", "FUNCTIONS"];
    for (const replacement of replacements) {
        var sourceCodeToAdd = "";
        for (const module of modules) {
            if (module && module[replacement]) {
                sourceCodeToAdd += module[replacement];
            }
        }
        template = template.replace(`\${${replacement}}`, sourceCodeToAdd);
    }


    if (tax) {
        template = template.replace(/\${TAXFORTRANSACTION}/g, tax.taxForTransaction);
        template = template.replace(/\${ADDRESSTOSENDTAX}/g, tax.address);
    }
    template = template.replace(/\${OWNER}/g, futurOwner ? futurOwner : "msg.sender");
    template = template.replace(/\${FEEFORTRANSACTION}/g, feeForTransaction ? feeForTransaction : "1");
    template = template.replace(/\${CONTRACTNAME}/g, contractName);
    template = template.replace(/\${TOKENNAME}/g, name);
    template = template.replace(/\${TOKENSYMBOL}/g, symbol);
    template = template.replace(/\${INITIALSUPPLY}/g, inicialSupply);
    template = template.replace(/\${DECIMAL}/g, decimal);

    for (const module of modules) {
        if (module && module.replacement) {
            for (const key of Object.keys(module.replacement)) {
                template = template.replace("${" + key + "}", module.replacement[key] + `\${${key}}`);
            }
        }
    }
    const regex = /\${[A-Z]*}/g;
    template = template.replace(regex, "");

    var fs = require('fs');
    var dir = './contracts';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    fs.writeFile(pathFile, template, err => {
        if (err) {
            console.error(err)
            return
        }
    })

}







async function createERC20Contract(parameters) {
    let name = parameters.name;
    let symbol = parameters.symbol;
    let inicialSupply = parameters.inicialSupply;
    let decimal = parameters.decimal;
    let options = parameters.options;
    let futurOwner = parameters.futurOwner;
    if (futurOwner) futurOwner = ethers.utils.getAddress(futurOwner.toLowerCase());

    let feeForTransaction = parameters.feeForTransaction;
    let tax = parameters.tax;

    createERC20ContractFile(name, symbol, inicialSupply, decimal, options, futurOwner, feeForTransaction, tax);
    let nameFile = name.replace(/\s/g, "");

    try {
        await hre.run('compile');
    } catch (error) {
        console.log("cache error retry command if it fail");
    }

    const contract = JSON.parse(fs.readFileSync(`./artifacts/contracts/erc20contract.sol/${nameFile}.json`).toString());
    const soldityCode = fs.readFileSync(`./contracts/erc20contract.sol`).toString();
    return {
        ...contract,
        soldityCode
    };
    // le client a juste besoin de récupérer l'abi et le bytecode pour déployé le contrat
    // voir https://docs.ethers.io/v4/api-contract.html


}



//parameters name, symbol, inicialSupply, decimal, options, privateKey, rpc
async function deployERC20Contract(parameters) {
    parameters = init(parameters);
    let name = parameters.name;
    let futurOwner = parameters.futurOwner;

    createERC20ContractFile(name, parameters.symbol, parameters.inicialSupply,
        parameters.decimal, parameters.options, parameters.futurOwner,
        parameters.feeForTransaction, parameters.tax);


    try {
        await hre.run('compile');
    } catch (error) {
        console.log("cache error retry command if it fail");
    }

    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const smartContractFactory = await ethers.getContractFactory(name.replace(/\s/g, ""));
    const smartContract = await smartContractFactory.deploy();

    await smartContract.deployed();

    console.log("Token address:", smartContract.address);
    if (futurOwner) {
        await smartContract.transferOwnership(futurOwner);
    }

    var network = await deployer.provider.getNetwork();
    network = blockchains.find(element => element.chainId == network.chainId);
    var url = "";
    if (network && network.explorers) {
        url = `${network.explorers[0].url}/address/${smartContract.address}`;
        console.log("blockscan url:", url);
    } else {
        console.log("no explorer found");
    }

    await verifyContract(network, smartContract.address, parameters.etherscanApiKey);
    return { "address": smartContract.address, "url": url };
}

function init(parameters) {
    if (parameters.futurOwner) parameters.futurOwner = ethers.utils.getAddress(parameters.futurOwner.toLowerCase());

    if (parameters.privateKey) {
        if (parameters.rpc) {
            parameters.network = addNetworkToHardhat(parameters.privateKey, parameters.rpc);
        } else if (parameters.chainId) {
            let rpc = getRpcUrlByChainId(parameters.chainId);
            parameters.network = addNetworkToHardhat(parameters.privateKey, rpc);
        } else {
            throw new Error("you must provide rpc or chainId");
        }
    }
    if (parameters.network) {
        require("./networkSwitcher.js");
        hre.changeNetwork(parameters.network);
    }

    const configText = fs.readFileSync('./hardhat.config.js').toString();
    if (!configText.includes("require(\"@nomiclabs/hardhat-waffle\");")) {
        console.error("you must include hardhat-waffle in your hardhat.config.js");
        return;
    }
    return parameters;

}

function getRpcUrlByChainId(chainId) {
    if (chainId.startsWith("0x")) {
        chainId = parseInt(chainId, 16);
    }
    var network = blockchains.find(element => element.chainId == chainId);
    if (network) {
        //if network is a array take the first one
        if (Array.isArray(network.rpc)) {
            return network.rpc[0];
        } else {
            return network.rpc;
        }
    } else {
        throw new Error("no network found for chainId:", chainId);
    }
}

function addNetworkToHardhat(privateKey, rpcUrl) {
    if (!privateKey.match(/^0x[0-9a-fA-F]{64}$/)) {
        privateKey = "0x" + privateKey;
    }
    const network = {
        accounts: [
            `${privateKey}`
        ],
        gas: 'auto',
        gasPrice: 'auto',
        gasMultiplier: 1,
        httpHeaders: {},
        timeout: 20000,
        url: `${rpcUrl}`
    }
    hre.config.networks.network = network;
    return "network";
}


async function verifyContract(network, addressContract, apiKeyEtherscan) {
    if (network && apiKeyEtherscan) {
        require("@nomiclabs/hardhat-etherscan");
        hre.config.etherscan = {
            apiKey: apiKeyEtherscan
        }
        await hre.run("clean");
        console.log("waiting 1mn for etherscan to be ready...");
        await sleep(60 * 1000);
        await hre.run("verify", {
            address: addressContract
        });
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { createERC20Contract, deployERC20Contract };


