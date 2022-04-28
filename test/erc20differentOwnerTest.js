//futurOwner
const { expect } = require("chai");
const { ethers } = require("hardhat");
const generator = require("../src/erc20generator");
const name = "mytoken";
const symbol = "MT";
const inicialSupply = 1000000;
const options = ["burnable", "snapshots", "mintable", "pausable", "permit", "vote", "flashminting"];
require("dotenv").config();
const fs = require('fs');


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
            futurOwner: addr1.address
        };
        const tokenInfo = await generator.deployERC20Contract(parameters);
        const contract = JSON.parse(fs.readFileSync(`./artifacts/contracts/erc20contract.sol/${name}.json`).toString());
        token = new ethers.Contract(tokenInfo.address, contract.abi, deployer);

    });
    it("shoud have the correct deployer", async function () {
        const Tokendeployer = await token.owner();
        expect(Tokendeployer).to.equal(addr1.address);
    });

    it("the futur owner should have the correct supply", async function () {
        const Tokendeployer = await token.balanceOf(addr1.address);
        expect(Tokendeployer).to.equal(ethers.utils.parseEther(inicialSupply.toString()).toString());
    });
});


