require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: "https://eth-mainnet.g.alchemy.com/v2/rpVDqEa0o5mXZcLT-nDYnLoiVno3B6b5",
      },
      mining: {
        mempool:{
          order:'fifo'
        },
        gas:'auto',
        // interval: 15000
      },
      chainId: 31337 ,// Custom chain ID for Hardhat's local network
      // accounts: [
      //   {
      //     privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      //     balance: '10000000000000000000000' // Set high initial balance (10,000 ETH)
      //   }
      // ]
    }
  }
};

// npx hardhat node --fork https://eth-sepolia.g.alchemy.com/v2/Y24Sxpf8kPleogZQN6nmATF6ImjvknSb