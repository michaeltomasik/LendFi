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
  Tooltip
} from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import { useAccount, useNetwork } from 'wagmi';
import { toast } from 'react-toastify';
import { SUPPORTED_TOKENS, SUPPORTED_CHAIN_IDS } from '../constants';

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
}));

const Borrow = () => {
  const classes = useStyles();
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  
  const [selectedToken, setSelectedToken] = useState('');
  const [selectedCollateral, setSelectedCollateral] = useState('');
  const [amount, setAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [ltv, setLtv] = useState(50);
  const [healthFactor, setHealthFactor] = useState(2);
  
  // Get the list of tokens for the current network
  const tokens = chain && SUPPORTED_CHAIN_IDS.includes(chain.id) 
    ? SUPPORTED_TOKENS[chain.id] 
    : SUPPORTED_TOKENS[1]; // Default to mainnet if not on a supported chain

  // Handle token selection
  const handleTokenChange = (event) => {
    setSelectedToken(event.target.value);
  };

  // Handle collateral token selection
  const handleCollateralChange = (event) => {
    setSelectedCollateral(event.target.value);
  };

  // Handle borrow amount input
  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };

  // Handle collateral amount input
  const handleCollateralAmountChange = (event) => {
    setCollateralAmount(event.target.value);
  };

  // Handle LTV slider change
  const handleLtvChange = (event, newValue) => {
    setLtv(newValue);
    // Calculate health factor based on LTV (mock calculation for now)
    setHealthFactor((100 / newValue) * 1.1);
  };

  // Handle borrow submission
  const handleBorrow = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first', {
        className: 'cyber-toast error-toast',
        bodyClassName: 'cyber-toast-body',
        progressClassName: 'cyber-toast-progress',
      });
      return;
    }

    // Perform borrowing logic here
    toast.info(`Borrowing ${amount} ${selectedToken}...`, {
      className: 'cyber-toast',
      bodyClassName: 'cyber-toast-body',
      progressClassName: 'cyber-toast-progress',
    });
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
          Borrow Assets
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper className={classes.paper}>
              <Typography variant="h6" className={classes.sectionTitle}>
                Collateral
              </Typography>
              
              <FormControl variant="outlined" className={classes.formControl}>
                <Select
                  value={selectedCollateral}
                  onChange={handleCollateralChange}
                  className={classes.tokenSelect}
                  disabled={!isConnected}
                >
                  <MenuItem value="" disabled>
                    Select Collateral
                  </MenuItem>
                  {tokens.map((token) => (
                    <MenuItem key={token.symbol} value={token.symbol} className={classes.tokenMenuItem}>
                      {token.symbol} - {token.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Collateral Amount"
                variant="outlined"
                fullWidth
                value={collateralAmount}
                onChange={handleCollateralAmountChange}
                className={classes.formControl}
                disabled={!selectedCollateral || !isConnected}
                InputProps={{
                  endAdornment: selectedCollateral ? (
                    <InputAdornment position="end">{selectedCollateral}</InputAdornment>
                  ) : null,
                }}
              />

              <Typography variant="h6" className={classes.sectionTitle}>
                Loan to Value (LTV) Ratio
              </Typography>
              
              <Slider
                value={ltv}
                onChange={handleLtvChange}
                aria-labelledby="ltv-slider"
                className={classes.slider}
                disabled={!isConnected || !selectedCollateral || !collateralAmount}
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
                Borrow Asset
              </Typography>
              
              <FormControl variant="outlined" className={classes.formControl}>
                <Select
                  value={selectedToken}
                  onChange={handleTokenChange}
                  className={classes.tokenSelect}
                  disabled={!isConnected || !selectedCollateral || !collateralAmount}
                >
                  <MenuItem value="" disabled>
                    Select Asset
                  </MenuItem>
                  {tokens.map((token) => (
                    <MenuItem key={token.symbol} value={token.symbol} className={classes.tokenMenuItem}>
                      {token.symbol} - {token.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Borrow Amount"
                variant="outlined"
                fullWidth
                value={amount}
                onChange={handleAmountChange}
                className={classes.formControl}
                disabled={!selectedToken || !isConnected || !selectedCollateral || !collateralAmount}
                InputProps={{
                  endAdornment: selectedToken ? (
                    <InputAdornment position="end">{selectedToken}</InputAdornment>
                  ) : null,
                }}
              />

              <Typography variant="body2" gutterBottom>
                Interest Rate: <span style={{ color: '#00f5ff' }}>3.5% APR</span>
                <Tooltip
                  title="Annual percentage rate - the cost of borrowing expressed as a yearly percentage"
                  classes={{ tooltip: classes.infoTooltip }}
                  arrow
                >
                  <InfoIcon className={classes.infoIcon} fontSize="small" />
                </Tooltip>
              </Typography>

              <Typography variant="body2" gutterBottom>
                Origination Fee: <span style={{ color: '#00f5ff' }}>0.1%</span>
                <Tooltip
                  title="One-time fee charged when you take out a loan"
                  classes={{ tooltip: classes.infoTooltip }}
                  arrow
                >
                  <InfoIcon className={classes.infoIcon} fontSize="small" />
                </Tooltip>
              </Typography>

              <Typography variant="body2" gutterBottom>
                Max Borrow: <span style={{ color: '#00f5ff' }}>
                  {collateralAmount && selectedCollateral 
                    ? `${(parseFloat(collateralAmount) * ltv / 100).toFixed(2)} worth of ${selectedToken || 'assets'}`
                    : '0.00'
                  }
                </span>
              </Typography>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                className={classes.actionButton}
                onClick={handleBorrow}
                disabled={!isConnected || !selectedToken || !amount || !selectedCollateral || !collateralAmount}
              >
                Borrow {selectedToken}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Borrow; 