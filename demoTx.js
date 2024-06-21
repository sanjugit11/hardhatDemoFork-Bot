const {Web3} = require('web3');
const { toWei, toChecksumAddress } = require('web3-utils');
const Tx = require('ethereumjs-tx').Transaction;
const { Transaction } = require('ethereumjs-tx');

const Common = require('ethereumjs-common').default;
const { BigNumber } = require('bignumber.js');

// Setup the Web3 provider
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545/'));

// Define your private key, the recipient's address, and the amount to send
const privateKey = Buffer.from('ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', 'hex');
const privateKey1 = Buffer.from('59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', 'hex');
const myAddress = toChecksumAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
const myAddress1 = toChecksumAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');

///////----------------------------------------------/////////////
const toAddress = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
const value = toWei('1', 'ether'); // Amount to send in wei
async function sendTransaction() {
  try {
    // Get the nonce (transaction count for the sender's address)
    const nonce = await web3.eth.getTransactionCount(myAddress);
    const nonce1 = await web3.eth.getTransactionCount(myAddress1);
    // Get the gas price
    const gasPrice = await web3.eth.getGasPrice();
    // Calculate the gas fee (using a gas limit of 21000, standard for ETH transfer)
    const gasFee = new BigNumber('21000').times(gasPrice);
    // Calculate the total transaction cost
    const totalCost = new BigNumber(value).plus(gasFee);
    // Check if the account has enough funds
    const balance = new BigNumber(await web3.eth.getBalance(myAddress));
    if (balance.isLessThan(totalCost)) {
      throw new Error(`Insufficient funds. Account balance is ${balance}, but total cost is ${totalCost}`);
    }

    // Define the transaction
    const txParams = {
      nonce: web3.utils.numberToHex(nonce),
    //   gasPrice: web3.utils.numberToHex(gasPrice),
      gasPrice: web3.utils.numberToHex(web3.utils.toWei('31', 'gwei')), // Adjust as needed
      gasLimit: web3.utils.numberToHex(21000), // Standard gas limit for ETH transfer
      to: toAddress,
      value: web3.utils.numberToHex(value),
      chainId: 31337 // Use Hardhat's local network chain ID
    };

    const txParams1 = {
        nonce: web3.utils.numberToHex(nonce1),
      //   gasPrice: web3.utils.numberToHex(gasPrice),
        gasPrice: web3.utils.numberToHex(web3.utils.toWei('31', 'gwei')), // Adjust as needed
        gasLimit: web3.utils.numberToHex(21000), // Standard gas limit for ETH transfer
        to: toAddress,
        value: web3.utils.numberToHex(value),
        chainId: 31337 // Use Hardhat's local network chain ID
      };

    console.log({txParams})

    // Create a Common instance for Hardhat's local network
    const common = Common.forCustomChain(
      'mainnet',
      {
        name: 'hardhat',
        networkId: 31337,
        chainId: 31337,
      },
      'petersburg'
    );

    // Create a new transaction object
    const tx = new Transaction(txParams, { common });
    const tx1 = new Transaction(txParams1, { common });

    // Sign the transaction with the private key
    tx.sign(privateKey);
    tx1.sign(privateKey1);

    // Serialize the transaction
    const serializedTx = tx.serialize();
    const serializedTx1 = tx1.serialize();

    // Broadcast the transaction
    const receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    console.log('Transaction receipt:', receipt);
    console.log('web3.eth.getBalance:', await web3.eth.getBalance(toAddress));
    // Broadcast the transaction
    const receipt1 = await web3.eth.sendSignedTransaction('0x' + serializedTx1.toString('hex'));
    console.log('Transaction receipt:', receipt1);
    console.log('web3.eth.getBalance:',await web3.eth.getBalance(toAddress));

  } catch (error) {
    console.error('Error sending transaction:', error);
  }
}

sendTransaction();















// async function verifyContract() {
//     try {
//       const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
//       const code = await web3.eth.getCode(uniswapRouterAddress);
//       if (code === '0x') {
//         console.error('Contract not found at address:', uniswapRouterAddress);
//       } else {
//         console.log('Contract found at address:', uniswapRouterAddress);
//       }
//     } catch (error) {
//       console.error('Error fetching contract code:', error);
//     }
//   }
  
//   verifyContract();