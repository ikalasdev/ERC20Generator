require("@nomiclabs/hardhat-waffle");

require("dotenv").config();


module.exports = {
  solidity: "0.8.4",
  networks: {
    smartchain: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
