const {Web3} = require('web3');
const { toWei, toChecksumAddress } = require('web3-utils');
const Tx = require('ethereumjs-tx').Transaction;
const { Transaction } = require('ethereumjs-tx');

const Common = require('ethereumjs-common').default;

const uniswapRouterABI = require('./abi/router.json');
const pairABI = require('./abi/pair.json');
const tokenABI = require('./abi/token.json');
const calcSandwichOptimalIn = require('./calculate/univ2');
const abiDecoder = require( "abi-decoder");
const { ethers } = require('ethers');

// Setup the Web3 provider
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545/'));
const wssProvider = new Web3(new Web3.providers.WebsocketProvider('ws://127.0.0.1:8545/'));

// Define your private key, the recipient's address, and the amount to send
const privateKey = Buffer.from('ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', 'hex');
const myAddress = toChecksumAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

const uniswapRouterAddress = toChecksumAddress('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D');
const uniswapPairAddress = toChecksumAddress('0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc');

// const toTokenAddress = toChecksumAddress('0xd29485c7f964c6ed2c01d2bb16af4d92bf98e185'); // The address of the token you want to receive
const toTokenAddress = toChecksumAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'); // The address of the token you want to receive
// const amountOutMin = '1'; // Minimum amount of tokens you want to receive
const ethAmount = toWei('1', 'ether'); // Amount of ETH you want to swap
const amountIn = toWei('19999999999999999', 'ether'); // Amount of tokens you want to swap

const tokenContract = new web3.eth.Contract(tokenABI, toTokenAddress);


  ///////////-------------------------------------------////////////////////
////////////   MAIN /////////////////
async function swapExactETHForTokens() {
  try {
    // Get the nonce (transaction count for the sender's address)
    const nonce = await web3.eth.getTransactionCount(myAddress);
    // Set the deadline for the swap (current time + 20 minutes)
    const deadline = Math.floor(Date.now() / 1000) + (20 * 60);
//    path for the swap: [ETH, TOKEN]
    const path = [toChecksumAddress('0xC02aaA39b223FE8D0A0e5C4F27ead9083C756Cc2'),toTokenAddress];
    // Get the Uniswap router contract
    const uniswapRouter = new web3.eth.Contract(uniswapRouterABI, uniswapRouterAddress);
    const uniswapPair = new web3.eth.Contract(pairABI, uniswapPairAddress);

    // Encode the function call data
    //getAmountOut
    const getAmountsOut = await uniswapRouter.methods.getAmountsOut(ethAmount, path).call();
    console.log("getAmountsOutlll==>", (getAmountsOut[1]));
    const amountOutMin = await slippageSet(getAmountsOut[1].toString());
    console.log("slippageAmount==>", amountOutMin );
    // const amountOutDiff = (getAmountsOut[1].toString() - amountOutMin);
    // console.log("difference==>",amountOutDiff);

    const data = await uniswapRouter.methods.swapExactETHForTokens(amountOutMin.toFixed(0), path, myAddress, deadline).encodeABI();
    // Define the transaction
    const txParamsFront = {
      nonce: web3.utils.numberToHex(nonce),
      gasPrice: web3.utils.numberToHex(web3.utils.toWei('38', 'gwei')), // Adjust as needed
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
    // console.log("thisis seralixe", web3.utils.numberToHex(ethAmount));
        //RESERVES
        const getReserves1 = await uniswapPair.methods.getReserves().call();
        console.log("Reserves AFTER FRONT-RUN  TX==>", (getReserves1));
        console.log("Reserves  TX==>", (getReserves1).toString(16));
        
    // function decimalToHexadecimal(decimalNumber) {
    //   // Ensure the input is a number
    //   if (typeof decimalNumber !== 'number') {
    //     return 'Input is not a number';
    //   }

    //   // Convert the number to hexadecimal
    //   let hexadecimalString = "0x"+ decimalNumber.toString(16).toUpperCase();

    //   return hexadecimalString;
    // }   

    const HexToString= async(num)=>{
      const number = parseInt(num, 16);
      const stringValue = number.toString();
      const simpleNumber = parseFloat(stringValue);
    return BigInt(simpleNumber);
    }
    
    /////////calcSandwichOptimalIn///////////

    console.log("ethAmountethAmount",ethers.BigNumber.from(ethAmount));
    console.log("domeeeeeeeeeeeeeee",  ethers.BigNumber.from(ethAmount));

    // decimalToHexadecimal(Number(getReserves1[0].toString())),
    // decimalToHexadecimal(Number(getReserves1[1].toString())));

   const optimalWETHValue =  await calcSandwichOptimalIn(
      ethers.BigNumber.from(ethAmount),
      (amountOutMin.toFixed(0)),
      ethers.BigNumber.from(getReserves1[0].toString()),
      ethers.BigNumber.from(getReserves1[1].toString())
    )

    console.log("optimalWETHValue==>",HexToString(optimalWETHValue._hex));
    // Sign the transaction with the private key
    tx.sign(privateKey);

    // Serialize the transaction
    const serializedTx = tx.serialize();

    // Broadcast the transaction
    const receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    console.log('Transaction receipt Front:', receipt);
    console.log('web3.eth.getBalance:==>', await web3.eth.getBalance(myAddress));
    console.log('tokenContract.methods.balanceOf==>', await tokenContract.methods.balanceOf(myAddress).call());
    
    console.log('Transaction receipt Front:', receipt?.transactionHash);
    const decodeData = await decodeTx(receipt?.transactionHash);
    console.log("decodeData=>>",decodeData);
  
  } catch (error) {
    console.error('Error swapping tokens:', error.message);
    if (error.receipt) {
      console.error('Revert reason:', error.receipt.revertReason);
    }
  }
}

swapExactETHForTokens();



const decodeTx = async(txHash)=>{
  console.log("txData=>>",txHash);

  const tx = await wssProvider.eth.getTransaction(txHash);
//  console.log("txtxtxtx=>>",tx);
// Easily decode UniswapV2 Router data
    abiDecoder.addABI(uniswapRouterABI);
      let data = null;
      try {
        // data = abiDecoder.decodeMethod(txData);
         data = abiDecoder.decodeMethod(tx.input);

      } catch (e) {
        return null;
      }
    
      if (data.name !== "swapExactETHForTokens") {
        return null;
      }
      // console.log("dataaaaaaa==>", data);
      const [amountOutMin, path, to, deadline] = data.params.map((x) => x.value);
      return {
        amountOutMin,
        path,
        to,
        deadline,
      };
};

const slippageSet = async(getAmountOut) =>{
  //we will get the minimum token amount will be accepted in this transaction
  const slippage = 10; // 10% slippage
  let amountOutMin = getAmountOut * (slippage/100 );
  amountOutMin = (getAmountOut - amountOutMin);
  return (amountOutMin);
}