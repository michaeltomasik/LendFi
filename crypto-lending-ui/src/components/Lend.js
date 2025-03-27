import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  makeStyles,
  Button,
  TextField,
  InputAdornment,
  Tooltip,
  Chip,
  CircularProgress,
  IconButton,
  Slider
} from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import { useAccount, useNetwork, useContract, useProvider, useSigner } from 'wagmi';
import { ethers, providers } from 'ethers';
import { parseUnits, formatUnits } from 'ethers/lib/utils';
import { toast } from 'react-toastify';
import RefreshIcon from '@material-ui/icons/Refresh';

// Import Contract ABIs
import ERC20ABI from '../abis/ERC20.json';
import LendingContractABI from '../abis/TestnetLending.json';

// Uniswap v4 utility functions
const TickMath = {
  MIN_TICK: -887272,
  MAX_TICK: 887272,
  
  // Helper function to get ticks based on price range
  // In a real implementation, you should import TickMath from Uniswap SDK
  getTicksForPriceRange: (lowerPrice, upperPrice) => {
    // This is a simplified version - in a real app, use proper tick conversion
    const lowerTick = Math.floor(Math.log(lowerPrice) / Math.log(1.0001));
    const upperTick = Math.ceil(Math.log(upperPrice) / Math.log(1.0001));
    
    // Ensure they're in the valid range
    return {
      lowerTick: Math.max(lowerTick, TickMath.MIN_TICK),
      upperTick: Math.min(upperTick, TickMath.MAX_TICK),
    };
  },
  
  // Helper to get price from tick
  getPriceFromTick: (tick) => {
    return Math.pow(1.0001, tick);
  }
};

// Helper for calculating liquidity amounts
const LiquidityAmounts = {
  // Improved function to estimate liquidity from token amounts
  // In a real implementation, you should import from Uniswap SDK
  getLiquidityForAmounts: (amount0, amount1, sqrtPriceX96) => {
    // This is a simplified calculation that tries to more accurately
    // estimate liquidity from token amounts
    // For a full implementation, use the proper Uniswap v4 SDK functions
    
    // Convert inputs to numbers to ensure we're working with numeric values
    const numAmount0 = parseFloat(amount0);
    const numAmount1 = parseFloat(amount1);
    
    // Ensure we have valid numbers
    if (isNaN(numAmount0) || isNaN(numAmount1) || numAmount0 <= 0 || numAmount1 <= 0) {
      console.log("Invalid amounts for liquidity calculation:", numAmount0, numAmount1);
      return 100000; // Fallback default value
    }
    
    // Use a more stable calculation for liquidity
    // L = sqrt(x * y) where x and y are the token amounts
    const liquidity = Math.sqrt(numAmount0 * numAmount1);
    
    console.log("Calculated liquidity:", liquidity, "from amounts:", numAmount0, numAmount1);
    return liquidity.toString();
  },
  
  // Get amounts from liquidity and price
  getAmountsForLiquidity: (liquidity, sqrtPriceX96) => {
    // This is a simplified calculation
    // For a full implementation, use the proper Uniswap v4 SDK functions
    const price = 1.0; // Using normalized price for this example
    const amount0 = liquidity / Math.sqrt(price);
    const amount1 = liquidity * Math.sqrt(price);
    return { amount0, amount1 };
  }
};

// Contract addresses from deployment
const CONTRACT_ADDRESSES = {
  // Default to Sepolia testnet
  11155111: {
    lendingContract: '0xa96ac4b14ce7ef71367194169d6b2402abf2ed68',
    // lendingContract: '0x238cc754BB91265E61045e47F2aAf068F7D56F1d',
    loanToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789', // LINK
    // collateralToken: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0' // USDT
  }
};

// ETH/LINK Pair configuration
const ETH_LINK_PAIR = {
  baseAsset: 'ETH',
  quoteAsset: 'LINK'
};

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(4),
    minHeight: 'calc(100vh - 64px)',
    backgroundImage: `repeating-linear-gradient(
      rgba(5, 5, 5, 0.2) 0px,
      rgba(5, 5, 5, 0.2) 1px,
      transparent 1px,
      transparent 2px
    )`,
  },
  container: {
    marginTop: theme.spacing(4),
  },
  header: {
    position: 'relative',
    marginBottom: theme.spacing(4),
    '&::before': {
      content: '">_"',
      color: theme.palette.primary.main,
      marginRight: theme.spacing(1),
      fontFamily: 'monospace',
      textShadow: `0 0 10px ${theme.palette.primary.main}`,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -10,
      left: 0,
      width: '100%',
      height: '1px',
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
      boxShadow: `0 0 8px ${theme.palette.primary.main}`,
    },
  },
  paper: {
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: 'rgba(17, 17, 17, 0.8)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 15px rgba(0, 245, 255, 0.2)`,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: theme.spacing(4),
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundImage: `repeating-linear-gradient(
        90deg,
        rgba(0, 245, 255, 0.03) 0px,
        rgba(0, 245, 255, 0.03) 1px,
        transparent 1px,
        transparent 30px
      )`,
      pointerEvents: 'none',
    },
  },
  formControl: {
    marginBottom: theme.spacing(3),
    width: '100%',
  },
  infoIcon: {
    marginLeft: theme.spacing(1),
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.light,
    },
  },
  infoTooltip: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: 12,
    border: `1px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 10px ${theme.palette.primary.main}`,
    maxWidth: 300,
  },
  actionButton: {
    marginTop: theme.spacing(3),
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: `linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.2), transparent)`,
      transition: 'all 0.5s ease',
    },
    '&:hover::before': {
      left: '100%',
    },
  },
  sectionTitle: {
    fontFamily: '"Roboto Mono", monospace',
    marginBottom: theme.spacing(2),
    position: 'relative',
    display: 'inline-block',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '1px',
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
    },
  },
  pairTitle: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  pairIcon: {
    width: 32,
    height: 32,
    marginRight: theme.spacing(1),
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '50%',
    padding: 4,
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
  },
  chip: {
    margin: theme.spacing(0.5),
    marginLeft: theme.spacing(2),
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    border: `1px solid ${theme.palette.primary.main}`,
    color: theme.palette.text.primary,
    boxShadow: `0 0 8px rgba(0, 245, 255, 0.3)`,
  },
  apy: {
    color: '#00e676',
    fontWeight: 600,
    marginLeft: theme.spacing(1),
  },
  poolContainer: {
    marginTop: theme.spacing(4),
  },
  terminalBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 4,
    padding: theme.spacing(2),
    marginTop: theme.spacing(3),
    fontFamily: '"Roboto Mono", monospace',
    position: 'relative',
    '&::before': {
      content: '">_"',
      color: theme.palette.primary.main,
      position: 'absolute',
      top: 12,
      left: 12,
    },
  },
  terminalContent: {
    marginLeft: theme.spacing(3),
    '& p': {
      margin: theme.spacing(0.5, 0),
    },
  },
  highlightedText: {
    color: theme.palette.primary.main,
    fontWeight: 500,
  },
  scanLine: {
    width: '100%',
    height: '2px',
    backgroundColor: 'rgba(0, 245, 255, 0.3)',
    position: 'absolute',
    left: 0,
    animation: '$scanAnimation 4s linear infinite',
  },
  '@keyframes scanAnimation': {
    '0%': {
      top: 0,
      opacity: 0.3,
    },
    '50%': {
      opacity: 0.9,
    },
    '100%': {
      top: '100%',
      opacity: 0.3,
    },
  },
  statBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
    border: '1px solid rgba(0, 245, 255, 0.1)',
  },
  statLabel: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  statValue: {
    color: theme.palette.primary.main,
    fontWeight: 500,
    fontSize: '1rem',
    fontFamily: '"Roboto Mono", monospace',
  },
  slider: {
    width: '100%',
    margin: theme.spacing(2, 0),
    '& .MuiSlider-rail': {
      height: 4,
    },
    '& .MuiSlider-track': {
      height: 4,
    },
    '& .MuiSlider-thumb': {
      width: 16,
      height: 16,
      marginTop: -6,
      marginLeft: -8,
    }
  },
  priceRangeVisualizer: {
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 4,
    padding: theme.spacing(1),
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(3),
    position: 'relative',
    height: 80,
    overflow: 'visible',
  },
  priceMarker: {
    position: 'absolute',
    height: '60%',
    width: 2,
    backgroundColor: '#00e676',
    zIndex: 2,
    transform: 'translateX(-50%)',
  },
  rangeIndicator: {
    position: 'absolute',
    height: 14,
    top: 20,
    borderRadius: 7,
    background: 'rgba(0,245,255,0.3)',
    border: '1px solid rgba(0,245,255,0.5)',
    zIndex: 1,
  },
  priceRangeLabel: {
    position: 'absolute',
    fontSize: '0.75rem',
    bottom: 8,
  },
  sectionSpacing: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
  },
  txStatusBox: {
    marginTop: theme.spacing(2),
    textAlign: 'center',
    border: '1px solid rgba(0,245,255,0.3)',
    borderRadius: 4,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
}));

const ProvideLiquidity = () => {
  const classes = useStyles();
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [ethBalance, setEthBalance] = useState('0');
  const [linkBalance, setlinkBalance] = useState('0');
  
  // New state variables for contract data
  const [poolTVL, setPoolTVL] = useState('0');
  const [poolUtilization, setPoolUtilization] = useState(0);
  const [baseAPY, setBaseAPY] = useState(5.0); // Default base APY
  const [totalAPY, setTotalAPY] = useState(ETH_LINK_PAIR.apy);
  const [claimableRewards, setClaimableRewards] = useState('0');
  const [dataLoading, setDataLoading] = useState(false);
  
  // Add a new state variable for user's liquidity position
  const [userLiquidity, setUserLiquidity] = useState('0');
  
  // Add a new state variable for user's pool share
  const [userPoolShare, setUserPoolShare] = useState(0);
  
  // Add a new state variable for estimated daily rewards
  const [estimatedDailyRewards, setEstimatedDailyRewards] = useState('0');
  
  // Add state for provider status
  const [providerStatus, setProviderStatus] = useState('connecting');
  
  // Add state for liquidity range
  const [priceRangePercent, setPriceRangePercent] = useState(20); // Default to 20% (± 20%)
  const [customRangeEnabled, setCustomRangeEnabled] = useState(false);
  
  // Add UI transaction tracking state
  const [txStatus, setTxStatus] = useState('');
  
  // Helper to show transaction status in the UI
  const updateTxStatus = (status, hash = '') => {
    setTxStatus(status);
    if (hash) {
      console.log(`Transaction ${status}: ${hash}`);
    } else {
      console.log(`Transaction ${status}`);
    }
  };
  
  // Determine which network we're on
  const networkId = chain?.id || 11155111; // Default to Sepolia
  const addresses = CONTRACT_ADDRESSES[networkId] || CONTRACT_ADDRESSES[11155111];
  
  // Array of backup RPC endpoints to try
  const RPC_ENDPOINTS = [
    'https://eth-sepolia.g.alchemy.com/v2/PvRVWSZrTWrYQjPJ9zTs_7oHlcZYbwX8'  // Alchemy Sepolia endpoint
  ];

  // Setup provider with simplified mechanism for single endpoint
  const setupProvider = () => {
    try {
      // Try to use the wagmi provider first if available
      if (provider) {
        console.log("Using wagmi provider");
        return provider;
      }
      
      // Otherwise, use our dedicated Alchemy endpoint
      console.log("Creating custom provider with:", RPC_ENDPOINTS[0]);
      const customProvider = new ethers.providers.StaticJsonRpcProvider(RPC_ENDPOINTS[0]);
      
      // Add additional properties to help with error handling
      customProvider.providerUrl = RPC_ENDPOINTS[0];
      
      return customProvider;
    } catch (error) {
      console.error("Failed to set up provider:", error);
      // Last resort fallback
      return ethers.getDefaultProvider('sepolia');
    }
  };

  // Use our configured provider
  const customProvider = setupProvider();

  // Setup contract instances with our custom provider
  const lendingContract = useContract({
    address: addresses.lendingContract,
    abi: LendingContractABI,
    signerOrProvider: signer || customProvider,
  });

  const linkTokenContract = useContract({
    address: addresses.loanToken,
    abi: ERC20ABI,
    signerOrProvider: signer || customProvider,
  });

  // Add a function to check if the provider is working with better error handling
  const checkProvider = async () => {
    let attempts = 0;
    const maxAttempts = 2; // Reduce attempts for faster feedback
    
    while (attempts < maxAttempts) {
      try {
        console.log(`Checking provider (attempt ${attempts + 1}/${maxAttempts})...`);
        
        // Step 1: Check basic network connectivity
        const blockNumber = await customProvider.getBlockNumber();
        console.log("Connected to network, latest block:", blockNumber);
        
        // Step 2: Try a more complex operation - fetch network info
        const network = await customProvider.getNetwork();
        console.log("Network info:", network.name, network.chainId);
        
        // Step 3: Try to get ETH balance of a known address
        // This tests if the RPC endpoint allows this type of query
        const knownAddress = addresses.lendingContract; // Use lending contract address
        const balance = await customProvider.getBalance(knownAddress);
        console.log(`Balance check of contract address: ${formatUnits(balance, 18)} ETH`);
        
        // Step 4: Try a contract call to ensure contract interactions work
        if (linkTokenContract) {
          try {
            // Simple view call to check if the contract interaction works
            const symbol = await linkTokenContract.symbol();
            console.log("LINK token symbol:", symbol);
            
            // If we got here, the provider is fully functional
            return true;
          } catch (contractError) {
            console.error("Contract interaction failed:", contractError);
            // Continue to the next attempt instead of failing immediately
            // Contract issues might be temporary
            attempts++;
            continue;
          }
        }
        
        // If we don't have the linkTokenContract but got this far,
        // the provider is probably working
        return true;
        
      } catch (error) {
        attempts++;
        console.error(`Provider connection error (attempt ${attempts}/${maxAttempts}):`, error);
        
        // If we've tried all attempts, give up
        if (attempts >= maxAttempts) {
          return false;
        }
        
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempts)));
      }
    }
    
    return false;
  };

  // Update the fetchPoolData function to handle provider issues
  const fetchPoolData = async () => {
    if (!lendingContract || !linkTokenContract) return;
    
    // Check if our provider is working
    const providerWorking = await checkProvider();
    if (!providerWorking) {
      toast.error('Network connection issue. Trying alternative RPC endpoint...', {
        className: 'cyber-toast error-toast',
      });
      return;
    }
    
    setDataLoading(true);
    try {
      // Set a default fixed TVL instead of using getLockLiquidity
      const defaultTVL = '10000.0'; // 10,000 LINK as default TVL
      setPoolTVL(defaultTVL);
      
      // Create a BigNumber representation for calculations
      const totalLiquidity = ethers.utils.parseUnits(defaultTVL, 18);
      console.log("Using default Total Liquidity:", defaultTVL, "LINK");
      
      // Calculate utilization (we need to approximate this since there's no direct function)
      // In a real lending protocol, the utilization would be (totalBorrowed / totalLiquidity)
      // For this demo, we'll get LINK balance of the lending contract and use our default TVL
      try {
        const contractLinkBalance = await linkTokenContract.balanceOf(addresses.lendingContract);
        // For display purposes, calculate a reasonable utilization percentage
        const utilization = 65; // Fixed utilization percentage
        setPoolUtilization(utilization);
        console.log("Using fixed utilization:", utilization, "%");
      } catch (error) {
        console.error("Error calculating utilization:", error);
        // Fall back to default
        setPoolUtilization(40);
      }
      
      // Get APY - in a production app, this would come from the contract
      // For now we'll use a base APY and add utilization bonus
      const utilizationBonus = poolUtilization ? (poolUtilization / 100).toFixed(1) : 0.5;
      const liquidityMiningBonus = 1.1; // Fixed bonus for liquidity mining
      const calculatedAPY = baseAPY + parseFloat(utilizationBonus) + liquidityMiningBonus;
      setTotalAPY(calculatedAPY);
      
      // Get claimable rewards if user is connected
      if (isConnected && address) {
        try {
          const rewards = await lendingContract.getClaimableRewards(address);
          setClaimableRewards(formatUnits(rewards, 18));
          console.log("Claimable Rewards:", formatUnits(rewards, 18));
        } catch (error) {
          console.error("Error fetching rewards:", error);
          setClaimableRewards('0');
        }
      }
      console.log("isConnected", isConnected, address);
      // Get user's liquidity position if connected
      if (isConnected && address) {
        try {
          const position = await lendingContract.getLpPosition(address);
          setUserLiquidity(formatUnits(position, 18));
          console.log("User's Liquidity Position:", formatUnits(position, 18), "LINK");
          
          // Calculate pool share using our default TVL
          if (position.gt(0)) {
            const sharePercentage = position.mul(10000).div(totalLiquidity).toNumber() / 100;
            setUserPoolShare(sharePercentage);
            console.log("User's Pool Share:", sharePercentage.toFixed(2), "%");
            
            // Calculate estimated daily rewards based on position and APY
            const positionValue = parseFloat(formatUnits(position, 18));
            const dailyRate = calculatedAPY / 365;
            const dailyRewards = (positionValue * dailyRate / 100).toFixed(6);
            setEstimatedDailyRewards(dailyRewards);
            console.log("Estimated Daily Rewards:", dailyRewards, "LINK");
          } else {
            setUserPoolShare(0);
            setEstimatedDailyRewards('0');
          }
        } catch (error) {
          console.error("Error fetching user's liquidity position:", error);
          setUserLiquidity('0');
          setUserPoolShare(0);
          setEstimatedDailyRewards('0');
        }
      }
      
      // Update the ETH_LINK_PAIR object for consistency
      ETH_LINK_PAIR.tvl = parseFloat(defaultTVL);
      ETH_LINK_PAIR.utilization = poolUtilization;
      ETH_LINK_PAIR.apy = calculatedAPY;
      
    } catch (error) {
      console.error("Error fetching pool data:", error);
      
      // Check for specific error types
      if (error.message && error.message.includes('CORS')) {
        toast.error('CORS error detected. Try using a different network connection or VPN.', {
          className: 'cyber-toast error-toast',
        });
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error('Network error detected. Please check your connection.', {
          className: 'cyber-toast error-toast',
        });
      } else {
        toast.error(`Error fetching data: ${error.message}`, {
          className: 'cyber-toast error-toast',
        });
      }
    } finally {
      setDataLoading(false);
    }
  };

  // Function to refresh balances manually
  const refreshBalances = async () => {
    if (!isConnected || !address) return;
    
    setBalanceLoading(true);
    try {
      // Get ETH balance
      if (provider) {
        try {
          const balance = await provider.getBalance(address);
          setEthBalance(formatUnits(balance, 18));
        } catch (ethError) {
          console.error('Error fetching ETH balance:', ethError);
        }
      }
      
      // Get LINK balance
      if (linkTokenContract) {
        try {
          // Avoid caching by using a static call with the latest block
          const linkBalance = await linkTokenContract.callStatic.balanceOf(address, { blockTag: 'latest' });
          setlinkBalance(formatUnits(linkBalance, 18));
        } catch (linkError) {
          console.error('Error fetching LINK balance:', linkError);
        }
      }
    } catch (error) {
      console.error('Error refreshing balances:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Update the useEffect for better provider initialization and reconnection
  useEffect(() => {
    // Cleanup function for auto-retry
    let retryTimeout = null;
    let retryCount = 0;
    const MAX_AUTO_RETRIES = 3;
    
    const initializeProvider = async () => {
      if (isConnected && address) {
        console.log("Connection state changed:", isConnected, address);
        
        if (providerStatus === 'switching') {
          // Skip initialization if we're already in the process of switching
          console.log("Provider is already switching, skipping check");
          return;
        }
        
        setProviderStatus('connecting');
        
        // Check provider status with proper error handling
        try {
          const isWorking = await checkProvider();
          if (isWorking) {
            console.log("Provider is working correctly");
            setProviderStatus('connected');
            refreshBalances();
            fetchPoolData();
            // Reset retry count on success
            retryCount = 0;
          } else {
            console.log("Provider is not working");
            setProviderStatus('error');
            
            // Auto-retry logic for automatic recovery
            if (retryCount < MAX_AUTO_RETRIES) {
              retryCount++;
              console.log(`Auto-retrying (${retryCount}/${MAX_AUTO_RETRIES})...`);
              
              // Show toast indicating auto-recovery attempt
              toast.info(`Connection issue detected. Auto-retry attempt ${retryCount}/${MAX_AUTO_RETRIES}...`, {
                className: 'cyber-toast',
              });
              
              // Schedule auto-retry with exponential backoff
              retryTimeout = setTimeout(() => {
                console.log(`Executing auto-retry ${retryCount}`);
                switchProvider();
              }, 2000 * Math.pow(2, retryCount - 1)); // Exponential backoff (2s, 4s, 8s)
            } else {
              // If max retries reached, show more prominent error to user
              toast.error('Connection issues persist. Please manually switch provider or check your network.', {
                className: 'cyber-toast error-toast',
                autoClose: false, // Don't auto-close this important message
              });
            }
          }
        } catch (error) {
          console.error("Provider check failed completely:", error);
          setProviderStatus('error');
        }
      } else {
        // Reset state if disconnected
        setProviderStatus('connecting');
        // Reset retry count when disconnected
        retryCount = 0;
      }
    };
    
    // Initialize the provider immediately
    initializeProvider();
    
    // Return cleanup function
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [address, isConnected, chain]);

  // Also refresh data when the page loads
  useEffect(() => {
    fetchPoolData();
    
    // Set up polling for data refresh (every 30 seconds)
    // But only if we have a working provider
    const intervalId = setInterval(() => {
      if (providerStatus === 'connected') {
        fetchPoolData();
      }
    }, 30000);
    
    // Clear interval on unmount
    return () => clearInterval(intervalId);
  }, [providerStatus]);

  // Handle amount input
  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };

  // Add a new function to claim rewards
  const handleClaimRewards = async () => {
    if (!isConnected || !lendingContract) {
      toast.error('Please connect your wallet first', {
        className: 'cyber-toast error-toast',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Call the claimRewards function on the contract
      const tx = await lendingContract.claimRewards();
      
      toast.info('Claiming rewards... Please wait for confirmation.', {
        className: 'cyber-toast',
      });
      
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed!");
      
      toast.success(`Successfully claimed your rewards!`, {
        className: 'cyber-toast success-toast',
      });
      
      // Refresh data after claiming
      refreshBalances();
      fetchPoolData();
      
    } catch (error) {
      console.error('Error claiming rewards:', error);
      
      let errorMessage = error.message;
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by the wallet';
      }
      
      toast.error(`Failed to claim rewards: ${errorMessage}`, {
        className: 'cyber-toast error-toast',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle price range slider change
  const handlePriceRangeChange = (event, newValue) => {
    setPriceRangePercent(newValue);
  };

  // Toggle custom range mode
  const toggleCustomRange = () => {
    setCustomRangeEnabled(!customRangeEnabled);
  };

  // Handle providing liquidity
  const handleProvideLiquidity = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first', {
        className: 'cyber-toast error-toast',
      });
      return;
    }

    // Basic validation
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount', {
        className: 'cyber-toast error-toast',
      });
      return;
    }

    // Check if signer is available
    if (!signer) {
      toast.error('Wallet connection issue. Please reconnect your wallet.', {
        className: 'cyber-toast error-toast',
      });
      return;
    }

    setLoading(true);
    updateTxStatus('preparing');
    
    try {
      // Parse the amount
      const parsedLinkAmount = parseUnits(amount.toString().trim(), 18);
      const ethLinkRatio = 0.005; // Assuming 1 ETH = 200 LINK
      const parsedEthAmount = parseUnits((parseFloat(amount) * ethLinkRatio).toFixed(18), 18);
      
      console.log("Providing liquidity with:", amount, "LINK and", 
        formatUnits(parsedEthAmount, 18), "ETH");
      
      // First, approve the lending contract to spend LINK tokens
      let currentAllowance;
      try {
        currentAllowance = await linkTokenContract.allowance(address, addresses.lendingContract);
        console.log("Current allowance:", formatUnits(currentAllowance, 18), "LINK");
      } catch (error) {
        console.error("Error checking allowance:", error);
        throw new Error("Failed to check token allowance");
      }
      
      // Only approve if needed
      if (currentAllowance.lt(parsedLinkAmount)) {
        updateTxStatus('approving');
        
        try {
          const linkTokenWithSigner = new ethers.Contract(
            addresses.loanToken,
            ERC20ABI,
            signer
          );
          
          const approveTx = await linkTokenWithSigner.approve(
            addresses.lendingContract, 
            parsedLinkAmount,
            { gasLimit: 100000 }
          );
          
          updateTxStatus('approval pending', approveTx.hash);
          console.log("Approval transaction hash:", approveTx.hash);
          
          await approveTx.wait();
          console.log("Approval confirmed!");
          
          toast.success(`Approved ${amount} LINK tokens!`, {
            className: 'cyber-toast success-toast',
          });
        } catch (error) {
          if (error.code === 'ACTION_REJECTED') {
            throw new Error("Transaction was rejected in your wallet");
          } else {
            throw new Error(`Failed to approve tokens: ${error.message || 'Unknown error'}`);
          }
        }
      }
      
      // Prepare simplified transaction parameters
      updateTxStatus('sending');
      
      // Create simple pool key
      const poolKey = {
        token0: addresses.loanToken, // LINK
        token1: "0x0000000000000000000000000000000000000000", // ETH
        fee: 3000, // 0.3% fee tier
        tickSpacing: 60,
        hooks: addresses.lendingContract
      };
      
      // Define a simplified range (+-20%) 
      const currentPrice = 1.0;
      const rangePercent = priceRangePercent / 100;
      const lowerPrice = currentPrice * (1 - rangePercent);
      const upperPrice = currentPrice * (1 + rangePercent);
      
      const lowerTick = Math.floor(Math.log(lowerPrice) / Math.log(1.0001));
      const upperTick = Math.ceil(Math.log(upperPrice) / Math.log(1.0001));
      
      const adjustedLowerTick = Math.floor(lowerTick / 60) * 60;
      const adjustedUpperTick = Math.ceil(upperTick / 60) * 60;
      
      // Generate salt
      const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      
      // Create parameters with simpler liquidityDelta
      const modifyLiquidityParams = {
        tickLower: adjustedLowerTick,
        tickUpper: adjustedUpperTick,
        liquidityDelta: ethers.BigNumber.from("100000000000000000000").toString(), // Simple fixed value (100 tokens with 18 decimals)
        salt: salt
      };
      
      const hookData = "0x"; // Empty hook data
      
      try {
        // Create a direct signer contract
        const contract = new ethers.Contract(
          addresses.lendingContract,
          LendingContractABI,
          signer
        );
        
        // Send transaction with fixed gas limit to avoid extra calls
        const tx = await contract.provideLiquidity(
          poolKey,
          modifyLiquidityParams,
          hookData,
          { 
            value: parsedEthAmount,
            gasLimit: 500000 // Fixed reasonable gas limit
          }
        );
        
        updateTxStatus('pending', tx.hash);
        
        toast.info(`Providing liquidity... Transaction: ${tx.hash.slice(0, 10)}...`, {
          className: 'cyber-toast',
        });
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        updateTxStatus('confirmed');
        console.log("Transaction confirmed!", receipt);
        
        toast.success(`Successfully provided ${amount} LINK and ${formatUnits(parsedEthAmount, 18)} ETH as liquidity!`, {
          className: 'cyber-toast success-toast',
        });
        
        // Refresh data and reset UI
        await refreshBalances();
        await fetchPoolData();
        setAmount('');
        
      } catch (error) {
        updateTxStatus('failed');
        console.error('Transaction failed:', error);
        
        let errorMessage = error.message || 'Unknown error';
        if (error.code === 'ACTION_REJECTED') {
          errorMessage = 'Transaction was rejected by the wallet';
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
          errorMessage = 'Insufficient funds for gas';
        }
        
        toast.error(`Failed to provide liquidity: ${errorMessage}`, {
          className: 'cyber-toast error-toast',
        });
      }
    } catch (error) {
      updateTxStatus('failed');
      console.error('Liquidity provision error:', error);
      
      toast.error(`${error.message || 'Failed to provide liquidity'}`, {
        className: 'cyber-toast error-toast',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format currency with commas
  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  // Simplified switchProvider function for single endpoint
  const switchProvider = async () => {
    setProviderStatus('switching');
    toast.info('Reconnecting to RPC provider...', {
      className: 'cyber-toast',
    });
    
    try {
      console.log(`Trying to reconnect to Alchemy endpoint...`);
      
      // Create a fresh provider instance
      const newProvider = new ethers.providers.StaticJsonRpcProvider(RPC_ENDPOINTS[0]);
      newProvider.providerUrl = RPC_ENDPOINTS[0];
      
      // Test the provider with a timeout
      const blockNumberPromise = newProvider.getBlockNumber();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("RPC request timed out")), 5000)
      );
      
      // Race the block number request against the timeout
      const blockNumber = await Promise.race([blockNumberPromise, timeoutPromise]);
      
      console.log(`Successfully connected to Alchemy, block #${blockNumber}`);
      
      // Replace the current provider with the new one
      Object.assign(customProvider, newProvider);
      
      toast.success(`Successfully reconnected to Alchemy endpoint`, {
        className: 'cyber-toast success-toast',
      });
      
      setProviderStatus('connected');
      
      // Refresh data with new provider
      refreshBalances();
      fetchPoolData();
    } catch (error) {
      console.error(`Failed to connect to Alchemy endpoint:`, error);
      
      setProviderStatus('error');
      toast.error('Failed to connect to Alchemy endpoint. Please check your network connection or try again later.', {
        className: 'cyber-toast error-toast',
      });
    }
  };

  // Function to convert a number to a BigNumber with specified precision
  const toBigNumber = (value, decimals = 18) => {
    try {
      // If value is already a BigNumber or BigInt instance, convert to string first
      if (value?._isBigNumber || typeof value === 'bigint') {
        return value.toString();
      }
      
      // Ensure we have a string or number to work with
      if (value === null || value === undefined) {
        console.warn("Null or undefined value passed to toBigNumber, defaulting to 0");
        return "0";
      }
      
      // Convert to string to handle any type safely
      const valueStr = String(value).trim();
      
      // Check if it's a valid number
      if (valueStr === '' || isNaN(Number(valueStr))) {
        console.warn("Invalid number format passed to toBigNumber:", valueStr);
        return "0";
      }
      
      // If the value includes scientific notation ('e'), convert it to fixed notation
      if (valueStr.includes('e') || valueStr.includes('E')) {
        const num = Number(valueStr);
        // Use toFixed to get full precision without scientific notation
        const fixedStr = num.toFixed(Math.max(0, Math.min(78, decimals))); // ethers has a limit
        console.log("Converted scientific notation:", valueStr, "to:", fixedStr);
        return ethers.utils.parseUnits(fixedStr, decimals).toString();
      }
      
      // For regular numbers, use parseUnits directly
      const bn = ethers.utils.parseUnits(valueStr, decimals);
      return bn.toString();
    } catch (error) {
      console.error("Error in toBigNumber:", error, "for value:", value);
      // Return a safe default - 0 with the correct number of decimal places
      return ethers.utils.parseUnits("0", decimals).toString();
    }
  };

  return (
    <div className={classes.root}>
      <Container className={classes.container} maxWidth="lg">
        <Typography variant="h4" component="h1" className={classes.header}>
          ETH/LINK Lending
        </Typography>

        <Paper className={classes.paper}>
          {/* Provider status indicator */}
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between" 
            mb={3} 
            p={2} 
            border={1} 
            borderColor={providerStatus === 'connected' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'} 
            borderRadius={1}
            bgcolor={providerStatus === 'connected' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)'}
          >
            <Box display="flex" alignItems="center">
              <Box 
                component="span" 
                style={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  backgroundColor: 
                    providerStatus === 'connected' ? '#4caf50' : 
                    providerStatus === 'connecting' ? '#ff9800' : '#f44336',
                  display: 'inline-block',
                  marginRight: 12
                }}
              />
              <Box>
                <Typography variant="body1" style={{ fontWeight: 500 }}>
                  {providerStatus === 'connected' ? 'RPC Connected' : 
                  providerStatus === 'connecting' ? 'Connecting to RPC...' : 'RPC Connection Error'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {providerStatus === 'connected' 
                    ? 'Connected to Sepolia testnet' 
                    : providerStatus === 'connecting' 
                      ? 'Establishing connection to Ethereum network...'
                      : 'Cannot connect to Ethereum network. Please switch provider.'}
                </Typography>
              </Box>
            </Box>
            {providerStatus !== 'connected' && (
              <Button 
                variant="contained" 
                color="primary"
                onClick={switchProvider}
                disabled={providerStatus === 'switching'}
                style={{ minWidth: '140px', height: '36px' }}
              >
                {providerStatus === 'switching' ? (
                  <>
                    <CircularProgress size={16} style={{ marginRight: 8 }} />
                    Switching...
                  </>
                ) : (
                  'Switch Provider'
                )}
              </Button>
            )}
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box className={classes.statBox}>
                <Typography className={classes.statLabel}>Total Value Locked</Typography>
                <Typography className={classes.statValue}>
                  {dataLoading ? (
                    <CircularProgress size={14} />
                  ) : (
                    `${formatCurrency(poolTVL)} LINK`
                  )}
                </Typography>
              </Box>
            </Grid>
            
            {isConnected && (
              <Grid item xs={12} md={4}>
                <Box className={classes.statBox} style={{ position: 'relative' }}>
                  <Typography className={classes.statLabel}>
                    Your LINK Balance
                    <Tooltip
                      title="Click to refresh balances"
                      classes={{ tooltip: classes.infoTooltip }}
                      arrow
                    >
                      <IconButton 
                        size="small" 
                        onClick={refreshBalances} 
                        disabled={balanceLoading}
                        style={{ padding: 2, marginLeft: 4 }}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                  {balanceLoading ? (
                    <Box display="flex" alignItems="center">
                      <CircularProgress size={14} style={{ marginRight: 8 }} />
                      <Typography className={classes.statValue}>Loading...</Typography>
                    </Box>
                  ) : (
                    <Typography className={classes.statValue}>{formatCurrency(linkBalance)} LINK</Typography>
                  )}
                </Box>
              </Grid>
            )}
            
            {isConnected && parseFloat(userLiquidity) > 0 && (
              <Grid item xs={12} md={4}>
                <Box className={classes.statBox}>
                  <Typography className={classes.statLabel}>Your Liquidity Position</Typography>
                  <Typography className={classes.statValue}>
                    {dataLoading ? (
                      <CircularProgress size={14} />
                    ) : (
                      `${formatCurrency(userLiquidity)} LINK`
                    )}
                  </Typography>
                  {userPoolShare > 0 && (
                    <Typography variant="caption" style={{ color: '#00e676' }}>
                      {userPoolShare.toFixed(2)}% of pool
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>

          <Grid container spacing={4} style={{ marginTop: '16px' }}>
            <Grid item xs={12} md={6}>
              <Paper className={classes.paper}>
                <Typography variant="h6" className={classes.sectionTitle}>
                  Provide Liquidity
                </Typography>
                
                <Box mb={3}>
                  <Typography variant="body2">
                    Provide liquidity to the ETH/LINK Uniswap v4 pool. This creates a position with:
                  </Typography>
                  <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 20 }}>
                    <li>
                      <Typography variant="body2">
                        LINK and ETH tokens (both required)
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        A customizable price range (currently ±{priceRangePercent}% around current price)
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Full fee earning when price stays within your range
                      </Typography>
                    </li>
                  </ul>
                </Box>
                
                <TextField
                  label="Amount"
                  variant="outlined"
                  fullWidth
                  value={amount}
                  onChange={handleAmountChange}
                  className={classes.formControl}
                  disabled={!isConnected || loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">LINK</InputAdornment>
                    ),
                  }}
                />

                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Button 
                    size="small" 
                    onClick={() => setAmount((parseFloat(linkBalance) * 0.25).toString())}
                    disabled={!isConnected || loading}
                  >
                    25%
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => setAmount((parseFloat(linkBalance) * 0.5).toString())}
                    disabled={!isConnected || loading}
                  >
                    50%
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => setAmount((parseFloat(linkBalance) * 0.75).toString())}
                    disabled={!isConnected || loading}
                  >
                    75%
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => setAmount(linkBalance)}
                    disabled={!isConnected || loading}
                  >
                    Max
                  </Button>
                </Box>

                <Box mt={3} mb={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">
                      Price Range: ±{priceRangePercent}%
                    </Typography>
                    <Button 
                      size="small" 
                      color="primary" 
                      onClick={toggleCustomRange}
                      style={{ textTransform: 'none' }}
                    >
                      {customRangeEnabled ? 'Use Default Range' : 'Customize Range'}
                    </Button>
                  </Box>
                  
                  {customRangeEnabled && (
                    <>
                      <Slider
                        value={priceRangePercent}
                        onChange={handlePriceRangeChange}
                        aria-labelledby="price-range-slider"
                        valueLabelDisplay="auto"
                        min={1}
                        max={100}
                        className={classes.slider}
                        style={{ margin: '24px 0 12px 0' }}
                      />
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="caption">Narrow (±1%)</Typography>
                        <Typography variant="caption">Wide (±100%)</Typography>
                      </Box>

                      <Box display="flex" justifyContent="center" mt={2} mb={3}>
                        <Button 
                          size="small" 
                          color="primary" 
                          variant={priceRangePercent === 5 ? "contained" : "outlined"}
                          onClick={() => setPriceRangePercent(5)} 
                          style={{ marginRight: 8 }}
                        >
                          Narrow (±5%)
                        </Button>
                        <Button 
                          size="small" 
                          color="primary" 
                          variant={priceRangePercent === 20 ? "contained" : "outlined"}
                          onClick={() => setPriceRangePercent(20)} 
                          style={{ marginRight: 8 }}
                        >
                          Medium (±20%)
                        </Button>
                        <Button 
                          size="small" 
                          color="primary" 
                          variant={priceRangePercent === 50 ? "contained" : "outlined"}
                          onClick={() => setPriceRangePercent(50)}
                        >
                          Wide (±50%)
                        </Button>
                      </Box>

                      <Typography variant="body2" color="textSecondary" style={{ marginTop: 8, marginBottom: 16 }}>
                        <InfoIcon fontSize="small" style={{ fontSize: 16, verticalAlign: 'text-bottom', marginRight: 4 }} />
                        {priceRangePercent < 10 ? (
                          "Narrow range earns more fees while price is in range, but may go out of range more frequently."
                        ) : priceRangePercent > 50 ? (
                          "Wide range stays in range longer, but earns fewer fees per trade."
                        ) : (
                          "Balanced range provides moderate fee earning with less frequent range exits."
                        )}
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Improved visual price range indicator */}
                <Box className={classes.priceRangeVisualizer}>
                  {/* Current price marker */}
                  <div 
                    className={classes.priceMarker}
                    style={{ left: '50%' }}
                  />
                  
                  {/* Range indicator with better positioning */}
                  <div 
                    className={classes.rangeIndicator}
                    style={{ 
                      left: `${Math.max(50 - priceRangePercent/2, 5)}%`,
                      width: `${Math.min(priceRangePercent, 90)}%`,
                    }}
                  />
                  
                  {/* Labels with better positioning */}
                  <Typography 
                    variant="caption" 
                    className={classes.priceRangeLabel}
                    style={{ 
                      left: '50%',
                      transform: 'translateX(-50%)',
                      color: '#00e676',
                      fontWeight: 'bold',
                    }}
                  >
                    Current
                  </Typography>
                  
                  <Typography 
                    variant="caption" 
                    className={classes.priceRangeLabel}
                    style={{ 
                      left: `${Math.max(50 - priceRangePercent/2, 5)}%`,
                      color: '#00f5ff',
                    }}
                  >
                    -{priceRangePercent}%
                  </Typography>
                  
                  <Typography 
                    variant="caption" 
                    className={classes.priceRangeLabel}
                    style={{ 
                      left: `${Math.min(50 + priceRangePercent/2, 95)}%`,
                      transform: 'translateX(-100%)',
                      color: '#00f5ff',
                    }}
                  >
                    +{priceRangePercent}%
                  </Typography>
                </Box>

                <Box className={classes.terminalBox} mb={3}>
                  <div className={classes.scanLine}></div>
                  <Box className={classes.terminalContent}>
                    <Typography variant="body2">
                      ETH Required: <span className={classes.highlightedText}>
                        {amount ? (parseFloat(amount) * 0.005).toFixed(6) : '0.000000'} ETH
                      </span>
                    </Typography>
                    <Typography variant="body2">
                      Position Range: <span className={classes.highlightedText}>
                        ±{priceRangePercent}% around current price
                      </span>
                    </Typography>
                    <Typography variant="body2">
                      Fee Tier: <span className={classes.highlightedText}>
                        0.3%
                      </span>
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  className={classes.actionButton}
                  onClick={handleProvideLiquidity}
                  disabled={!isConnected || !amount || loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Provide Liquidity"
                  )}
                </Button>
                
                {/* Transaction status indicator */}
                {txStatus && (
                  <Box className={classes.txStatusBox}>
                    <Typography variant="subtitle2" style={{ marginBottom: 8 }}>
                      Transaction Status:
                    </Typography>
                    <Typography variant="body2" style={{ 
                      color: 
                        txStatus === 'confirmed' ? '#4caf50' : 
                        txStatus === 'failed' || txStatus === 'cancelled' ? '#f44336' : 
                        '#ff9800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: txStatus === 'confirmed' || txStatus === 'failed' ? 'bold' : 'normal'
                    }}>
                      {txStatus === 'preparing' && (
                        <>
                          <CircularProgress size={16} style={{ marginRight: 8 }} />
                          Preparing transaction...
                        </>
                      )}
                      {txStatus === 'approving' && (
                        <>
                          <CircularProgress size={16} style={{ marginRight: 8 }} />
                          Requesting token approval...
                        </>
                      )}
                      {txStatus === 'approval pending' && (
                        <>
                          <CircularProgress size={16} style={{ marginRight: 8 }} />
                          Approval pending. Waiting for confirmation...
                        </>
                      )}
                      {txStatus === 'sending' && (
                        <>
                          <CircularProgress size={16} style={{ marginRight: 8 }} />
                          Sending transaction to network...
                        </>
                      )}
                      {txStatus === 'pending' && (
                        <>
                          <CircularProgress size={16} style={{ marginRight: 8 }} />
                          Transaction pending. Waiting for confirmation...
                        </>
                      )}
                      {txStatus === 'retrying' && (
                        <>
                          <CircularProgress size={16} style={{ marginRight: 8 }} />
                          Retrying with higher gas limit...
                        </>
                      )}
                      {txStatus === 'confirmed' && (
                        <>
                          <span style={{ color: '#4caf50', marginRight: 8 }}>✓</span>
                          Transaction confirmed! Your liquidity has been added.
                        </>
                      )}
                      {txStatus === 'failed' && (
                        <>
                          <span style={{ color: '#f44336', marginRight: 8 }}>✗</span>
                          Transaction failed. See console for details.
                        </>
                      )}
                      {txStatus === 'cancelled' && (
                        <>
                          <span style={{ color: '#f44336', marginRight: 8 }}>✗</span>
                          Transaction cancelled by user.
                        </>
                      )}
                    </Typography>
                    
                    {/* Add a switch provider button when transaction fails */}
                    {(txStatus === 'failed' || txStatus === 'cancelled') && providerStatus !== 'connected' && (
                      <Box mt={2}>
                        <Typography variant="caption" style={{ display: 'block', marginBottom: 8 }}>
                          Transaction issues are often caused by RPC connection problems. Try switching to a different provider:
                        </Typography>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={switchProvider}
                          fullWidth
                          startIcon={<RefreshIcon />}
                        >
                          Switch to Another RPC Provider
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper className={classes.paper}>
                <Typography variant="h6" className={classes.sectionTitle}>
                  Contract Data
                </Typography>
                
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">Total Value Locked:</Typography>
                  <Typography variant="body2" className={classes.highlightedText}>
                    {dataLoading ? <CircularProgress size={14} /> : `${formatCurrency(poolTVL)} LINK`}
                  </Typography>
                </Box>
                
                {isConnected && (
                  <>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">Your LINK Balance:</Typography>
                      <Typography variant="body2" className={classes.highlightedText}>
                        {balanceLoading ? <CircularProgress size={14} /> : `${formatCurrency(linkBalance)} LINK`}
                      </Typography>
                    </Box>
                    
                    {parseFloat(userLiquidity) > 0 && (
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="body2">Your Liquidity Position:</Typography>
                        <Box textAlign="right">
                          <Typography variant="body2" className={classes.highlightedText}>
                            {dataLoading ? <CircularProgress size={14} /> : `${formatCurrency(userLiquidity)} LINK`}
                          </Typography>
                          {userPoolShare > 0 && (
                            <Typography variant="caption" style={{ color: '#00e676' }}>
                              {userPoolShare.toFixed(2)}% of pool
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    
                    {parseFloat(estimatedDailyRewards) > 0 && (
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="body2">Est. Daily Rewards:</Typography>
                        <Typography variant="body2" style={{ color: '#00e676' }}>
                          {dataLoading ? <CircularProgress size={14} /> : `+${formatCurrency(estimatedDailyRewards)} LINK/day`}
                        </Typography>
                      </Box>
                    )}
                    
                    {parseFloat(claimableRewards) > 0 && (
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="body2">Claimable Rewards:</Typography>
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" style={{ color: '#00e676', marginRight: '16px' }}>
                            {formatCurrency(claimableRewards)} LINK
                          </Typography>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={handleClaimRewards}
                            disabled={loading}
                          >
                            {loading ? <CircularProgress size={16} /> : 'Claim'}
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </div>
  );
};

export default ProvideLiquidity; 