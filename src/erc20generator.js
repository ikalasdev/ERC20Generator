const fs = require('fs')
const hre = require("hardhat");
require('dotenv').config();

const pathFile = "./contracts/erc20contract.sol"
const pathTemplate = "./src/template.json";

let rawdata = fs.readFileSync(pathTemplate);
let modulesList = JSON.parse(rawdata);



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

    var template = fs.readFileSync(`./src/erc20contractTemplate.sol`).toString();

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

module.exports = { createERC20Contract };


