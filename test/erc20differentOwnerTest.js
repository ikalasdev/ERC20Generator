//futurOwner
const { expect } = require("chai");
const { ethers } = require("hardhat");
const generator = require("../src/erc20generator");
const name = "mytoken";
const symbol = "MT";
const inicialSupply = 1000000;
const options = ["burnable", "snapshots", "mintable", "pausable", "permit", "vote", "flashminting"];
require("dotenv").config();



describe("should deploy the contract", async function () {

    let deployer;
    let addr1;
    let addr2;
    let addr3;
    let addrs;
    var token;
    let borrowerToken;

    beforeEach(async function () {

        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

        [deployer] = await ethers.getSigners();

        const parameters = {
            name: name,
            symbol: symbol,
            inicialSupply: inicialSupply,
            decimal: 18,
            options: ["burnable", "snapshots", "mintable", "pausable", "permit", "vote", "flashminting"],
            network: "smartchain",
            futurOwner: addr1.address
        };
        token = await generator.deployERC20Contract(parameters);

        const borrowerTokenFactory = await ethers.getContractFactory("borrower");
        borrowerToken = await borrowerTokenFactory.deploy();
        await borrowerToken.deployed();
    });
    it("shoud have the correct deployer", async function () {
        const Tokendeployer = await token.owner();
        expect(Tokendeployer).to.equal(addr1.address);
    });
});


