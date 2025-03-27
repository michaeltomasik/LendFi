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
  FormControl,
  Select,
  MenuItem,
  Slider,
  InputAdornment,
  Tooltip,
  IconButton
} from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import { useAccount, useNetwork, useContract, useProvider, useSigner } from 'wagmi';
import { toast } from 'react-toastify';
import { SUPPORTED_TOKENS, SUPPORTED_CHAIN_IDS } from '../constants';
import { ethers, providers } from 'ethers';
import { parseUnits, formatUnits } from 'ethers/lib/utils';
import CircularProgress from '@material-ui/core/CircularProgress';
import RefreshIcon from '@material-ui/icons/Refresh';

// Import Contract ABIs
import ERC20ABI from '../abis/ERC20.json';
import LendingContractABI from '../abis/LendingContract.json';

// Contract addresses from deployment
const CONTRACT_ADDRESSES = {
  // Default to Sepolia testnet
  11155111: {
    lendingContract: '0xa96ac4b14ce7ef71367194169d6b2402abf2ed68',
    //lendingContract: '0x238cc754BB91265E61045e47F2aAf068F7D56F1d',
    loanToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789', // LINK
    collateralToken: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0' // USDT
  }
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
  tokenSelect: {
    marginBottom: theme.spacing(3),
    fontFamily: '"Roboto Mono", monospace',
  },
  tokenMenuItem: {
    display: 'flex',
    alignItems: 'center',
  },
  tokenIcon: {
    marginRight: theme.spacing(1),
    width: 24,
    height: 24,
  },
  slider: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
    '& .MuiSlider-thumb': {
      height: 24,
      width: 24,
      backgroundColor: 'transparent',
      border: `2px solid ${theme.palette.primary.main}`,
      boxShadow: `0 0 10px ${theme.palette.primary.main}`,
      '&:focus, &:hover, &$active': {
        boxShadow: `0 0 15px ${theme.palette.primary.main}`,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: theme.palette.primary.main,
        boxShadow: `0 0 10px ${theme.palette.primary.main}`,
      },
    },
    '& .MuiSlider-track': {
      height: 4,
      boxShadow: `0 0 8px ${theme.palette.primary.main}`,
    },
    '& .MuiSlider-rail': {
      height: 4,
      opacity: 0.2,
      backgroundColor: theme.palette.primary.main,
    },
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
  valueLabel: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
  healthIndicator: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(2),
  },
  healthBar: {
    flex: 1,
    marginLeft: theme.spacing(1),
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.1)',
  },
  healthBarValue: {
    height: '100%',
    transition: 'width 0.3s ease, background-color 0.3s ease',
  },
  statusDot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginRight: theme.spacing(1),
  },
  divider: {
    margin: theme.spacing(3, 0),
    background: 'rgba(255, 255, 255, 0.1)',
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
  highlightedText: {
    color: theme.palette.primary.main,
  },
}));

const Borrow = () => {
  const classes = useStyles();
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  
  const [amount, setAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [ltv, setLtv] = useState(50);
  const [healthFactor, setHealthFactor] = useState(2);
  const [loading, setLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [loanDuration, setLoanDuration] = useState(30); // 30 days default
  const [linkBalance, setLinkBalance] = useState('0');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [providerStatus, setProviderStatus] = useState('connecting');
  const [tokenAllowance, setTokenAllowance] = useState('0');

  // Determine which network we're on
  const networkId = chain?.id || 11155111; // Default to Sepolia
  const addresses = CONTRACT_ADDRESSES[networkId] || CONTRACT_ADDRESSES[11155111];

  // Update page title
  useEffect(() => {
    document.title = "LINK Under-Collateralized Loans";
  }, []);

  // Setup provider with fallback
  const setupProvider = () => {
    // Try to use the wagmi provider first
    if (provider) {
      return provider;
    }
    
    // If we're connected but having CORS issues with the default provider, use a custom one
    if (isConnected) {
      try {
        // Create a custom provider using ethers
        // Use a public gateway that has proper CORS headers
        return new providers.JsonRpcProvider('https://rpc.ankr.com/eth_sepolia');
      } catch (error) {
        console.error('Error creating custom provider:', error);
      }
    }
    
    // Fallback to default public provider
    return ethers.getDefaultProvider('sepolia');
  };

  // Use our configured provider
  const customProvider = setupProvider();

  // Setup contract instances with our custom provider
  const lendingContract = useContract({
    address: addresses.lendingContract,
    abi: LendingContractABI.abi,
    signerOrProvider: signer || customProvider,
  });

  const linkTokenContract = useContract({
    address: addresses.loanToken,
    abi: ERC20ABI,
    signerOrProvider: signer || customProvider,
  });

  const collateralTokenContract = useContract({
    address: addresses.collateralToken,
    abi: ERC20ABI,
    signerOrProvider: signer || customProvider,
  });

  // Add a function to check if the provider is working
  const checkProvider = async () => {
    try {
      // Try to get the latest block number as a simple check
      const blockNumber = await customProvider.getBlockNumber();
      console.log("Connected to network, latest block:", blockNumber);
      return true;
    } catch (error) {
      console.error("Provider connection error:", error);
      return false;
    }
  };

  // Handle borrow amount input
  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };

  // Handle collateral amount input
  const handleCollateralAmountChange = (event) => {
    setCollateralAmount(event.target.value);
  };

  // Handle duration change
  const handleDurationChange = (event) => {
    setLoanDuration(parseInt(event.target.value));
  };

  // Handle LTV slider change
  const handleLtvChange = (event, newValue) => {
    setLtv(newValue);
    // Calculate health factor based on LTV
    setHealthFactor((100 / newValue) * 1.1);
  };

  // Function to refresh balances manually
  const refreshBalances = async () => {
    if (!isConnected || !address) return;
    
    setBalanceLoading(true);
    try {
      // Get LINK balance
      if (linkTokenContract) {
        try {
          // Avoid caching by using a static call with the latest block
          const linkBalance = await linkTokenContract.callStatic.balanceOf(address, { blockTag: 'latest' });
          setLinkBalance(formatUnits(linkBalance, 18));
          
          // Also check allowance
          const allowance = await linkTokenContract.allowance(address, addresses.lendingContract);
          setTokenAllowance(formatUnits(allowance, 18));
          console.log('Current LINK allowance:', formatUnits(allowance, 18));
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

  // Fetch balances when account or network changes
  useEffect(() => {
    if (isConnected && address) {
      console.log("isConnected useEffect", isConnected, address);
      
      // Check provider status first
      checkProvider().then(isWorking => {
        if (isWorking) {
          setProviderStatus('connected');
          refreshBalances();
        } else {
          setProviderStatus('error');
          // Try to switch to alternative provider
          toast.info('Attempting to connect with alternative RPC endpoint...', {
            className: 'cyber-toast',
          });
          
          // Short delay then retry
          setTimeout(() => {
            refreshBalances();
          }, 1500);
        }
      });
    }
  }, [address, isConnected, chain, provider]);

  // Format currency with commas
  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  // Handle approving LINK tokens
  const handleApproveLink = async () => {
    if (!isConnected || !linkTokenContract) {
      toast.error('Please connect your wallet first', {
        className: 'cyber-toast error-toast',
      });
      return;
    }

    if (!collateralAmount) {
      toast.error('Please enter a collateral amount', {
        className: 'cyber-toast error-toast',
      });
      return;
    }

    setApprovalLoading(true);
    
    try {
      console.log("=== Approving LINK Tokens ===");
      
      // Parse the amount to wei
      const collateralAmountWei = parseUnits(collateralAmount, 18);
      
      // Approve the tokens
      const tx = await linkTokenContract.approve(addresses.lendingContract, collateralAmountWei);
      
      toast.info(`Approving LINK tokens... Please wait for confirmation.`, {
        className: 'cyber-toast',
      });
      
      console.log("Approval transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Approval confirmed:", receipt);
      
      toast.success(`Successfully approved LINK tokens!`, {
        className: 'cyber-toast success-toast',
      });
      
      // Refresh allowance
      refreshBalances();
      
    } catch (error) {
      console.error('Approval error:', error);
      
      // More detailed error handling
      let errorMessage = error.message;
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by the wallet';
      }
      
      toast.error(`Failed to approve tokens: ${errorMessage}`, {
        className: 'cyber-toast error-toast',
      });
    } finally {
      setApprovalLoading(false);
    }
  };

  // Handle loan creation
  const handleCreateLoan = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first', {
        className: 'cyber-toast error-toast',
      });
      return;
    }

    if (!amount || !collateralAmount || !loanDuration) {
      toast.error('Please fill in all required fields', {
        className: 'cyber-toast error-toast',
      });
      return;
    }

    const collateralAmountNum = parseFloat(collateralAmount);
    const tokenAllowanceNum = parseFloat(tokenAllowance);
    
    // Check if approval is needed
    if (collateralAmountNum > tokenAllowanceNum) {
      toast.error('Please approve LINK tokens first', {
        className: 'cyber-toast error-toast',
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log("=== Creating Under-Collateralized LINK Loan ===");
      console.log("Loan Amount:", amount, "LINK");
      console.log("Collateral Amount:", collateralAmount, "LINK");
      console.log("Duration (days):", loanDuration);
      
      // Check if lendingContract exists
      if (!lendingContract) {
        throw new Error("Lending contract is not initialized. Please check your connection.");
      }
      
      // Check if the contract has the createLoan function
      if (!lendingContract.createLoan) {
        console.error("Contract ABI:", JSON.stringify(lendingContract.interface.fragments, null, 2));
        throw new Error("The 'createLoan' function does not exist on the contract.");
      }
      
      // Log contract address
      console.log("Lending Contract Address:", lendingContract.address);
      console.log("Connected wallet address:", address);
      
      // Parse the amounts to wei
      const loanAmountWei = parseUnits(amount, 18);
      const collateralAmountWei = parseUnits(collateralAmount, 18);
      
      console.log("Loan Amount Wei:", loanAmountWei.toString());
      console.log("Collateral Amount Wei:", collateralAmountWei.toString());
      console.log("Duration (days):", loanDuration);
      
      try {
        // First try to estimate gas for the transaction to catch any likely errors
        const estimatedGas = await lendingContract.estimateGas.createLoan(
          loanAmountWei,
          loanDuration,
          collateralAmountWei
        );
        
        console.log("Estimated gas for createLoan:", estimatedGas.toString());
        
        // Add 20% buffer to estimated gas
        const gasLimit = estimatedGas.mul(120).div(100);
        console.log("Using gas limit of:", gasLimit.toString());
        console.log('lendingContract', lendingContract);
        // Call the createLoan function on the contract
        // For LINK collateral, we need to first approve the tokens
        const tx = await lendingContract.createLoan(
          loanAmountWei,
          loanDuration,
          collateralAmountWei,
          { gasLimit }
        );
        
        toast.info(`Creating loan... Please wait for confirmation. Transaction hash: ${tx.hash.slice(0, 10)}...`, {
          className: 'cyber-toast',
        });
        
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);
        
        // Find the LoanTaken event in the receipt to get the loan ID
        const loanTakenEvent = receipt.events?.find(e => e.event === 'LoanTaken');
        const loanId = loanTakenEvent?.args?.borrower ? 'Success' : 'Unknown';
        
        toast.success(`Successfully created loan! Status: ${loanId}`, {
          className: 'cyber-toast success-toast',
        });
        
        // Reset the form
        setAmount('');
        setCollateralAmount('');
        
        // Refresh balances
        refreshBalances();
      } catch (gasEstimationError) {
        console.error("Gas estimation failed:", gasEstimationError);
        
        // If gas estimation fails, try with a fixed gas limit as fallback
        try {
          console.log("Attempting transaction with fixed gas limit of 500,000");
          
          const tx = await lendingContract.createLoan(
            loanAmountWei,
            loanDuration,
            collateralAmountWei,
            { gasLimit: 500000 }
          );
          
          toast.info(`Creating loan... Please wait for confirmation. Transaction hash: ${tx.hash.slice(0, 10)}...`, {
            className: 'cyber-toast',
          });
          
          console.log("Transaction sent with fixed gas limit:", tx.hash);
          const receipt = await tx.wait();
          console.log("Transaction confirmed:", receipt);
          
          // Find the LoanTaken event in the receipt to get the loan ID
          const loanTakenEvent = receipt.events?.find(e => e.event === 'LoanTaken');
          const loanId = loanTakenEvent?.args?.borrower ? 'Success' : 'Unknown';
          
          toast.success(`Successfully created loan! Status: ${loanId}`, {
            className: 'cyber-toast success-toast',
          });
          
          // Reset the form
          setAmount('');
          setCollateralAmount('');
          
          // Refresh balances
          refreshBalances();
        } catch (fixedGasError) {
          console.error("Transaction failed with fixed gas limit:", fixedGasError);
          throw fixedGasError; // Re-throw to be caught by the outer catch block
        }
      }
    } catch (error) {
      console.error('Loan creation error:', error);
      
      // More detailed error handling
      let errorMessage = error.message;
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by the wallet';
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for gas';
      } else if (error.code === 'CALL_EXCEPTION') {
        errorMessage = 'Contract call failed. The function might not exist or the parameters are incorrect.';
        
        // Try to get more details from the error
        if (error.error && error.error.message) {
          errorMessage += ` Details: ${error.error.message}`;
        }
      } else if (error.message && error.message.includes('execution reverted')) {
        // Try to extract revert reason if available
        const revertReason = error.data?.message || error.message;
        errorMessage = `Transaction reverted: ${revertReason}`;
      }
      
      toast.error(`Failed to create loan: ${errorMessage}`, {
        className: 'cyber-toast error-toast',
      });
    } finally {
      setLoading(false);
    }
  };

  // Add function to manually switch provider
  const switchProvider = async () => {
    setProviderStatus('switching');
    
    // Try to connect to a different RPC endpoint
    try {
      // We'll use a different public RPC endpoint
      const newProvider = new providers.JsonRpcProvider('https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
      
      // Test the new provider
      await newProvider.getBlockNumber();
      
      // Override our provider
      Object.assign(customProvider, newProvider);
      
      toast.success('Successfully switched to alternative RPC provider', {
        className: 'cyber-toast success-toast',
      });
      
      setProviderStatus('connected');
      
      // Refresh data with new provider
      refreshBalances();
    } catch (error) {
      console.error('Failed to switch provider:', error);
      setProviderStatus('error');
      toast.error('Failed to switch provider. Please try again later.', {
        className: 'cyber-toast error-toast',
      });
    }
  };

  // Get health factor color based on value
  const getHealthColor = (factor) => {
    if (factor > 2) return '#00c853';
    if (factor > 1.5) return '#ffeb3b';
    if (factor >= 1) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className={classes.root}>
      <Container className={classes.container} maxWidth="lg">
        <Typography variant="h4" component="h1" className={classes.header}>
          LINK Under-Collateralized Loans
        </Typography>

        {/* Provider status indicator */}
        <Box display="flex" alignItems="center" justifyContent="flex-end" mb={2}>
          <Typography variant="body2" style={{ marginRight: '10px' }}>
            RPC Status:
          </Typography>
          <Box 
            component="span" 
            style={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              backgroundColor: 
                providerStatus === 'connected' ? '#4caf50' : 
                providerStatus === 'connecting' ? '#ff9800' : '#f44336',
              display: 'inline-block',
              marginRight: 8
            }}
          />
          <Typography variant="body2" style={{ marginRight: '10px' }}>
            {providerStatus === 'connected' ? 'Connected' : 
             providerStatus === 'connecting' ? 'Connecting...' : 'Connection Error'}
          </Typography>
          {providerStatus !== 'connected' && (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={switchProvider}
              disabled={providerStatus === 'switching'}
            >
              {providerStatus === 'switching' ? (
                <CircularProgress size={16} />
              ) : (
                'Switch Provider'
              )}
            </Button>
          )}
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper className={classes.paper}>
              <Typography variant="h6" className={classes.sectionTitle}>
                LINK Collateral
              </Typography>
              
              {isConnected && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body2">
                    Your LINK Balance:
                    <IconButton 
                      size="small" 
                      onClick={refreshBalances} 
                      disabled={balanceLoading}
                      style={{ padding: 2, marginLeft: 4 }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                  {balanceLoading ? (
                    <Box display="flex" alignItems="center">
                      <CircularProgress size={14} style={{ marginRight: 8 }} />
                      <Typography variant="body2">Loading...</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" className={classes.highlightedText}>
                      {formatCurrency(linkBalance)} LINK
                    </Typography>
                  )}
                </Box>
              )}

              <TextField
                label="Collateral Amount"
                variant="outlined"
                fullWidth
                value={collateralAmount}
                onChange={handleCollateralAmountChange}
                className={classes.formControl}
                disabled={!isConnected || loading || approvalLoading}
                InputProps={{
                  endAdornment: <InputAdornment position="end">LINK</InputAdornment>,
                }}
              />

              <Box display="flex" justifyContent="space-between" mb={2}>
                <Button 
                  size="small" 
                  onClick={() => setCollateralAmount((parseFloat(linkBalance) * 0.25).toString())}
                  disabled={!isConnected || loading || approvalLoading}
                >
                  25%
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setCollateralAmount((parseFloat(linkBalance) * 0.5).toString())}
                  disabled={!isConnected || loading || approvalLoading}
                >
                  50%
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setCollateralAmount((parseFloat(linkBalance) * 0.75).toString())}
                  disabled={!isConnected || loading || approvalLoading}
                >
                  75%
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setCollateralAmount(linkBalance)}
                  disabled={!isConnected || loading || approvalLoading}
                >
                  Max
                </Button>
              </Box>

              {isConnected && collateralAmount && parseFloat(collateralAmount) > parseFloat(tokenAllowance) && (
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  className={classes.actionButton}
                  onClick={handleApproveLink}
                  disabled={loading || approvalLoading}
                >
                  {approvalLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Approve LINK Tokens"
                  )}
                </Button>
              )}

              <Typography variant="h6" className={classes.sectionTitle} style={{ marginTop: '20px' }}>
                Loan to Value (LTV) Ratio
              </Typography>
              
              <Slider
                value={ltv}
                onChange={handleLtvChange}
                aria-labelledby="ltv-slider"
                className={classes.slider}
                disabled={!isConnected || !collateralAmount || loading || approvalLoading}
                min={10}
                max={80}
                step={1}
              />
              
              <Typography className={classes.valueLabel}>
                {ltv}% - You can borrow up to {ltv}% of your collateral value
              </Typography>

              <Box className={classes.healthIndicator}>
                <Typography variant="body2">Health Factor:</Typography>
                <Box className={classes.healthBar}>
                  <Box 
                    className={classes.healthBarValue} 
                    style={{ 
                      width: `${Math.min(100, (healthFactor / 3) * 100)}%`,
                      backgroundColor: getHealthColor(healthFactor) 
                    }}
                  />
                </Box>
                <Typography variant="body2" style={{ marginLeft: 8, color: getHealthColor(healthFactor) }}>
                  {healthFactor.toFixed(2)}
                </Typography>
                <Tooltip
                  title="Health factor represents the safety of your loan relative to the collateral value. Higher is better, below 1 may trigger liquidation."
                  classes={{ tooltip: classes.infoTooltip }}
                  arrow
                >
                  <InfoIcon className={classes.infoIcon} fontSize="small" />
                </Tooltip>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper className={classes.paper}>
              <Typography variant="h6" className={classes.sectionTitle}>
                Borrow LINK
              </Typography>
              
              <Box mt={2} mb={3}>
                <Typography variant="body2">
                  Under-Collateralized loans let you borrow LINK against your LINK holdings. 
                  This is useful for accessing liquidity without selling your tokens.
                </Typography>
              </Box>

              <TextField
                label="Borrow Amount"
                variant="outlined"
                fullWidth
                value={amount}
                onChange={handleAmountChange}
                className={classes.formControl}
                disabled={!isConnected || !collateralAmount || loading || approvalLoading}
                InputProps={{
                  endAdornment: <InputAdornment position="end">LINK</InputAdornment>,
                }}
              />

              <TextField
                label="Loan Duration (days)"
                variant="outlined"
                fullWidth
                type="number"
                value={loanDuration}
                onChange={handleDurationChange}
                className={classes.formControl}
                disabled={!isConnected || loading || approvalLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">days</InputAdornment>
                  ),
                }}
              />

              <Typography variant="body2" gutterBottom>
                Max Borrow: <span style={{ color: '#00f5ff' }}>
                  {collateralAmount
                    ? `${(parseFloat(collateralAmount) * ltv / 100).toFixed(2)} LINK`
                    : '0.00 LINK'
                  }
                </span>
              </Typography>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                className={classes.actionButton}
                onClick={handleCreateLoan}
                disabled={
                  !isConnected || 
                  !amount || 
                  !collateralAmount || 
                  !loanDuration || 
                  loading || 
                  approvalLoading ||
                  (parseFloat(collateralAmount) > parseFloat(tokenAllowance))
                }
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Create LINK Loan"
                )}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Borrow; 