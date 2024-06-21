// Function to convert decimal to hexadecimal
function decimalToHexadecimal(decimalNumber) {
  // Ensure the input is a number
  if (typeof decimalNumber !== 'number') {
      return 'Input is not a number';
  }

  // Convert the number to hexadecimal
  let hexadecimalString = decimalNumber.toString(16).toUpperCase();

  return hexadecimalString;
}

function main (){
  // Example usage
  let decimalNumber = 3157101183;
  let hexadecimalString = "0x" + decimalToHexadecimal(decimalNumber);
  console.log(`Decimal: ${decimalNumber} -> Hexadecimal: ${hexadecimalString}`); // Output: Decimal: 255 -> Hexadecimal: FF
}

// main();

const HexToString= async()=>{
  const number = parseInt("0x0327d603c450a9ac09bc", 16);
  const stringValue = number.toString();
  // console.log("HexToString=>",stringValue);
  const simpleNumber = parseFloat(stringValue);
// Convert the number to a string without scientific notation
// const formattedNumber = simpleNumber.toString().replace('.', '').replace('e+', 'e');
// console.log((formattedNumber));
console.log(BigInt(simpleNumber).toString());
}

HexToString();