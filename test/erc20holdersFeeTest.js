const { expect } = require("chai");
const { ethers } = require("hardhat");
const generator = require("../src/erc20generator");
const name = "mytoken";
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
            feeForTransaction: "1",
            decimal: 18,
            options: ["burnable", "snapshots", "mintable", "pausable", "permit", "vote", "flashminting", "holdersFee"],
        };
        const tokenInfo = await generator.deployERC20Contract(parameters);

        const contract = JSON.parse(fs.readFileSync(`./artifacts/contracts/erc20contract.sol/${name}.json`).toString());
        token = new ethers.Contract(tokenInfo.address, contract.abi, owner);

    });

    it("should be able to make a transaction", async function () {
        const balanceOfAddr1BeforeTransaction = await token.balanceOf(addr1.address);

        const tx = await token.transfer(addr1.address, ethers.utils.parseEther("1"));

        const balanceOfAddr1AfterTransaction = await token.balanceOf(addr1.address);

        expect(balanceOfAddr1AfterTransaction.sub(balanceOfAddr1BeforeTransaction)).to.eq(ethers.utils.parseEther("1").add(ethers.utils.parseEther("-0.01")));

    });

    it("it should be registered after transaction", async function () {
        const tx = await token.transfer(addr1.address, ethers.utils.parseEther("1"));

        const isRegistered = await token.isRegistered(addr1.address);

        expect(isRegistered).to.eq(true);
    });


    it("the token must have receive the fee", async function () {
        const tx = await token.transfer(addr1.address, ethers.utils.parseEther("1"));

        const balanceOfToken = await token.balanceOf(token.address);
        console.log("balanceOfToken", balanceOfToken);

        expect(balanceOfToken).to.eq(ethers.utils.parseEther("1").div(100));
    });

    describe("withdrawing", function () {

        beforeEach(async function () {
            const tx = await token.transfer(addr1.address, ethers.utils.parseEther("1"));
            await network.provider.send("evm_mine");
            const tx2 = await token.transfer(addr1.address, ethers.utils.parseEther("1"));
        });


        it("addr1 should be able to withdraw token", async function () {
            const tx3 = await token.connect(addr1).withdraw();

            const balanceOfAddr1AfterTransaction = await token.balanceOf(addr1.address);

            const expectedBalance = ethers.utils.parseEther("1.985");
            expect(balanceOfAddr1AfterTransaction).to.eq(expectedBalance);
        });

        it("owner should be able to withdraw token", async function () {
            let balanceContract = await token.balanceOf(token.address);

            let expectedBalance = ethers.utils.parseEther(inicialSupply).sub(ethers.utils.parseEther("2"));

            const tx = await token.withdraw();
            const balanceOwner = await token.balanceOf(owner.address);

            expectedBalance = expectedBalance.add(ethers.utils.parseEther("0.01"));

            expect(balanceOwner).to.eq(expectedBalance);
        });

        it("everybody should be able to withdraw token", async function () {
            const tx = await token.withdraw();
            const tx2 = await token.connect(addr1).withdraw();

            const balanceOfAddr1AfterTransaction = await token.balanceOf(addr1.address);
            const balanceOfOwnerAfterTransaction = await token.balanceOf(owner.address);


            const expectedBalanceAddr1 = ethers.utils.parseEther("1.985");

            let expectedBalanceOwner = ethers.utils.parseEther(inicialSupply).sub(ethers.utils.parseEther("2"));
            expectedBalanceOwner = expectedBalanceOwner.add(ethers.utils.parseEther("0.01"));


            expect(balanceOfAddr1AfterTransaction).to.eq(expectedBalanceAddr1);
            expect(balanceOfOwnerAfterTransaction).to.eq(expectedBalanceOwner);
        });

        it("should be able to know avaible token", async function () {
            const availbeToken = await token.getAvailabeToken();
            expect(availbeToken).to.eq(ethers.utils.parseEther("0.01"));
        });

        it("unregistered address should revert transaction of withdraw", async function () {
            await expect(token.connect(addr2).withdraw()).to.be.revertedWith("you must be registered as holders");
        });



    });
});
