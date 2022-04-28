const fs = require('fs');
const { ethers } = require('hardhat');
const hre = require("hardhat");

const pathFile = "./contracts/erc20contract.sol"
let modulesList = require("./template.json");
const blockchains = require("./blockchains.json");

function modulesToAdd(modules, options) {
    for (const moduleName of options) {
        const moduleToPush = modulesList[moduleName];
        if (!modules.includes(moduleToPush)) {
            modules.splice(moduleToPush.priority ? moduleToPush.priority : modules.length, 0, moduleToPush);
            if (moduleToPush.dependency) {
                modules = modulesToAdd(modules, moduleToPush.dependency);
            }
        }
    }
    return modules;
}


function createERC20ContractFile(name = "defaultName", symbol = "DN", inicialSupply, decimal = 18, options = [], futurOwner, feeForTransaction) {

    let contractName = name.replaceAll(" ", "");


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
    var replacements = ["IMPORT", "INHERITANCE", "INITIALISATION", "SUPERCONSTRUCTOR", "FUNCTIONS"];
    for (const replacement of replacements) {
        var sourceCodeToAdd = "";
        for (const module of modules) {
            if (module && module[replacement]) {
                sourceCodeToAdd += module[replacement];
            }
        }
        template = template.replaceAll(`\${${replacement}}`, sourceCodeToAdd);
    }

    template = template.replaceAll("${OWNER}", futurOwner ? futurOwner : "msg.sender");
    template = template.replaceAll("${FEEFORTRANSACTION}", feeForTransaction ? feeForTransaction : "1");
    template = template.replaceAll("${CONTRACTNAME}", contractName);
    template = template.replaceAll("${TOKENNAME}", name);
    template = template.replaceAll("${TOKENSYMBOL}", symbol);
    template = template.replaceAll("${INITIALSUPPLY}", inicialSupply);
    template = template.replaceAll("${DECIMAL}", decimal);

    for (const module of modules) {
        if (module && module.replacement) {
            for (const key of Object.keys(module.replacement)) {
                template = template.replaceAll("${" + key + "}", module.replacement[key]);
            }
        }
    }
    const regex = /\${.*}/g;
    template = template.replaceAll(regex, "");

    // console.log(template);

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
    let feeForTransaction = parameters.feeForTransaction;

    fs.rmSync("artifacts", { recursive: true, force: true });

    createERC20ContractFile(name, symbol, inicialSupply, decimal, options, futurOwner, feeForTransaction);
    let nameFile = name.replaceAll(" ", "");

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
    let name = parameters.name;
    let symbol = parameters.symbol;
    let inicialSupply = parameters.inicialSupply;
    let decimal = parameters.decimal;
    let options = parameters.options;
    let privateKey = parameters.privateKey;
    let rpc = parameters.rpc;
    let networkName = parameters.network;
    let futurOwner = parameters.futurOwner;
    let feeForTransaction = parameters.feeForTransaction;

    fs.rmSync("artifacts", { recursive: true, force: true });


    const configText = fs.readFileSync('./hardhat.config.js').toString();
    if (!configText.includes("require(\"@nomiclabs/hardhat-waffle\");")) {
        console.error("you must include hardhat-waffle in your hardhat.config.js");
        return;
    }
    if (privateKey) {
        if (rpc) {
            networkName = addNetworkToHardhat(privateKey, rpc);
        } else {
            networkName = privateKey;
        }
    }
    if (networkName) {
        require("./networkSwitcher.js");
        hre.changeNetwork(networkName);
    }


    createERC20ContractFile(name, symbol, inicialSupply, decimal, options, futurOwner, feeForTransaction);


    try {
        await hre.run('compile');
    } catch (error) {
        console.log("cache error retry command if it fail");
    }

    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const smartContractFactory = await ethers.getContractFactory(name.replaceAll(" ", ""));
    const smartContract = await smartContractFactory.deploy();

    await smartContract.deployed();

    console.log("Token address:", smartContract.address);
    if (futurOwner) {
        await smartContract.transferOwnership(futurOwner);
    }

    var network = await deployer.provider.getNetwork();
    network = blockchains.find(element => element.chainId == network.chainId);
    var url = "";
    if (network) {
        url = `${network.explorers[0].url}/address/${smartContract.address}`;
        console.log("blockscan url:", url);
    } else {
        console.log("no explorer found");
    }


    return { "address": smartContract.address, "url": url };
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

module.exports = { createERC20Contract, deployERC20Contract };


