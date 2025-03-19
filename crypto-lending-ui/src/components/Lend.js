import React, { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Tooltip,
  Chip
} from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
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
  table: {
    background: 'transparent',
  },
  tableContainer: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
    marginTop: theme.spacing(3),
  },
  tableHead: {
    '& th': {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      color: theme.palette.primary.main,
      fontWeight: 600,
      fontFamily: '"Roboto Mono", monospace',
      borderBottom: `1px solid ${theme.palette.primary.main}`,
    },
  },
  tableRow: {
    '&:nth-of-type(odd)': {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    '&:hover': {
      backgroundColor: 'rgba(0, 245, 255, 0.05)',
    },
  },
  tableCell: {
    color: theme.palette.text.primary,
    fontFamily: '"Roboto Mono", monospace',
    borderBottom: '1px solid rgba(0, 245, 255, 0.1)',
  },
  assetPair: {
    display: 'flex',
    alignItems: 'center',
  },
  tokenPair: {
    display: 'flex',
    alignItems: 'center',
  },
  apy: {
    color: '#00e676',
    fontWeight: 600,
  },
  chip: {
    margin: theme.spacing(0.5),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: `1px solid ${theme.palette.primary.main}`,
    color: theme.palette.text.primary,
    '&.featured': {
      backgroundColor: 'rgba(0, 245, 255, 0.1)',
      boxShadow: `0 0 8px rgba(0, 245, 255, 0.3)`,
    },
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
}));

// Mock data for liquidity pools
const liquidityPools = [
  { 
    id: 1, 
    baseAsset: 'ETH', 
    quoteAsset: 'DAI', 
    apy: 5.8, 
    tvl: 1245000, 
    utilization: 68, 
    featured: true 
  },
  { 
    id: 2, 
    baseAsset: 'WBTC', 
    quoteAsset: 'USDC', 
    apy: 4.2, 
    tvl: 3750000, 
    utilization: 72, 
    featured: true 
  },
  { 
    id: 3, 
    baseAsset: 'ETH', 
    quoteAsset: 'USDC', 
    apy: 4.9, 
    tvl: 2100000, 
    utilization: 76, 
    featured: false 
  },
  { 
    id: 4, 
    baseAsset: 'ETH', 
    quoteAsset: 'USDT', 
    apy: 4.5, 
    tvl: 1870000, 
    utilization: 65, 
    featured: false 
  },
  { 
    id: 5, 
    baseAsset: 'WBTC', 
    quoteAsset: 'DAI', 
    apy: 3.8, 
    tvl: 1950000, 
    utilization: 58, 
    featured: false 
  }
];

const Lend = () => {
  const classes = useStyles();
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  
  const [baseAsset, setBaseAsset] = useState('');
  const [quoteAsset, setQuoteAsset] = useState('');
  const [amount, setAmount] = useState('');
  
  // Get the list of tokens for the current network
  const tokens = chain && SUPPORTED_CHAIN_IDS.includes(chain.id) 
    ? SUPPORTED_TOKENS[chain.id] 
    : SUPPORTED_TOKENS[1]; // Default to mainnet if not on a supported chain

  // Handle token selection
  const handleBaseAssetChange = (event) => {
    setBaseAsset(event.target.value);
  };

  // Handle quote asset selection
  const handleQuoteAssetChange = (event) => {
    setQuoteAsset(event.target.value);
  };

  // Handle amount input
  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };

  // Handle providing liquidity
  const handleProvideLiquidity = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first', {
        className: 'cyber-toast error-toast',
        bodyClassName: 'cyber-toast-body',
        progressClassName: 'cyber-toast-progress',
      });
      return;
    }

    // Perform liquidity provision logic here
    toast.info(`Providing liquidity for ${amount} ${baseAsset}/${quoteAsset} pair...`, {
      className: 'cyber-toast',
      bodyClassName: 'cyber-toast-body',
      progressClassName: 'cyber-toast-progress',
    });
  };

  // Format currency with commas
  const formatCurrency = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className={classes.root}>
      <Container className={classes.container} maxWidth="lg">
        <Typography variant="h4" component="h1" className={classes.header}>
          Lend Assets
        </Typography>

        <Paper className={classes.paper}>
          <Typography variant="h6" className={classes.sectionTitle}>
            Dual-Asset Liquidity Pools
          </Typography>
          
          <Typography variant="body1" paragraph>
            Provide liquidity to pairs of assets and earn interest from borrowers. Your funds are used to create deep liquidity pools 
            that allow borrowers to take loans with your assets as collateral.
          </Typography>
          
          <Box className={classes.terminalBox}>
            <div className={classes.scanLine}></div>
            <Box className={classes.terminalContent}>
              <Typography variant="body2">Calculating potential returns:</Typography>
              <Typography variant="body2">
                <span className={classes.highlightedText}>Base APY: </span>3.5% - 6.0%
              </Typography>
              <Typography variant="body2">
                <span className={classes.highlightedText}>Utilization bonus: </span>+0.5% - 2.0%
              </Typography>
              <Typography variant="body2">
                <span className={classes.highlightedText}>Liquidity mining rewards: </span>+1.0% - 2.5%
              </Typography>
              <Typography variant="body2" style={{ marginTop: 8 }}>
                <span className={classes.highlightedText}>Total APY: </span>5.0% - 10.5%
              </Typography>
            </Box>
          </Box>
          
          <TableContainer className={classes.tableContainer}>
            <Table className={classes.table} aria-label="liquidity pools table">
              <TableHead className={classes.tableHead}>
                <TableRow>
                  <TableCell>Asset Pair</TableCell>
                  <TableCell align="right">APY</TableCell>
                  <TableCell align="right">TVL</TableCell>
                  <TableCell align="right">Utilization</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {liquidityPools.map((pool) => (
                  <TableRow key={pool.id} className={classes.tableRow}>
                    <TableCell component="th" scope="row" className={classes.tableCell}>
                      <Box className={classes.assetPair}>
                        <Box className={classes.tokenPair}>
                          {pool.baseAsset}/{pool.quoteAsset}
                        </Box>
                        {pool.featured && (
                          <Chip 
                            label="Featured" 
                            size="small" 
                            className={`${classes.chip} featured`} 
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right" className={`${classes.tableCell} ${classes.apy}`}>
                      {pool.apy}%
                      <TrendingUpIcon fontSize="small" style={{ marginLeft: 4, verticalAlign: 'middle' }} />
                    </TableCell>
                    <TableCell align="right" className={classes.tableCell}>
                      ${formatCurrency(pool.tvl)}
                    </TableCell>
                    <TableCell align="right" className={classes.tableCell}>
                      {pool.utilization}%
                    </TableCell>
                    <TableCell align="right" className={classes.tableCell}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => {
                          setBaseAsset(pool.baseAsset);
                          setQuoteAsset(pool.quoteAsset);
                        }}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box className={classes.poolContainer}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper className={classes.paper}>
                <Typography variant="h6" className={classes.sectionTitle}>
                  Provide Liquidity
                </Typography>
                
                <FormControl variant="outlined" className={classes.formControl}>
                  <Select
                    value={baseAsset}
                    onChange={handleBaseAssetChange}
                    className={classes.tokenSelect}
                    disabled={!isConnected}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select Base Asset
                    </MenuItem>
                    {tokens.filter(t => t.symbol !== quoteAsset).map((token) => (
                      <MenuItem key={token.symbol} value={token.symbol} className={classes.tokenMenuItem}>
                        {token.symbol} - {token.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl variant="outlined" className={classes.formControl}>
                  <Select
                    value={quoteAsset}
                    onChange={handleQuoteAssetChange}
                    className={classes.tokenSelect}
                    disabled={!isConnected || !baseAsset}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select Quote Asset
                    </MenuItem>
                    {tokens.filter(t => t.symbol !== baseAsset).map((token) => (
                      <MenuItem key={token.symbol} value={token.symbol} className={classes.tokenMenuItem}>
                        {token.symbol} - {token.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Amount"
                  variant="outlined"
                  fullWidth
                  value={amount}
                  onChange={handleAmountChange}
                  className={classes.formControl}
                  disabled={!baseAsset || !quoteAsset || !isConnected}
                  InputProps={{
                    endAdornment: baseAsset ? (
                      <InputAdornment position="end">{baseAsset}</InputAdornment>
                    ) : null,
                  }}
                />

                <Typography variant="body2" gutterBottom>
                  Estimated APY: <span style={{ color: '#00e676' }}>
                    {baseAsset && quoteAsset ? 
                      liquidityPools.find(p => p.baseAsset === baseAsset && p.quoteAsset === quoteAsset)?.apy || '4.5' 
                      : '0.0'}%
                  </span>
                  <Tooltip
                    title="Annual Percentage Yield - The annualized rate of return for your provided liquidity"
                    classes={{ tooltip: classes.infoTooltip }}
                    arrow
                  >
                    <InfoIcon className={classes.infoIcon} fontSize="small" />
                  </Tooltip>
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  className={classes.actionButton}
                  onClick={handleProvideLiquidity}
                  disabled={!isConnected || !baseAsset || !quoteAsset || !amount}
                >
                  Provide Liquidity
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper className={classes.paper}>
                <Typography variant="h6" className={classes.sectionTitle}>
                  Pool Information
                </Typography>
                
                {baseAsset && quoteAsset ? (
                  <React.Fragment>
                    <Typography variant="body1" paragraph>
                      <strong>{baseAsset}/{quoteAsset} Liquidity Pool</strong>
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">Total Value Locked:</Typography>
                      <Typography variant="body2" className={classes.highlightedText}>
                        ${formatCurrency(liquidityPools.find(p => 
                          p.baseAsset === baseAsset && p.quoteAsset === quoteAsset
                        )?.tvl || 0)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">Current APY:</Typography>
                      <Typography variant="body2" style={{ color: '#00e676' }}>
                        {liquidityPools.find(p => 
                          p.baseAsset === baseAsset && p.quoteAsset === quoteAsset
                        )?.apy || 0}%
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">Pool Utilization:</Typography>
                      <Typography variant="body2" className={classes.highlightedText}>
                        {liquidityPools.find(p => 
                          p.baseAsset === baseAsset && p.quoteAsset === quoteAsset
                        )?.utilization || 0}%
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">Lock-up Period:</Typography>
                      <Typography variant="body2" className={classes.highlightedText}>
                        None
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">Withdrawal Fee:</Typography>
                      <Typography variant="body2" className={classes.highlightedText}>
                        0.1%
                      </Typography>
                    </Box>
                    
                    <Box className={classes.terminalBox} mt={4}>
                      <div className={classes.scanLine}></div>
                      <Box className={classes.terminalContent}>
                        <Typography variant="body2">Projected earnings:</Typography>
                        <Typography variant="body2">
                          <span className={classes.highlightedText}>Daily: </span>
                          ${amount ? ((parseFloat(amount) * (liquidityPools.find(p => 
                            p.baseAsset === baseAsset && p.quoteAsset === quoteAsset
                          )?.apy || 4.5) / 100) / 365).toFixed(2) : '0.00'}
                        </Typography>
                        <Typography variant="body2">
                          <span className={classes.highlightedText}>Monthly: </span>
                          ${amount ? ((parseFloat(amount) * (liquidityPools.find(p => 
                            p.baseAsset === baseAsset && p.quoteAsset === quoteAsset
                          )?.apy || 4.5) / 100) / 12).toFixed(2) : '0.00'}
                        </Typography>
                        <Typography variant="body2">
                          <span className={classes.highlightedText}>Yearly: </span>
                          ${amount ? (parseFloat(amount) * (liquidityPools.find(p => 
                            p.baseAsset === baseAsset && p.quoteAsset === quoteAsset
                          )?.apy || 4.5) / 100).toFixed(2) : '0.00'}
                        </Typography>
                      </Box>
                    </Box>
                  </React.Fragment>
                ) : (
                  <Typography variant="body1" align="center" style={{ padding: 32 }}>
                    Select a base asset and quote asset to view pool information
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </div>
  );
};

export default Lend; 