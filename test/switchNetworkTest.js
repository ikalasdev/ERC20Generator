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

        [deployer] = await ethers.getSigners();

        const parameters = {
            name: name,
            symbol: symbol,
            inicialSupply: inicialSupply,
            decimal: 18,
            options: ["burnable", "snapshots", "mintable", "pausable", "permit", "vote", "flashminting"],
            network: "smartchain"
        };
        token = await generator.deployERC20Contract(parameters);

        const borrowerTokenFactory = await ethers.getContractFactory("borrower");
        borrowerToken = await borrowerTokenFactory.deploy();
        await borrowerToken.deployed();

        it("should have the correct name", async function () {
            const name = await token.name();
            expect(name).to.equal(name);
        });

        it("should have the correct symbol", async function () {
            const symbol = await token.symbol();
            expect(symbol).to.equal(symbol);
        });

        it("should have the correct inicial supply", async function () {
            const totalSupply = await token.totalSupply();
            expect(totalSupply.toString()).to.equal(ethers.utils.parseEther(inicialSupply.toString()).toString());
        });

        it("should have the correct decimal", async function () {
            const decimal = await token.decimals();
            expect(decimal.toString()).to.equal("18");
        });

        it("shoud have the correct deployer", async function () {
            const Tokendeployer = await token.owner();
            expect(Tokendeployer).to.equal(deployer.address);
        });

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

        [deployer] = await ethers.getSigners();
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

        const borrowerTokenFactory = await ethers.getContractFactory("borrower");
        borrowerToken = await borrowerTokenFactory.deploy();
        await borrowerToken.deployed();

        it("should have the correct name", async function () {
            const name = await token.name();
            expect(name).to.equal(name);
        });

        it("should have the correct symbol", async function () {
            const symbol = await token.symbol();
            expect(symbol).to.equal(symbol);
        });

        it("should have the correct inicial supply", async function () {
            const totalSupply = await token.totalSupply();
            expect(totalSupply.toString()).to.equal(ethers.utils.parseEther(inicialSupply.toString()).toString());
        });

        it("should have the correct decimal", async function () {
            const decimal = await token.decimals();
            expect(decimal.toString()).to.equal("18");
        });

        it("shoud have the correct deployer", async function () {
            const Tokendeployer = await token.owner();
            expect(Tokendeployer).to.equal(deployer.address);
        });

    });

});

