const { expect } = require("chai");
const { ethers } = require("hardhat");
const generator = require('../src/erc20generator.js');
const fs = require('fs');
//option available:
//["burnable", "snapshots", "mintable", "pausable", "permit", "vote", "flashminting"]

const name = "mytoken";
const symbol = "MT";
const inicialSupply = 1000000;


describe("full erc20 contract test", function () {

    let deployer;
    let addr1;
    let addr2;
    let addr3;
    let addrs;
    var token;
    let borrowerToken;
    let chainId;


    beforeEach(async function () {
        [deployer, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

        const parameters = {
            name: name,
            symbol: symbol,
            inicialSupply: inicialSupply,
            decimal: 18,
            options: ["burnable", "snapshots", "mintable", "pausable", "permit", "vote", "flashminting"]
        };

        const tokenInfo = await generator.deployERC20Contract(parameters);
        const contract = JSON.parse(fs.readFileSync(`./artifacts/contracts/erc20contract.sol/${name}.json`).toString());
        token = new ethers.Contract(tokenInfo.address, contract.abi, deployer);

        const borrowerTokenFactory = await ethers.getContractFactory("borrower");
        borrowerToken = await borrowerTokenFactory.deploy();
        await borrowerToken.deployed();

        chainId = await token.getChainId();

    });


    describe("deployment", function () {

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



        it("the addr1 should be empty", async function () {
            const balance = await token.balanceOf(addr1.address);
            expect(balance.toString()).to.equal("0");
        });

    });


    it("the deployer should be able to mint tokens", async function () {
        const balanceBeforeMint = await token.balanceOf(deployer.address);

        await token.mint(deployer.address, ethers.utils.parseEther("1"));

        const balanceAfterMint = await token.balanceOf(deployer.address);
        expect(parseInt(balanceAfterMint)).to.equal(parseInt(balanceBeforeMint) + parseInt(ethers.utils.parseEther("1")));

    });

    it("the deployer should be able to burn tokens", async function () {
        const balanceBeforeBurn = await token.balanceOf(deployer.address);

        await token.burn(ethers.utils.parseEther("1"));

        const balanceAfterBurn = await token.balanceOf(deployer.address);
        expect(parseInt(balanceAfterBurn)).to.equal(parseInt(balanceBeforeBurn) - parseInt(ethers.utils.parseEther("1")));
    });

    it("the deployer should be able to transfer tokens", async function () {
        const balanceBeforeTransfer = await token.balanceOf(deployer.address);
        const balanceBeforeTransfer2 = await token.balanceOf(addr1.address);

        await token.transfer(addr1.address, ethers.utils.parseEther("1"));

        const balanceAfterTransfer = await token.balanceOf(deployer.address);
        const balanceAfterTransfer2 = await token.balanceOf(addr1.address);

        expect(parseInt(balanceAfterTransfer)).to.equal(parseInt(balanceBeforeTransfer) - parseInt(ethers.utils.parseEther("1")));
        expect(parseInt(balanceAfterTransfer2)).to.equal(parseInt(balanceBeforeTransfer2) + parseInt(ethers.utils.parseEther("1")));
    });

    it("the deployer should be able to approve tokens", async function () {
        const deployerAllowanceBefore = await token.allowance(deployer.address, addr1.address);
        await token.approve(addr1.address, ethers.utils.parseEther("1"));
        const deployerAllowanceAfter = await token.allowance(deployer.address, addr1.address);
        expect(parseInt(deployerAllowanceAfter)).to.equal(parseInt(deployerAllowanceBefore) + parseInt(ethers.utils.parseEther("1")));
    });


    it("should make a snapshot", async function () {

        const result = await token.snapshot();
        await result.wait();
        const snaphostid = await token.getCurrentSnapshotId();
        //mint token
        await token.mint(deployer.address, ethers.utils.parseEther("10"));

        //expect total supply to be 10 + inicial supply
        const totalSupply = await token.totalSupply();
        expect(parseInt(totalSupply)).to.equal(parseInt(ethers.utils.parseEther("10")) + parseInt(ethers.utils.parseEther(inicialSupply.toString())));
        const totalSuplySnaphot = await token.totalSupplyAt(snaphostid);
        expect(parseInt(totalSuplySnaphot)).to.equal(parseInt(ethers.utils.parseEther(inicialSupply + "")));
    });


    //test pause
    it("should pause the contract", async function () {
        const result = await token.pause();
        await result.wait();
        const paused = await token.paused();
        expect(paused).to.equal(true);

        await expect(
            token.mint(deployer.address, ethers.utils.parseEther("10"))
        ).to.be.revertedWith("Pausable: paused");

        await token.unpause();
        await token.mint(deployer.address, ethers.utils.parseEther("10"));
    });



    //test flashmint
    it("token mismatch", async function () {
        const result = await token.flashFee(token.address, ethers.utils.parseEther("10000"));
        expect(result.toString()).to.equal("0");
    });

    it("token match", async function () {
        const maxuit256 = 115792089237316195423570985008687907853269984665640563039457584007913129639935;
        const result = await token.maxFlashLoan(token.address);

        expect(parseInt(result).toString()).to.equal(maxuit256.toString());
    });


    it("borrower should be deployed", async function () {
        let name = await borrowerToken.name();
        expect(name).to.equal("borrower");
    });

    it("borrower should be able to borrow tokens", async function () {
        await token.transfer(borrowerToken.address, ethers.utils.parseEther("1"));
        await token.approve(borrowerToken.address, ethers.utils.parseEther("1"));

        let haveBorrowed = await borrowerToken.haveBorrowed();
        expect(haveBorrowed).to.equal(false);
        await token.flashLoan(borrowerToken.address, token.address, 100, '0x');
        haveBorrowed = await borrowerToken.haveBorrowed();
        expect(haveBorrowed).to.equal(true);
    });

    it("deployer should have 0 delegates", async function () {
        let delegates = await token.delegates(deployer.address);
        expect(parseInt(delegates).toString()).to.equal("0");
    });

    it("deployer should be able to delegate", async function () {
        await token.delegate(addr1.address);
        let delegates = await token.delegates(deployer.address);
        expect(delegates.toString()).to.equal(addr1.address);

    });

    it("deployer can change  delegate", async function () {
        await token.delegate(deployer.address);
        let delegates = await token.delegates(deployer.address);
        expect(delegates.toString()).to.equal(deployer.address);

        await token.delegate(addr1.address);
        delegates = await token.delegates(deployer.address);
        expect(delegates.toString()).to.equal(addr1.address);


    });

    it("get data of checkpoint", async function () {
        const recipient = addr1;
        const other1 = addr2;
        const other2 = addr3;

        await token.transfer(recipient.address, '100');
        var numCheckpoints = await token.numCheckpoints(other1.address);
        expect(numCheckpoints.toString()).to.equal("0");



        const t1 = await token.connect(recipient).delegate(other1.address);
        numCheckpoints = await token.numCheckpoints(other1.address);
        expect(numCheckpoints.toString()).to.equal('1');


        const t2 = await token.connect(recipient).transfer(other2.address, 10);
        numCheckpoints = await token.numCheckpoints(other1.address);
        expect(numCheckpoints.toString()).to.equal('2');

        const t3 = await token.connect(recipient).transfer(other2.address, 10);
        numCheckpoints = await token.numCheckpoints(other1.address);
        expect(numCheckpoints.toString()).to.equal('3');

        const t4 = await token.transfer(recipient.address, 20);
        numCheckpoints = await token.numCheckpoints(other1.address);
        expect(numCheckpoints.toString()).to.equal('4');

        let votePowerAtCheckPoint = await token.checkpoints(other1.address, 1);
        expect(votePowerAtCheckPoint[1].toString()).to.equal('90');

        votePowerAtCheckPoint = await token.checkpoints(other1.address, 2);
        expect(votePowerAtCheckPoint[1].toString()).to.equal('80');

        votePowerAtCheckPoint = await token.checkpoints(other1.address, 3);
        expect(votePowerAtCheckPoint[1].toString()).to.equal('100');

        votePowerAtCheckPoint = await token.checkpoints(other1.address, 0);
        expect(votePowerAtCheckPoint[1].toString()).to.equal('100');

    });

    it("should revert because block is not yet minted", async function () {
        await expect(token.getPastVotes(deployer.address, 5e10), 'ERC20Votes: block not yet mined');
    });

    it('returns 0 if there are no checkpoints', async function () {
        const result = await token.getPastVotes(deployer.address, 0);
        expect(result.toString()).to.equal('0');
    });
});

