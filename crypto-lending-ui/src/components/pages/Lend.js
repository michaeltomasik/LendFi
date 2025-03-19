import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Box,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  makeStyles
} from '@material-ui/core';
import { useWeb3 } from '../../contexts/Web3Context';
import { formatTokenAmount } from '../../utils/constants';
import { ethers } from 'ethers';

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(4),
    marginBottom: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(3),
  },
  button: {
    marginTop: theme.spacing(3),
  },
  infoCard: {
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  valueDisplay: {
    textAlign: 'right',
    fontWeight: 'bold',
  },
  label: {
    color: theme.palette.text.secondary,
  },
  statsCard: {
    marginBottom: theme.spacing(3),
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
  },
  progress: {
    margin: theme.spacing(2),
  },
}));

const Lend = () => {
  const classes = useStyles();
  const { 
    account, 
    borrowableToken, 
    lendingContract, 
    borrowableBalance,
    approveToken,
    isLoading,
    refreshData
  } = useWeb3();

  // Form state
  const [lendAmount, setLendAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  
  // LP Provider data
  const [lpProviderDetails, setLpProviderDetails] = useState(null);
  const [poolStats, setPoolStats] = useState({
    totalProvided: '0',
    activeLoans: 0,
    averageInterestRate: '0',
  });

  // Load LP provider details and pool stats
  useEffect(() => {
    const loadProviderData = async () => {
      if (!account || !lendingContract) return;
      
      try {
        // Get LP provider details
        const providerDetails = await lendingContract.getLpProviderDetails(account);
        setLpProviderDetails({
          amountProvided: providerDetails.amountProvided.toString(),
          sharePercentage: providerDetails.sharePercentage.toString(),
        });
        
        // Get all LP providers to calculate total pool size
        const providers = await lendingContract.getAllLpProviders();
        let totalProvided = ethers.BigNumber.from(0);
        let activeLoanCount = 0;
        
        // For demonstration, we're just setting mock values
        // In a real application, you would iterate through providers and query loan data
        totalProvided = ethers.utils.parseEther('1000'); // Example value
        activeLoanCount = 12; // Example value
        
        setPoolStats({
          totalProvided: totalProvided.toString(),
          activeLoans: activeLoanCount,
          averageInterestRate: '5.2', // Example value in percent
        });
      } catch (error) {
        console.error('Error loading provider data:', error);
      }
    };
    
    loadProviderData();
  }, [account, lendingContract]);

  useEffect(() => {
    if (account) {
      refreshData();
    }
  }, [account, refreshData]);

  // Handle lend amount change
  const handleLendAmountChange = (e) => {
    setLendAmount(e.target.value);
    setIsApproved(false);
  };

  // Handle withdraw amount change
  const handleWithdrawAmountChange = (e) => {
    setWithdrawAmount(e.target.value);
  };

  // Handle approve tokens
  const handleApproveTokens = async () => {
    if (!borrowableToken || !lendAmount) return;
    
    try {
      const amount = ethers.utils.parseEther(lendAmount);
      const approved = await approveToken(borrowableToken, amount);
      if (approved) {
        setIsApproved(true);
      }
    } catch (error) {
      console.error('Error approving tokens:', error);
    }
  };

  // Handle provide liquidity
  const handleProvideLiquidity = async () => {
    if (!lendingContract || !lendAmount) return;
    
    try {
      const amount = ethers.utils.parseEther(lendAmount);
      const tx = await lendingContract.provideLiquidity(amount);
      await tx.wait();
      
      // Reset form and refresh data
      setLendAmount('');
      setIsApproved(false);
      refreshData();
      
      // Reload LP provider details
      const providerDetails = await lendingContract.getLpProviderDetails(account);
      setLpProviderDetails({
        amountProvided: providerDetails.amountProvided.toString(),
        sharePercentage: providerDetails.sharePercentage.toString(),
      });
    } catch (error) {
      console.error('Error providing liquidity:', error);
    }
  };

  // Handle withdraw liquidity
  const handleWithdrawLiquidity = async () => {
    if (!lendingContract || !withdrawAmount) return;
    
    try {
      const amount = ethers.utils.parseEther(withdrawAmount);
      const tx = await lendingContract.withdrawLiquidity(amount);
      await tx.wait();
      
      // Reset form and refresh data
      setWithdrawAmount('');
      refreshData();
      
      // Reload LP provider details
      const providerDetails = await lendingContract.getLpProviderDetails(account);
      setLpProviderDetails({
        amountProvided: providerDetails.amountProvided.toString(),
        sharePercentage: providerDetails.sharePercentage.toString(),
      });
    } catch (error) {
      console.error('Error withdrawing liquidity:', error);
    }
  };

  if (isLoading) {
    return (
      <Container className={classes.container} maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress className={classes.progress} />
          <Typography variant="h6">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container className={classes.container} maxWidth="md">
      <Typography variant="h4" className={classes.title}>
        Provide Liquidity
      </Typography>
      
      {/* Pool Stats */}
      <Card className={classes.statsCard}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lending Pool Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" className={classes.label}>
                Total Liquidity
              </Typography>
              <Typography variant="h6">
                {formatTokenAmount(poolStats.totalProvided)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" className={classes.label}>
                Active Loans
              </Typography>
              <Typography variant="h6">
                {poolStats.activeLoans}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" className={classes.label}>
                Avg. Interest Rate
              </Typography>
              <Typography variant="h6">
                {poolStats.averageInterestRate}%
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Your Balances */}
      <Paper className={classes.paper}>
        <Typography variant="h6" gutterBottom>
          Your Balance
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body1">
              Available to Lend: {formatTokenAmount(borrowableBalance)}
            </Typography>
          </Grid>
          {lpProviderDetails && (
            <>
              <Grid item xs={12}>
                <Divider className={classes.divider} />
              </Grid>
              <Grid item xs={6}>
                <Typography className={classes.label}>
                  Amount Provided:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography className={classes.valueDisplay}>
                  {formatTokenAmount(lpProviderDetails.amountProvided)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography className={classes.label}>
                  Pool Share:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography className={classes.valueDisplay}>
                  {(lpProviderDetails.sharePercentage / 100).toFixed(2)}%
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      
      {/* Lending Form */}
      <Paper className={classes.paper}>
        <Typography variant="h6" gutterBottom>
          Provide Liquidity
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Amount to Lend"
              variant="outlined"
              fullWidth
              type="number"
              value={lendAmount}
              onChange={handleLendAmountChange}
              InputProps={{
                inputProps: { min: 0, step: 0.001 }
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            {!isApproved ? (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleApproveTokens}
                disabled={isLoading || !lendAmount || parseFloat(lendAmount) <= 0}
                className={classes.button}
              >
                Approve Tokens
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleProvideLiquidity}
                disabled={isLoading || !lendAmount || parseFloat(lendAmount) <= 0}
                className={classes.button}
              >
                Provide Liquidity
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Withdraw Form */}
      {lpProviderDetails && parseFloat(lpProviderDetails.amountProvided) > 0 && (
        <Paper className={classes.paper}>
          <Typography variant="h6" gutterBottom>
            Withdraw Liquidity
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Amount to Withdraw"
                variant="outlined"
                fullWidth
                type="number"
                value={withdrawAmount}
                onChange={handleWithdrawAmountChange}
                InputProps={{
                  inputProps: { 
                    min: 0,
                    max: ethers.utils.formatEther(lpProviderDetails.amountProvided),
                    step: 0.001 
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={handleWithdrawLiquidity}
                disabled={
                  isLoading || 
                  !withdrawAmount || 
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > parseFloat(ethers.utils.formatEther(lpProviderDetails.amountProvided))
                }
                className={classes.button}
              >
                Withdraw Liquidity
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Information Section */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          About Providing Liquidity
        </Typography>
        <Typography variant="body2" paragraph>
          • As a liquidity provider, you contribute to the lending pool that borrowers can access.
        </Typography>
        <Typography variant="body2" paragraph>
          • You earn interest from loans proportional to your share of the lending pool.
        </Typography>
        <Typography variant="body2" paragraph>
          • Our under-collateralized lending model is secured by Uniswap V4 hooks and risk assessment algorithms.
        </Typography>
        <Typography variant="body2" paragraph>
          • You can withdraw your liquidity at any time, subject to availability (funds not currently loaned out).
        </Typography>
      </Box>
    </Container>
  );
};

export default Lend;