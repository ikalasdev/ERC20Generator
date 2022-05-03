require("@nomiclabs/hardhat-waffle");

require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");


module.exports = {
  solidity: "0.8.4",
  networks: {
    smartchain: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts: [process.env.PRIVATE_KEY]
    },
    mainetbsc: {
      url: `https://bsc-dataseed.binance.org/`,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.API_KEY
  }
};
