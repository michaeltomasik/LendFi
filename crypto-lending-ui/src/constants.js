// Constants used throughout the application

// Blockchain and contract related constants
export const SUPPORTED_CHAIN_IDS = [1, 5, 11155111]; // Mainnet, Goerli, Sepolia
export const DEFAULT_CHAIN_ID = 5; // Default to Goerli testnet
export const INFURA_KEY = process.env.REACT_APP_INFURA_API_KEY || 'YOUR_INFURA_KEY';

// Contract addresses - replace with actual deployed addresses
export const CONTRACT_ADDRESSES = {
  1: {  // Mainnet
    lendingPool: '0x0000000000000000000000000000000000000000',
    tokenRegistry: '0x0000000000000000000000000000000000000000',
  },
  5: {  // Goerli
    lendingPool: '0x0000000000000000000000000000000000000000',
    tokenRegistry: '0x0000000000000000000000000000000000000000',
  },
  11155111: {  // Sepolia
    lendingPool: '0xda4955dcf01fc16a22ed470e9253dc91dd261052519c63121864e914483a2380',
    tokenRegistry: '0x0000000000000000000000000000000000000000',
  }
};

// Supported tokens for lending/borrowing
export const SUPPORTED_TOKENS = {
  1: [  // Mainnet
    { symbol: 'ETH', name: 'Ethereum', decimals: 18, address: 'native' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
    { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, address: '0x6b175474e89094c44da98b954eedeac495271d0f' },
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  ],
  5: [  // Goerli
    { symbol: 'ETH', name: 'Ethereum', decimals: 18, address: 'native' },
    { symbol: 'tWBTC', name: 'Test Wrapped Bitcoin', decimals: 8, address: '0x0000000000000000000000000000000000000000' },
    { symbol: 'tDAI', name: 'Test Dai Stablecoin', decimals: 18, address: '0x0000000000000000000000000000000000000000' },
    { symbol: 'tUSDC', name: 'Test USD Coin', decimals: 6, address: '0x0000000000000000000000000000000000000000' },
  ],
  11155111: [  // Sepolia
    { symbol: 'ETH', name: 'Ethereum', decimals: 18, address: 'native' },
    { symbol: 'tWBTC', name: 'Test Wrapped Bitcoin', decimals: 8, address: '0x0000000000000000000000000000000000000000' },
    { symbol: 'tDAI', name: 'Test Dai Stablecoin', decimals: 18, address: '0x0000000000000000000000000000000000000000' },
    { symbol: 'tUSDC', name: 'Test USD Coin', decimals: 6, address: '0x0000000000000000000000000000000000000000' },
  ]
};

// UI related constants
export const MAX_BORROW_LIMIT_PERCENTAGE = 80; // Maximum borrow limit as percentage of collateral
export const HEALTH_FACTOR_WARNING_THRESHOLD = 1.1; // Warning threshold for health factor
export const DEFAULT_FIXED_DECIMALS = 2; // Default number of decimals to display

// Error messages
export const ERROR_MESSAGES = {
  CONNECT_WALLET: 'Please connect your wallet',
  UNSUPPORTED_NETWORK: 'Please switch to a supported network',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
};

// Time constants
export const SECONDS_PER_YEAR = 31536000;
export const SECONDS_PER_DAY = 86400; 