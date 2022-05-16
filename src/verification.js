const hre = require('hardhat');
const networkSwitcher = require("./networkSwitcher.js");
async function verifyContract(addressContract, apiKeyEtherscan) {
    if (apiKeyEtherscan) {
        require("@nomiclabs/hardhat-etherscan");
        hre.config.etherscan = {
            apiKey: apiKeyEtherscan
        }
        await hre.run("clean");
        await sleep(60 * 1000);
        await hre.run("verify", {
            address: addressContract
        });
    }
}


async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function main() {
    const parameters = {
        addressContract: process.argv[2],
        apiKeyEtherscan: process.argv[3],
        privateKey: process.argv[4],
        rpcUrl: process.argv[5]
    }
    switchNetwork(parameters.privateKey, parameters.rpcUrl);
    await verifyContract(parameters.addressContract, parameters.apiKeyEtherscan);
}


main().then(
    () => process.exit(0)
).catch((error) => {
    console.error(error);
    process.exit(1);
});


function switchNetwork(privateKey, rpcUrl) {
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
    hre.changeNetwork("network");
}
