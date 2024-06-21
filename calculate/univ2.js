const { ethers } =require ("ethers");
const { parseUnits } = require ("@ethersproject/units");

const BN_18 = parseUnits("1");

const getUniv2DataGivenIn = (aIn, reserveA, reserveB) => {
  const aInWithFee = aIn.mul(997);
  const numerator = aInWithFee.mul(reserveB);
  const denominator = aInWithFee.add(reserveA.mul(1000));
  const bOut = numerator.div(denominator);

  // Underflow
  let newReserveB = reserveB.sub(bOut);
  if (newReserveB.lt(0) || newReserveB.gt(reserveB)) {
    newReserveB = ethers.BigNumber.from(1);
  }

  // Overflow
  let newReserveA = reserveA.add(aIn);
  if (newReserveA.lt(reserveA)) {
    newReserveA = ethers.constants.MaxInt256;
  }

  return {
    amountOut: bOut,
    newReserveA,
    newReserveB,
  };
};

/*
  Binary search to find optimal sandwichable amount

  Using binary search here as the profit function isn't normally distributed
*/
 const binarySearch = (
  left, // Lower bound
  right, // Upper bound
  calculateF, // Generic calculate function
  passConditionF, // Condition checker
  tolerance = parseUnits("0.01") // Tolerable delta (in %, in 18 dec, i.e. parseUnits('0.01') means left and right delta can be 1%)
) => {
  if (right.sub(left).gt(tolerance.mul(right.add(left).div(2)).div(BN_18))) {
    const mid = right.add(left).div(2);
    const out = calculateF(mid);

    // If we pass the condition
    // Number go up
    if (passConditionF(out)) {
      return binarySearch(mid, right, calculateF, passConditionF, tolerance);
    }

    // Number go down
    return binarySearch(left, mid, calculateF, passConditionF, tolerance);
  }

  // No negatives
  const ret = right.add(left).div(2);
  if (ret.lt(0)) {
    return ethers.constants.Zero;
  }

  return ret;
};

/*
  Calculate the max sandwich amount
*/

function calcSandwichOptimalIn (
  userAmountIn,
  userMinRecvToken,
  reserveWeth,
  reserveToken
) {
  // Note that user is going from WETH -> TOKEN
  // So, we'll be pushing the price of TOKEn
  // by swapping WETH -> TOKEN before the user
  // i.e. Ideal tx placement:
  // 1. (Ours) WETH -> TOKEN (pushes up price)
  // 2. (Victim) WETH -> TOKEN (pushes up price more)
  // 3. (Ours) TOKEN -> WETH (sells TOKEN for slight WETH profit)
  const calcF = (amountIn) => {
    const frontrunState = getUniv2DataGivenIn(
      amountIn,
      reserveWeth,
      reserveToken
    );
    const victimState = getUniv2DataGivenIn(
      userAmountIn,
      frontrunState.newReserveA,
      frontrunState.newReserveB
    );
    // console.log("victimState",victimState);
    return victimState.amountOut;
  };

  // Our binary search must pass this function
  // i.e. User must receive at least min this
  const passF = (amountOut) =>{
    console.log("amountOutlllllllllllllllllll",HexToString(amountOut._hex));
    console.log("userMinRecvToken",HexToString(userMinRecvToken));
    console.log("amountOut.gte(userMinRecvToken)",amountOut.gte(userMinRecvToken));
    amountOut.gte(userMinRecvToken);
  } 

  // Lower bound will be 0
  // Upper bound will be 100 ETH (hardcoded, or however much ETH you have on hand)
  // Feel free to optimize and change it
  // It shouldn't be hardcoded hehe.....
  const lowerBound = parseUnits("0");
  const upperBound = parseUnits("10");

  // Optimal WETH in to push reserve to the point where the user
  // _JUST_ receives their min recv
  console.log("calcF",calcF);
  const optimalWethIn = binarySearch(lowerBound, upperBound, calcF, passF);
  
  return optimalWethIn;
};

 const calcSandwichState = (
  optimalSandwichWethIn,
  userWethIn,
  userMinRecv,
  reserveWeth,
  reserveToken
) => {
  const frontrunState = getUniv2DataGivenIn(
    optimalSandwichWethIn,
    reserveWeth,
    reserveToken
  );
  const victimState = getUniv2DataGivenIn(
    userWethIn,
    frontrunState.newReserveA,
    frontrunState.newReserveB
  );
  const backrunState = getUniv2DataGivenIn(
    frontrunState.amountOut,
    victimState.newReserveB,
    victimState.newReserveA
  );

  // Sanity check
  if (victimState.amountOut.lt(userMinRecv)) {
    return null;
  }

  // Return
  return {
    // NOT PROFIT
    // Profit = post gas
    revenue: backrunState.amountOut.sub(optimalSandwichWethIn),
    optimalSandwichWethIn,
    userAmountIn: userWethIn,
    userMinRecv,
    reserveState: {
      reserveWeth,
      reserveToken,
    },
    frontrun: frontrunState,
    victim: victimState,
    backrun: backrunState,
  };
};


const HexToString= async(num)=>{
  const number = parseInt(num, 16);
  const stringValue = number.toString();
  const simpleNumber = parseFloat(stringValue);
return (simpleNumber);
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

  // Export the function
module.exports = calcSandwichOptimalIn;