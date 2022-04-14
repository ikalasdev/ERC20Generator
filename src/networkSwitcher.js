const { EthereumProvider } = require("hardhat/types/provider");
const { createProvider } = require("hardhat/internal/core/providers/construction");
const hre = require("hardhat");
const providers = {};

hre.getProvider = function getProvider(name) {
    if (!providers[name]) {
        providers[name] = createProvider(
            name,
            this.config.networks[name],
            this.config.paths,
            this.artifacts,
        );
    }
    return providers[name];
}

hre.changeNetwork = function changeNetwork(newNetwork) {
    if (!this.config.networks[newNetwork]) {
        throw new Error(`changeNetwork: Couldn't find network '${newNetwork}' you must declare it in your hardhat config`);
    }

    if (!providers[this.network.name]) {
        providers[this.network.name] = this.network.provider;
    }

    this.network.name = newNetwork;
    this.network.config = this.config.networks[newNetwork];
    this.network.provider = this.getProvider(newNetwork);

    if (this.ethers) {
        const { EthersProviderWrapper } = require("@nomiclabs/hardhat-ethers/internal/ethers-provider-wrapper");
        this.ethers.provider = new EthersProviderWrapper(this.network.provider);
    }
};