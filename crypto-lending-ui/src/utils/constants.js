// Contract addresses - update these with your deployed contract addresses
export const LENDING_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual deployed address
export const COLLATERAL_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with ERC20 token address
export const BORROWABLE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with ERC20 token address

// Network settings
export const SUPPORTED_CHAIN_IDS = [1, 5, 11155111]; // Mainnet, Goerli, Sepolia
export const DEFAULT_CHAIN_ID = 5; // Goerli testnet as default

// DApp Settings
export const APP_NAME = "Crypto Lending Platform";
export const INFURA_KEY = "YOUR_INFURA_KEY"; // Replace with your actual Infura key

// Token Decimals
export const TOKEN_DECIMALS = 18;

// UI Constants
export const LTV_RATIO = 0.8; // 80% Loan-to-Value ratio
export const DEFAULT_REPAYMENT_PERIOD = 30; // 30 days

// Function to format token amounts for display
export const formatTokenAmount = (amount, decimals = TOKEN_DECIMALS) => {
  if (!amount) return "0";
  
  // Convert from wei to ether
  const etherValue = Number(amount) / (10 ** decimals);
  
  // Format the number with commas and limit decimal places
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0
  }).format(etherValue);
};

// Network names
export const NETWORK_NAMES = {
  1: "Ethereum Mainnet",
  5: "Goerli Testnet",
  11155111: "Sepolia Testnet"
};

// URLs for network explorers
export const EXPLORER_URLS = {
  1: "https://etherscan.io",
  5: "https://goerli.etherscan.io",
  11155111: "https://sepolia.etherscan.io"
};