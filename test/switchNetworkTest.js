const { expect } = require("chai");
const { ethers } = require("hardhat");
const generator = require("../src/erc20generator");
const name = "mytoken";
const symbol = "MT";
const inicialSupply = 1000000;
const options = ["burnable", "snapshots", "mintable", "pausable", "permit", "vote", "flashminting"];
require("dotenv").config();

describe(" erc20 contract test on remote network with network name as parameter", function () {

    let deployer;
    let addr1;
    let addr2;
    let addr3;
    let addrs;
    var token;
    let borrowerToken;


    it("should deploy the contract", async function () {


        const parameters = {
            name: name,
            symbol: symbol,
            inicialSupply: inicialSupply,
            decimal: 18,
            options: ["burnable", "snapshots", "mintable", "pausable", "permit", "vote", "flashminting"],
            network: "smartchain"
        };
        token = await generator.deployERC20Contract(parameters);
        token = token.contract;
        [deployer] = await ethers.getSigners();

        const nameToken = await token.name();
        expect(nameToken).to.equal(name);

        const symbolToken = await token.symbol();
        expect(symbolToken).to.equal(symbol);

        const totalSupply = await token.totalSupply();
        expect(totalSupply.toString()).to.equal(ethers.utils.parseEther(inicialSupply.toString()).toString());

        const decimalToken = await token.decimals();
        expect(decimalToken.toString()).to.equal("18");

        const Tokendeployer = await token.owner();
        console.log("owner : ", Tokendeployer.toString());
        expect(Tokendeployer).to.equal(deployer.address);

    });

});




describe("erc20 contract test with remote network and private key,url as parameter", function () {

    let deployer;
    let addr1;
    let addr2;
    let addr3;
    let addrs;
    var token;
    let borrowerToken;


    it("should deploy the contract", async function () {

        const parameters = {
            name: name,
            symbol: symbol,
            inicialSupply: inicialSupply,
            decimal: 18,
            options: options,
            privateKey: process.env.PRIVATE_KEY,
            rpc: "https://data-seed-prebsc-1-s1.binance.org:8545/"
        };
        token = await generator.deployERC20Contract(parameters);
        token = token.contract;
        [deployer] = await ethers.getSigners();

        const nameToken = await token.name();
        expect(nameToken).to.equal(name);

        const symbolToken = await token.symbol();
        expect(symbolToken).to.equal(symbol);

        const totalSupplyToken = await token.totalSupply();
        expect(totalSupplyToken.toString()).to.equal(ethers.utils.parseEther(inicialSupply.toString()).toString());

        const decimalToken = await token.decimals();
        expect(decimalToken.toString()).to.equal("18");

        const Tokendeployer = await token.owner();
        console.log("owner : ", Tokendeployer.toString());
        expect(Tokendeployer).to.equal(deployer.address);

    });

});