import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Slider, 
  Box,
  Card,
  CardContent,
  Divider,
  makeStyles
} from '@material-ui/core';
import { useWeb3 } from '../../contexts/Web3Context';
import { formatTokenAmount, LTV_RATIO, DEFAULT_REPAYMENT_PERIOD } from '../../utils/constants';
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
  slider: {
    marginTop: theme.spacing(3),
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
}));

const Borrow = () => {
  const classes = useStyles();
  const { 
    account, 
    collateralToken, 
    borrowableToken, 
    lendingContract, 
    collateralBalance, 
    borrowableBalance,
    activeLoan,
    approveToken,
    takeLoan,
    repayLoan,
    isLoading,
    refreshData
  } = useWeb3();

  // Form state
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [duration, setDuration] = useState(DEFAULT_REPAYMENT_PERIOD);
  const [isApproved, setIsApproved] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');

  // Calculate maximum borrow amount based on collateral
  const calculateMaxBorrow = () => {
    if (!collateralAmount) return '0';
    try {
      const collateralWei = ethers.utils.parseEther(collateralAmount);
      const maxBorrowWei = collateralWei.mul(Math.floor(LTV_RATIO * 100)).div(100);
      return ethers.utils.formatEther(maxBorrowWei);
    } catch (error) {
      console.error('Error calculating max borrow:', error);
      return '0';
    }
  };

  // Update calculated values when inputs change
  useEffect(() => {
    if (collateralAmount) {
      const maxBorrow = calculateMaxBorrow();
      if (parseFloat(borrowAmount) > parseFloat(maxBorrow)) {
        setBorrowAmount(maxBorrow);
      }
    }
  }, [collateralAmount, borrowAmount]);

  // Check for sufficient balance and refresh data on mount
  useEffect(() => {
    if (account) {
      refreshData();
    }
  }, [account, refreshData]);

  // Handle collateral input change
  const handleCollateralChange = (e) => {
    setCollateralAmount(e.target.value);
    setIsApproved(false);
  };

  // Handle borrow amount input change
  const handleBorrowAmountChange = (e) => {
    const value = e.target.value;
    const maxBorrow = calculateMaxBorrow();
    
    if (parseFloat(value) > parseFloat(maxBorrow)) {
      setBorrowAmount(maxBorrow);
    } else {
      setBorrowAmount(value);
    }
  };

  // Handle duration slider change
  const handleDurationChange = (event, newValue) => {
    setDuration(newValue);
  };

  // Handle approve collateral
  const handleApproveCollateral = async () => {
    if (!collateralToken || !collateralAmount) return;
    
    try {
      const amount = ethers.utils.parseEther(collateralAmount);
      const approved = await approveToken(collateralToken, amount);
      if (approved) {
        setIsApproved(true);
      }
    } catch (error) {
      console.error('Error approving collateral:', error);
    }
  };

  // Handle take loan
  const handleTakeLoan = async () => {
    if (!lendingContract || !collateralAmount || !borrowAmount) return;
    
    try {
      const collateralWei = ethers.utils.parseEther(collateralAmount);
      const borrowWei = ethers.utils.parseEther(borrowAmount);
      
      await takeLoan(borrowWei, collateralWei, duration);
      
      // Reset form after successful loan
      setCollateralAmount('');
      setBorrowAmount('');
      setIsApproved(false);
    } catch (error) {
      console.error('Error taking loan:', error);
    }
  };

  // Handle repay amount change
  const handleRepayAmountChange = (e) => {
    setRepayAmount(e.target.value);
  };

  // Handle repay loan
  const handleRepayLoan = async () => {
    if (!lendingContract || !repayAmount) return;
    
    try {
      const repayWei = ethers.utils.parseEther(repayAmount);
      await repayLoan(repayWei);
      setRepayAmount('');
    } catch (error) {
      console.error('Error repaying loan:', error);
    }
  };

  return (
    <Container className={classes.container} maxWidth="md">
      <Typography variant="h4" className={classes.title}>
        Borrow Funds
      </Typography>
      
      {/* Balances Info */}
      <Paper className={classes.paper}>
        <Typography variant="h6" gutterBottom>
          Your Balances
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              Collateral Token: {formatTokenAmount(collateralBalance)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              Borrowable Token: {formatTokenAmount(borrowableBalance)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {activeLoan && !activeLoan.repaid ? (
        // Active Loan Display
        <Paper className={classes.paper}>
          <Typography variant="h6" gutterBottom>
            Your Active Loan
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography className={classes.label}>Borrowed Amount:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography className={classes.valueDisplay}>
                {formatTokenAmount(activeLoan.amount)}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography className={classes.label}>Collateral:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography className={classes.valueDisplay}>
                {formatTokenAmount(activeLoan.collateral)}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography className={classes.label}>Interest Rate:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography className={classes.valueDisplay}>
                {(activeLoan.interestRate / 100).toFixed(2)}%
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider className={classes.divider} />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1">Repay Loan</Typography>
              <TextField
                label="Repayment Amount"
                variant="outlined"
                fullWidth
                type="number"
                value={repayAmount}
                onChange={handleRepayAmountChange}
                margin="normal"
                InputProps={{
                  inputProps: { min: 0, step: 0.001 }
                }}
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                className={classes.button}
                onClick={handleRepayLoan}
                disabled={isLoading || !repayAmount || parseFloat(repayAmount) <= 0}
              >
                Repay Loan
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        // New Loan Form
        <Paper className={classes.paper}>
          <Typography variant="h6" gutterBottom>
            Take a New Loan
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Collateral Amount"
                variant="outlined"
                fullWidth
                type="number"
                value={collateralAmount}
                onChange={handleCollateralChange}
                InputProps={{
                  inputProps: { min: 0, step: 0.001 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Borrow Amount"
                variant="outlined"
                fullWidth
                type="number"
                value={borrowAmount}
                onChange={handleBorrowAmountChange}
                InputProps={{
                  inputProps: { min: 0, step: 0.001 }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Loan Duration: {duration} days
              </Typography>
              <Slider
                value={duration}
                onChange={handleDurationChange}
                min={7}
                max={90}
                step={1}
                marks={[
                  { value: 7, label: '7d' },
                  { value: 30, label: '30d' },
                  { value: 60, label: '60d' },
                  { value: 90, label: '90d' },
                ]}
                className={classes.slider}
              />
            </Grid>
            
            {/* Loan details card */}
            <Grid item xs={12}>
              <Card className={classes.infoCard}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Loan Details
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography className={classes.label}>
                        Max Borrowable:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography className={classes.valueDisplay}>
                        {calculateMaxBorrow()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography className={classes.label}>
                        Collateralization Ratio:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography className={classes.valueDisplay}>
                        {borrowAmount && collateralAmount 
                          ? ((parseFloat(collateralAmount) / parseFloat(borrowAmount)) * 100).toFixed(2) + '%' 
                          : '0%'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography className={classes.label}>
                        Loan Duration:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography className={classes.valueDisplay}>
                        {duration} days
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              {!isApproved ? (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleApproveCollateral}
                  disabled={isLoading || !collateralAmount || parseFloat(collateralAmount) <= 0}
                  className={classes.button}
                >
                  Approve Collateral
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleTakeLoan}
                  disabled={
                    isLoading || 
                    !borrowAmount || 
                    parseFloat(borrowAmount) <= 0 ||
                    !collateralAmount ||
                    parseFloat(collateralAmount) <= 0
                  }
                  className={classes.button}
                >
                  Take Loan
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Risk Information */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Important Information
        </Typography>
        <Typography variant="body2" paragraph>
          • Loans are under-collateralized, meaning you can borrow more than traditional platforms would allow.
        </Typography>
        <Typography variant="body2" paragraph>
          • The platform uses Uniswap V4 hooks for real-time risk assessment and management.
        </Typography>
        <Typography variant="body2" paragraph>
          • Ensure you can repay your loan on time to avoid potential liquidation of your collateral.
        </Typography>
        <Typography variant="body2" paragraph>
          • Interest rates may vary based on market conditions and your borrowing history.
        </Typography>
      </Box>
    </Container>
  );
};

export default Borrow; 