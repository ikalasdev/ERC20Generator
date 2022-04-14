const fs = require('fs');
const { ethers } = require('hardhat');
const hre = require("hardhat");

const pathFile = "./contracts/erc20contract.sol"
let modulesList = require("./template.json");



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


function createERC20ContractFile(name = "defaultName", symbol = "DN", inicialSupply, decimal = 18, options = []) {


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
        modules.push(modulesData.decimal);
    }

    //import
    var importModule = "";
    for (const module of modules) {
        if (module && module.import) {
            importModule += module.import;
        }
    }
    template = template.replaceAll("${IMPORT}", importModule);

    //inheritance
    var inheritance = "";
    for (const module of modules) {
        if (module && module.inheritance) {
            inheritance += module.inheritance;
        }
    }
    template = template.replaceAll("${INHERITANCE}", inheritance);

    //superconstructor
    var superconstructor = "";
    for (const module of modules) {
        if (module && module.superconstructor) {
            superconstructor += module.superconstructor;
        }
    }
    template = template.replaceAll("${SUPERCONSTRUCTOR}", superconstructor);



    //fonction
    var funtionModules = "";
    for (const module of modules) {
        if (module && module.function) {
            funtionModules += module.function;
        }
    }
    template = template.replaceAll("${FUNCTIONS}", funtionModules);



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







async function createERC20Contract(name, symbol, inicialSupply, decimal, options) {



    createERC20ContractFile(name, symbol, inicialSupply, decimal, options);
    await hre.run('compile');
    const contract = JSON.parse(fs.readFileSync(`./artifacts/contracts/erc20contract.sol/${name}.json`).toString());
    const soldityCode = fs.readFileSync(`./contracts/erc20contract.sol`).toString();
    return {
        ...contract,
        soldityCode
    };
    // le client a juste besoin de récupérer l'abi et le bytecode pour déployé le contrat
    // voir https://docs.ethers.io/v4/api-contract.html


}


async function deployERC20Contract(name, symbol, inicialSupply, decimal, options, networkName) {


    if (networkName) {
        require("./networkSwitcher.js");
        hre.changeNetwork(networkName);
    }


    createERC20ContractFile(name, symbol, inicialSupply, decimal, options);

    await hre.run('compile');

    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const smartContractFactory = await ethers.getContractFactory(name);
    const smartContract = await smartContractFactory.deploy();

    await smartContract.deployed();

    console.log("Token address:", smartContract.address);

    return smartContract;
}


module.exports = { createERC20Contract, deployERC20Contract };


