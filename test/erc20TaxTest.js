const { expect } = require("chai");
const { ethers } = require("hardhat");
const generator = require("../src/erc20generator");
const name = "mytokentax";
const symbol = "MT";
const inicialSupply = "1000000";
const fs = require('fs');

describe("holders fee test", function () {

    var owner;
    var addr1;
    var addr2;
    var addrs;
    const inicialSupply = "1000000";
    var token;
    beforeEach(async function () {
        // Deploy the contract
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        const parameters = {
            name: name,
            symbol: symbol,
            inicialSupply: inicialSupply,
            decimal: 18,
            tax: {
                taxForTransaction: "1",
                address: addr1.address
            },
            options: ["snapshots", "mintable", "pausable", "permit", "vote", "flashminting"],
        };
        const tokenInfo = await generator.deployERC20Contract(parameters);

        const contract = JSON.parse(fs.readFileSync(`./artifacts/contracts/erc20contract.sol/${name}.json`).toString());
        token = new ethers.Contract(tokenInfo.address, contract.abi, owner);

    });

    it("should be able to make a transaction", async function () {
        const balanceOfAddr2BeforeTransaction = await token.balanceOf(addr2.address);

        const tx = await token.transfer(addr2.address, ethers.utils.parseEther("1"));

        const balanceOfAddr2AfterTransaction = await token.balanceOf(addr2.address);

        expect(balanceOfAddr2AfterTransaction.sub(balanceOfAddr2BeforeTransaction)).to.eq(ethers.utils.parseEther("1").add(ethers.utils.parseEther("-0.01")));

    });


    it("the taxer must have receive the fee", async function () {
        const tx = await token.transfer(addr2.address, ethers.utils.parseEther("1"));

        const balanceOfAddr1 = await token.balanceOf(addr1.address);
        expect(balanceOfAddr1).to.eq(ethers.utils.parseEther("1").div(100));
    });

});
