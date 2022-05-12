require("@nomiclabs/hardhat-waffle");

require("dotenv").config();


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
    },
    polygon: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/KBBUDl6m0-m8bWd3GGWU-eniZKy1elh4`,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
