const {Web3} = require('web3');
const { toWei, toChecksumAddress } = require('web3-utils');
const Tx = require('ethereumjs-tx').Transaction;
const { Transaction } = require('ethereumjs-tx');

const Common = require('ethereumjs-common').default;

const uniswapRouterABI = require('./abi/router.json');
const pairABI = require('./abi/pair.json');
const tokenABI = require('./abi/token.json');

// Setup the Web3 provider
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545/'));

// Define your private key, the recipient's address, and the amount to send
const privateKey = Buffer.from('ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', 'hex');
const privateKey1 = Buffer.from('59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', 'hex');
const myAddress = toChecksumAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
const myAddress1 = toChecksumAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
const uniswapRouterAddress = toChecksumAddress('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D');
const uniswapPairAddress = toChecksumAddress('0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc');

const toTokenAddress = toChecksumAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'); // The address of the token you want to receive
const amountOutMin = '1'; // Minimum amount of tokens you want to receive
// const amountOutMin1 = '3400000000'; // Minimum amount of tokens you want to receive
const ethAmount = toWei('1', 'ether'); // Amount of ETH you want to swap
const ethAmount1 = toWei('1', 'ether'); // Amount of ETH you want to swap
const AprroveamountIn = toWei('199999999999999999999999999999999999999999999', 'ether'); // Amount of tokens you want to swap
const eth1Amount = toWei('1', 'ether'); // Amount of ETH TO GETamountout

const tokenContract = new web3.eth.Contract(tokenABI, toTokenAddress);
const uniswapRouter = new web3.eth.Contract(uniswapRouterABI, uniswapRouterAddress);
const uniswapPair = new web3.eth.Contract(pairABI, uniswapPairAddress);

async function approveToken(spender, amount) {
    try {
      const data = tokenContract.methods.approve(spender, amount).encodeABI();
      const nonce = await web3.eth.getTransactionCount(myAddress);
  
      const txParams = {
        nonce: web3.utils.numberToHex(nonce),
        gasPrice: web3.utils.numberToHex(web3.utils.toWei('14', 'gwei')), // Adjust as needed
        gasLimit: web3.utils.numberToHex(100000), // Adjust as needed
        to: toTokenAddress,
        value: '0x0',
        data: data,
        chainId: 31337 // Hardhat network chain ID
      };
  
      const common = Common.forCustomChain(
        'mainnet',
        {
          name: 'hardhat',
          networkId: 31337,
          chainId: 31337,
        },
        'petersburg'
      );
  
      const tx = new Transaction(txParams, { common });
      tx.sign(privateKey);
      const serializedTx = tx.serialize();
  
      const receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    //   console.log('Approve transaction receipt:', receipt);
    //   console.log('tokenContract.allownace==>', await tokenContract.methods.allowance(myAddress,uniswapRouterAddress).call());

    } catch (error) {
      console.error('Error approving token:', error);
    }
  }

  async function swapExactTokensForETH() {
    try {
      // Approve tokens
      await approveToken(uniswapRouterAddress, AprroveamountIn);
  
      const nonce = await web3.eth.getTransactionCount(myAddress);
  
      // Get the Uniswap router contract
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
      const sellAmount = await tokenContract.methods.balanceOf(myAddress).call();

      // Encode the function call data
        const data = uniswapRouter.methods.swapExactTokensForETH(
            // amountIn,
            BigInt(sellAmount),
            amountOutMin,
            [toTokenAddress, toChecksumAddress('0xC02aaA39b223FE8D0A0e5C4F27ead9083C756Cc2')],
            myAddress,
            deadline).encodeABI();
  
      const txParams = {
        nonce: web3.utils.numberToHex(nonce),
        gasPrice: web3.utils.numberToHex(web3.utils.toWei('14', 'gwei')), // Adjust as needed
        gasLimit: web3.utils.numberToHex(300000), // Adjust as needed
        to: uniswapRouterAddress,
        value: '0x0',
        data: data,
        chainId: 31337 // Hardhat network chain ID
      };
  
      const common = Common.forCustomChain(
        'mainnet',
        {
          name: 'hardhat',
          networkId: 31337,
          chainId: 31337,
        },
        'petersburg'
      );
  
      const tx = new Transaction(txParams, { common });
      tx.sign(privateKey);
      const serializedTx = tx.serialize();
  
      const receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    //   console.log('Swap transaction Backrun receipt:', receipt);
      console.log('web3.eth.getBalance:==>', await web3.eth.getBalance(myAddress));
      console.log('backrun token Balance ==>', await tokenContract.methods.balanceOf(myAddress).call());
    } catch (error) {
      console.error('Error swapping tokens:', error);
    }
  }
  
  ///////////-------------------------------------------////////////////////
////////////   MAIN /////////////////
async function swapExactETHForTokens() {
  try {
    // Get the nonce (transaction count for the sender's address)
    const nonce = await web3.eth.getTransactionCount(myAddress);
    // Set the deadline for the swap (current time + 20 minutes)
    const deadline = Math.floor(Date.now() / 1000) + (20 * 60);
    
//     // Get the gas price
    // const gasPrice = await web3.eth.getGasPrice();
//    path for the swap: [ETH, TOKEN]
    const path = [
      toChecksumAddress('0xC02aaA39b223FE8D0A0e5C4F27ead9083C756Cc2'), // WETH address
      toTokenAddress
    ];

    // Get the Uniswap router contract
    const getAmountsOut = await uniswapRouter.methods.getAmountsOut(eth1Amount, path).call();
    console.log("initial price per ETH==>", (getAmountsOut[1]));
    const getReserves = await uniswapPair.methods.getReserves().call();
    console.log("initial Reserves==>", (getReserves));

    // Encode the function call data
    const data = await uniswapRouter.methods.swapExactETHForTokens(amountOutMin, path, myAddress, deadline).encodeABI();

    // Define the transaction
    const txParamsFront = {
      nonce: web3.utils.numberToHex(nonce),
    //   gasPrice: web3.utils.numberToHex(gasPrice), // Adjust as needed
      gasPrice: web3.utils.numberToHex(web3.utils.toWei('14', 'gwei')), // Adjust as needed
      gasLimit: web3.utils.numberToHex(300000), // Increase gas limit
      to: uniswapRouterAddress,
      value: web3.utils.numberToHex(ethAmount), // Amount of ETH to swap
      data: data,
      chainId: 31337 // hardhat ID
    };


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
    const tx = new Transaction(txParamsFront, { common });

    // Sign the transaction with the private key
    tx.sign(privateKey);

    // Serialize the transaction
    const serializedTx = tx.serialize();

    // Broadcast the transaction
    const receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    console.log('Transaction receipt Front:', receipt);
    console.log('web3.eth.getBalance:==>', await web3.eth.getBalance(myAddress));
    console.log('tokenContract.methods.balanceOf==>', await tokenContract.methods.balanceOf(myAddress).call());
    //RESERVES
    const getReserves1 = await uniswapPair.methods.getReserves().call();
    console.log("Reserves AFTER FRONT-RUN  TX==>", (getReserves1));

    console.log('---------------------------------------------------------------------------------------------');
    const getAmountsOut1 = await uniswapRouter.methods.getAmountsOut(eth1Amount, path).call();
    console.log("after FRONT-RUN TX==>", (getAmountsOut1[1]));
    console.log('---------------------------------------------------------------------------------------------');
   
    ////////////////////// VICTIM ///////////////////////////////
      const nonce1 = await web3.eth.getTransactionCount(myAddress1);
      const amountOutMinimum = await slippageDeductedAmount(getAmountsOut1[1].toString());
    //   console.log("amountOutMinimum==>", (amountOutMinimum));
      const data1 = await uniswapRouter.methods.swapExactETHForTokens(amountOutMinimum, path, myAddress1, deadline).encodeABI();

      // Define the transaction
      const txParamsVictim = {
          nonce: web3.utils.numberToHex(nonce1),
          //   gasPrice: web3.utils.numberToHex(gasPrice), // Adjust as needed
          gasPrice: web3.utils.numberToHex(web3.utils.toWei('14', 'gwei')), // Adjust as needed
          gasLimit: web3.utils.numberToHex(300000), // Increase gas limit
          to: uniswapRouterAddress,
          value: web3.utils.numberToHex(ethAmount1), // Amount of ETH to swap
          data: data1,
          chainId: 31337 // hardhat ID
      };

      const tx1 = new Transaction(txParamsVictim, { common });
      tx1.sign(privateKey1);
      const serializedTx1 = tx1.serialize();

      // Broadcast the transaction
      //VICTIM TX
      const receipt1 = await web3.eth.sendSignedTransaction('0x' + serializedTx1.toString('hex'));
      console.log('Transaction receipt Victim:', receipt1);
      console.log('web3.eth.getBalance:==>', await web3.eth.getBalance(myAddress1));
      console.log('tokenContract.methods.balanceOf==>', await tokenContract.methods.balanceOf(myAddress1).call());

      console.log('---------------------------------------------------------------------------------------------');
      const getAmountsOut2 = await uniswapRouter.methods.getAmountsOut(eth1Amount, path).call();
      console.log("after VICTIM TX==>", (getAmountsOut2[1]));
      console.log('---------------------------------------------------------------------------------------------');
   
    //BACKRUN TX
    await swapExactTokensForETH();

    console.log('---------------------------------------------------------------------------------------------');
    const getAmountsOut3 = await uniswapRouter.methods.getAmountsOut(eth1Amount, path).call();
    console.log("after BACKRUN TX==>", (getAmountsOut3[1]));
    console.log('---------------------------------------------------------------------------------------------');

  } catch (error) {
    console.error('Error swapping tokens:', error.message);
    if (error.receipt) {
      console.error('Revert reason:', error.receipt.revertReason);
    }
  }
}

swapExactETHForTokens();


const slippageDeductedAmount = async(getAmountOut) =>{
    //we will get the minimum token amount will be accepted in this transaction
    const slippage = 3; // 10% slippage
    let amountOutMin = getAmountOut * (slippage/100 );
     amountOutMin = (getAmountOut - amountOutMin).toFixed(0);
    return (amountOutMin);
  }