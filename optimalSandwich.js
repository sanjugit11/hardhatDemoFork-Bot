const {Web3} = require('web3');
const { toWei, toChecksumAddress } = require('web3-utils');
const Tx = require('ethereumjs-tx').Transaction;
const { Transaction } = require('ethereumjs-tx');
const { ethers } = require('ethers');

const Common = require('ethereumjs-common').default;

const uniswapRouterABI = require('./abi/router.json');
const pairABI = require('./abi/pair.json');
const tokenABI = require('./abi/token.json');
const calcSandwichOptimalIn = require('./calculate/univ2');

// Setup the Web3 provider
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545/'));

// Define your private key, the recipient's address, and the amount to send
const privateKey = Buffer.from('ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', 'hex');
const privateKey1 = Buffer.from('5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', 'hex');
const myAddress = toChecksumAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
const myAddress1 = toChecksumAddress('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
const uniswapRouterAddress = toChecksumAddress('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D');
//PAIR
const uniswapPairAddress = toChecksumAddress('0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc'); //  weth usdc pair
// const uniswapPairAddress = toChecksumAddress('0x872212d0f426862b44e1448ddb91ad9e8772f4a8');
// const uniswapPairAddress = toChecksumAddress('0x9349851c60b1e843cc32d5ca4fb836e9637086e9');
//TOKEN
const toTokenAddress = toChecksumAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'); //USDC The address of the token 
// const toTokenAddress = toChecksumAddress('0xb60FDF036F2ad584f79525B5da76C5c531283A1B'); // The address of the token 
// const toTokenAddress = toChecksumAddress('0x5c2aA685a0b07Fb22bced54b08778d91bece7511'); // The address of the token 
const eth1Amount = toWei('1', 'ether'); // Amount of ETH TO GETamountout
const amountOutMinToken = '1'; // Minimum amount of tokens you want to receive
const ethVictimAmount = toWei('0.1', 'ether'); // Amount of ETH you want to swap
const ethFrontRunAmount = toWei('2', 'ether'); // Amount of ETH you want to swap
const AprroveamountIn = toWei('199999999999999999999999999999999999999999999', 'ether'); // Amount of tokens you want to swap
//instances
const tokenContract = new web3.eth.Contract(tokenABI, toTokenAddress);
const uniswapPair = new web3.eth.Contract(pairABI, uniswapPairAddress);
const uniswapRouter = new web3.eth.Contract(uniswapRouterABI, uniswapRouterAddress);

  async function approveToken(spender, amount) {
    try {
      const data = tokenContract.methods.approve(spender, amount).encodeABI();
      const nonce = await web3.eth.getTransactionCount(myAddress1);

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
      tx.sign(privateKey1);
      const serializedTx = tx.serialize();

      const receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
      //   console.log('Approve transaction receipt:', receipt);
      console.log('tokenContract.allownace==>', await tokenContract.methods.allowance(myAddress1, uniswapRouterAddress).call());

    } catch (error) {
      console.error('Error approving token:', error);
    }
  }

  async function swapExactTokensForETH() {
    try {
      // Approve tokens
      await approveToken(uniswapRouterAddress, AprroveamountIn);

      const nonce = await web3.eth.getTransactionCount(myAddress1);

      // Get the Uniswap router contract
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
      const sellAmount = await tokenContract.methods.balanceOf(myAddress1).call();
      console.log("sellAmount==>", sellAmount);
      // Encode the function call data
      const data = uniswapRouter.methods.swapExactTokensForETH(
        // amountIn,
        BigInt(sellAmount),
        amountOutMinToken,
        [toTokenAddress, toChecksumAddress('0xC02aaA39b223FE8D0A0e5C4F27ead9083C756Cc2')],
        myAddress1,
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
      tx.sign(privateKey1);
      const serializedTx = tx.serialize();

      const receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
      //   console.log('Swap transaction Backrun receipt:', receipt);
      console.log('web3.eth.getBalance:==>', await web3.eth.getBalance(myAddress1));
      console.log('backrun token Balance ==>', await tokenContract.methods.balanceOf(myAddress1).call());
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
    
   // path for the swap: [ETH, TOKEN]
    const path = [
      toChecksumAddress('0xC02aaA39b223FE8D0A0e5C4F27ead9083C756Cc2'), // WETH address
      toTokenAddress
    ];
    console.log('web3.eth.getBalance:==>', await web3.eth.getBalance(myAddress1));
    console.log('tokenContract.methods.balanceOf==>', await tokenContract.methods.balanceOf(myAddress1).call());
    const getReservesFirst = await uniswapPair.methods.getReserves().call();
    console.log("Reserves First==>", (getReservesFirst));
    const getAmountsOutForVictim = await uniswapRouter.methods.getAmountsOut(ethVictimAmount, path).call();
    console.log('getAmountsOutForVictim==>',getAmountsOutForVictim);
    const victimAmountOutMinimum = await slippageDeductedAmount(getAmountsOutForVictim[1].toString(),10);  //10 slippage for victim
    console.log('After slippage deduction victim amount Minimum==>',(victimAmountOutMinimum));

    // Encode the function call data
    const data = await uniswapRouter.methods.swapExactETHForTokens(amountOutMinToken, path, myAddress, deadline).encodeABI();

    // Define the transaction
    const txParamsVictim = {
      nonce: web3.utils.numberToHex(nonce),
      gasPrice: web3.utils.numberToHex(web3.utils.toWei('14', 'gwei')), // Adjust as needed
      gasLimit: web3.utils.numberToHex(300000), // Increase gas limit
      to: uniswapRouterAddress,
      value: web3.utils.numberToHex(ethVictimAmount), // Amount of ETH to swap
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
      const tx = new Transaction(txParamsVictim, { common });

      /////optimalWETHValue
      const getReserves = await uniswapPair.methods.getReserves().call();
      // Sign the transaction with the private key
      tx.sign(privateKey);

      // Serialize the transaction
      const serializedTx = tx.serialize();

      ///---------get optimal value for frontrun-------/////
      //get optimal value to swap based  on  victim TXN
      // console.log("lllllllllllllll",ethVictimAmount,
      //   (victimAmountOutMinimum),
      //    getReserves[0].toString(),
      //   (getReserves[1].toString()))

      const finalOptimalValue = await calcSandwichOptimalIn(
        ethers.BigNumber.from(ethVictimAmount),
        (victimAmountOutMinimum),
        ethers.BigNumber.from(getReserves[0].toString()),
        ethers.BigNumber.from(getReserves[1].toString())
        )

        //--------////////////////////// front run ///////////////////////////////-------------
          console.log('-------------------------------TXN reach to Front RUN ---------------------------------------');
          const getAmountsOut1 = await uniswapRouter.methods.getAmountsOut(eth1Amount, path).call();
          console.log("Before FRONT-RUN TX price perETH==>", (getAmountsOut1[1]));
          console.log('---------------------------------------------------------------------------------------------');

          const nonce1 = await web3.eth.getTransactionCount(myAddress1);
          const optimalAmountForSwap = await HexToString(finalOptimalValue._hex) //hex to sting the mimnimum value
          console.log("finalOptimalValuetoswap for frontrun ==>", optimalAmountForSwap)
          const getAmountsOut11 = await uniswapRouter.methods.getAmountsOut(optimalAmountForSwap, path).call();
          console.log("getAmountsOut11==>", getAmountsOut11)
          const frontAmountOutMinimum = await slippageDeductedAmount(getAmountsOut11[1].toString(), 3);
          console.log("slippage Deducted Amountfor Frontrun==>", (frontAmountOutMinimum));
          const data1 = await uniswapRouter.methods.swapExactETHForTokens(frontAmountOutMinimum, path, myAddress1, deadline).encodeABI();

          // Define the transactionethVictimAmount
          const txParamsFront = {
            nonce: web3.utils.numberToHex(nonce1),
            gasPrice: web3.utils.numberToHex(web3.utils.toWei('14', 'gwei')), // Adjust as needed
            gasLimit: web3.utils.numberToHex(300000), // Increase gas limit
            to: uniswapRouterAddress,
            value: web3.utils.numberToHex(optimalAmountForSwap), // Amount of ETH to swap
            data: data1,
            chainId: 31337 // hardhat ID
          };

          const tx1 = new Transaction(txParamsFront, { common });
          tx1.sign(privateKey1);
          const serializedTx1 = tx1.serialize();

          // Broadcast the transaction  front run
          // FRONTRUN TX
          const receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx1.toString('hex'));
          // console.log('Transaction receipt Front:', receipt);
          console.log('web3.eth.getBalance:==>', await web3.eth.getBalance(myAddress1));
          console.log('tokenContract.methods.balanceOf==>', await tokenContract.methods.balanceOf(myAddress1).call());
          //RESERVES
          console.log('--------------------------AFTER FRONT-RUN  TX---------------------------------------------');
          const getAmountsOut = await uniswapRouter.methods.getAmountsOut(eth1Amount, path).call();
          console.log("After FRONT-RUN TX price perETH==>", (getAmountsOut[1]));
          const getReserves1 = await uniswapPair.methods.getReserves().call();
          console.log("Reserves AFTER FRONT-RUN TX DONE==>", (getReserves1));
          console.log('---------------------------------------------------------------------------------------------');

      // Broadcast the transaction Victim 
      //VICTIM TX
      const receipt1 = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
      // console.log('Transaction receipt Victim:', receipt1);
      console.log('web3.eth.getBalance:==>', await web3.eth.getBalance(myAddress1));
      console.log('tokenContract.methods.balanceOf==>', await tokenContract.methods.balanceOf(myAddress1).call());

      console.log('---------------------------after VICTIM TX-------------------------------');
      const getAmountsOut2 = await uniswapRouter.methods.getAmountsOut(eth1Amount, path).call();
      console.log("after VICTIM TX price perETH==>", (getAmountsOut2[1]));
      console.log('---------------------------------------------------------------------------------------------');
   
    //BACKRUN TX
    await swapExactTokensForETH();
    console.log('-------------------------------after BACKRUN TX----------------------------------------');
    const getAmountsOut3 = await uniswapRouter.methods.getAmountsOut(eth1Amount, path).call();
    console.log("after BACKRUN TX price perETH==>", (getAmountsOut3[1]));
    console.log('---------------------------------------------------------------------------------------------');

  } catch (error) {
    console.error('Error swapping tokens:', error.message);
    if (error.receipt) {
      console.error('Revert reason:', error.receipt.revertReason);
    }
  }
}

swapExactETHForTokens();


const slippageDeductedAmount = async(getAmountOut,slippage) =>{
  // console.log("slippageDeductedAmount===>:",getAmountOut,slippage)
    //we will get the minimum token amount will be accepted in this transaction
    let amountOutMin = ((getAmountOut * (slippage/100 )));
    amountOutMin = exponentialToDecimal(amountOutMin);
    amountOutMin =((getAmountOut - amountOutMin));
    // console.log("slippageDeductedAmount:",(amountOutMin))
    amountOutMin = exponentialToDecimal(amountOutMin);
    return (amountOutMin);
  }

  const HexToString= async(num)=>{
    const number = parseInt(num, 16);
    const stringValue = number.toString();
    let simpleNumber = parseFloat(stringValue);
  //   console.log("simpleNumber==>",simpleNumber);
  //  console.log("simpleNumber==>",BigInt(simpleNumber).toString());
  return BigInt(simpleNumber).toString();
  }

  const exponentialToDecimal = (exponential) => {
    if (exponential) {
        let decimal = exponential.toString().toLowerCase();
        if (decimal.includes('e+')) {
            const exponentialSplitted = decimal.split('e+');
            let postfix = '';
            for (
                let i = 0; i <
                +exponentialSplitted[1] -
                (exponentialSplitted[0].includes('.') ? exponentialSplitted[0].split('.')[1].length : 0); i++
            ) {
                postfix += '0';
            }
            decimal = exponentialSplitted[0].replace('.', '') + postfix;
        }
        if (decimal.toLowerCase().includes('e-')) {
            const exponentialSplitted = decimal.split('e-');
            let prefix = '0.';
            for (let i = 0; i < +exponentialSplitted[1] - 1; i++) {
                prefix += '0';
            }
            decimal = prefix + exponentialSplitted[0].replace('.', '');
        }
        // Remove any decimals by taking only the integer part
        decimal = decimal.split('.')[0];
        return decimal;
    }
    return null;
};