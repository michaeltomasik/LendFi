import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  makeStyles,
  Tabs,
  Tab,
  Button,
  LinearProgress,
  Divider,
  Card,
  CardContent,
  Chip
} from '@material-ui/core';
import AccountBalanceIcon from '@material-ui/icons/AccountBalance';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import MoneyIcon from '@material-ui/icons/Money';
import { useAccount } from 'wagmi';

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
  overviewCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: `1px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 10px rgba(0, 245, 255, 0.2)`,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardIcon: {
    color: theme.palette.primary.main,
    fontSize: 40,
    marginBottom: theme.spacing(2),
  },
  cardHeader: {
    fontFamily: '"Roboto Mono", monospace',
    marginBottom: theme.spacing(1),
  },
  cardValue: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    fontSize: '1.75rem',
    fontFamily: '"Roboto Mono", monospace',
    textShadow: `0 0 10px rgba(0, 245, 255, 0.5)`,
  },
  tabs: {
    marginBottom: theme.spacing(3),
    '& .MuiTabs-indicator': {
      backgroundColor: theme.palette.primary.main,
      height: 3,
      boxShadow: `0 0 8px ${theme.palette.primary.main}`,
    },
  },
  tab: {
    fontFamily: '"Roboto Mono", monospace',
    letterSpacing: 1,
    minWidth: 100,
    '&.Mui-selected': {
      color: theme.palette.primary.main,
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
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  barRoot: {
    borderRadius: 4,
  },
  barLow: {
    backgroundColor: '#00e676',
  },
  barMedium: {
    backgroundColor: '#ffeb3b',
  },
  barHigh: {
    backgroundColor: '#ff9800',
  },
  barCritical: {
    backgroundColor: '#f44336',
  },
  divider: {
    margin: theme.spacing(3, 0),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  positionItem: {
    padding: theme.spacing(2),
    margin: theme.spacing(0, 0, 2, 0),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    '&:hover': {
      borderColor: 'rgba(0, 245, 255, 0.3)',
      boxShadow: '0 0 10px rgba(0, 245, 255, 0.1)',
    },
  },
  assetPair: {
    fontFamily: '"Roboto Mono", monospace',
    fontWeight: 600,
  },
  healthChip: {
    margin: theme.spacing(0, 0.5),
    height: 24,
  },
  healthExcellent: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    color: '#00e676',
    border: '1px solid rgba(0, 230, 118, 0.5)',
  },
  healthGood: {
    backgroundColor: 'rgba(255, 235, 59, 0.2)',
    color: '#ffeb3b',
    border: '1px solid rgba(255, 235, 59, 0.5)',
  },
  healthWarning: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    color: '#ff9800',
    border: '1px solid rgba(255, 152, 0, 0.5)',
  },
  healthDanger: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    color: '#f44336',
    border: '1px solid rgba(244, 67, 54, 0.5)',
  },
  actionButton: {
    marginRight: theme.spacing(1),
    marginTop: theme.spacing(1),
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
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4),
    opacity: 0.7,
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

// Mock data for positions
const lendingPositions = [
  { id: 1, baseAsset: 'ETH', quoteAsset: 'DAI', amount: 5, value: 15000, apy: 5.8 },
  { id: 2, baseAsset: 'WBTC', quoteAsset: 'USDC', amount: 0.75, value: 22500, apy: 4.2 },
];

const borrowPositions = [
  { 
    id: 1, 
    baseAsset: 'ETH', 
    quoteAsset: 'DAI', 
    borrowed: 10000, 
    collateral: 8, 
    collateralValue: 24000, 
    healthFactor: 2.4,
    ltv: 42,
    interestRate: 3.5
  },
  { 
    id: 2, 
    baseAsset: 'WBTC', 
    quoteAsset: 'USDC', 
    borrowed: 5000, 
    collateral: 0.2, 
    collateralValue: 6000, 
    healthFactor: 1.2,
    ltv: 83,
    interestRate: 4.0
  },
];

const Dashboard = () => {
  const classes = useStyles();
  const { isConnected, address } = useAccount();
  const [tabValue, setTabValue] = useState(0);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format currency with commas
  const formatCurrency = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Calculate health factor color and class
  const getHealthFactorColor = (factor) => {
    if (factor > 2) return classes.healthExcellent;
    if (factor > 1.5) return classes.healthGood;
    if (factor > 1) return classes.healthWarning;
    return classes.healthDanger;
  };

  // Calculate health factor text
  const getHealthFactorText = (factor) => {
    if (factor > 2) return 'Excellent';
    if (factor > 1.5) return 'Good';
    if (factor > 1) return 'Warning';
    return 'Danger';
  };

  // Calculate progress bar color class
  const getProgressBarColorClass = (value) => {
    if (value < 40) return classes.barLow;
    if (value < 60) return classes.barMedium;
    if (value < 80) return classes.barHigh;
    return classes.barCritical;
  };

  // Calculate total values
  const totalLending = lendingPositions.reduce((total, pos) => total + pos.value, 0);
  const totalBorrowing = borrowPositions.reduce((total, pos) => total + pos.borrowed, 0);
  const totalCollateral = borrowPositions.reduce((total, pos) => total + pos.collateralValue, 0);
  const netPosition = totalLending + totalCollateral - totalBorrowing;

  return (
    <div className={classes.root}>
      <Container className={classes.container} maxWidth="lg">
        <Typography variant="h4" component="h1" className={classes.header}>
          Dashboard
        </Typography>

        {isConnected ? (
          <>
            <Grid container spacing={4} style={{ marginBottom: 32 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card className={classes.overviewCard}>
                  <CardContent>
                    <AccountBalanceIcon className={classes.cardIcon} />
                    <Typography variant="h6" className={classes.cardHeader}>
                      Total Lending
                    </Typography>
                    <Typography variant="h4" className={classes.cardValue}>
                      ${formatCurrency(totalLending)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className={classes.overviewCard}>
                  <CardContent>
                    <TrendingUpIcon className={classes.cardIcon} />
                    <Typography variant="h6" className={classes.cardHeader}>
                      Total Borrowing
                    </Typography>
                    <Typography variant="h4" className={classes.cardValue}>
                      ${formatCurrency(totalBorrowing)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className={classes.overviewCard}>
                  <CardContent>
                    <MoneyIcon className={classes.cardIcon} />
                    <Typography variant="h6" className={classes.cardHeader}>
                      Total Collateral
                    </Typography>
                    <Typography variant="h4" className={classes.cardValue}>
                      ${formatCurrency(totalCollateral)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className={classes.overviewCard}>
                  <CardContent>
                    <AccountBalanceIcon className={classes.cardIcon} />
                    <Typography variant="h6" className={classes.cardHeader}>
                      Net Position
                    </Typography>
                    <Typography variant="h4" className={classes.cardValue}>
                      ${formatCurrency(netPosition)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Paper className={classes.paper}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="inherit"
                className={classes.tabs}
              >
                <Tab label="Lending" className={classes.tab} />
                <Tab label="Borrowing" className={classes.tab} />
              </Tabs>

              {/* Lending Tab */}
              {tabValue === 0 && (
                <>
                  <Typography variant="h6" className={classes.sectionTitle}>
                    Your Lending Positions
                  </Typography>
                  
                  {lendingPositions.length > 0 ? (
                    lendingPositions.map((position) => (
                      <Box key={position.id} className={classes.positionItem}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body1" className={classes.assetPair}>
                              {position.baseAsset}/{position.quoteAsset}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {position.amount} {position.baseAsset}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="textSecondary">
                              Value
                            </Typography>
                            <Typography variant="body1">
                              ${formatCurrency(position.value)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={2}>
                            <Typography variant="body2" color="textSecondary">
                              APY
                            </Typography>
                            <Typography variant="body1" style={{ color: '#00e676' }}>
                              {position.apy}%
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              className={classes.actionButton}
                            >
                              Withdraw
                            </Button>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              className={classes.actionButton}
                            >
                              Add
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    ))
                  ) : (
                    <Box className={classes.emptyState}>
                      <Typography variant="body1">
                        You have no active lending positions
                      </Typography>
                    </Box>
                  )}
                  
                  <Box className={classes.terminalBox}>
                    <div className={classes.scanLine}></div>
                    <Box className={classes.terminalContent}>
                      <Typography variant="body2">
                        <span className={classes.highlightedText}>Total Accrued Interest: </span>
                        $275.43
                      </Typography>
                      <Typography variant="body2">
                        <span className={classes.highlightedText}>Estimated Daily Earnings: </span>
                        $5.82
                      </Typography>
                      <Typography variant="body2">
                        <span className={classes.highlightedText}>Estimated Monthly Earnings: </span>
                        $174.51
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}

              {/* Borrowing Tab */}
              {tabValue === 1 && (
                <>
                  <Typography variant="h6" className={classes.sectionTitle}>
                    Your Borrowing Positions
                  </Typography>
                  
                  {borrowPositions.length > 0 ? (
                    borrowPositions.map((position) => (
                      <Box key={position.id} className={classes.positionItem}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body1" className={classes.assetPair}>
                              {position.baseAsset}/{position.quoteAsset}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Collateral: {position.collateral} {position.baseAsset}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="textSecondary">
                              Borrowed
                            </Typography>
                            <Typography variant="body1">
                              ${formatCurrency(position.borrowed)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={2}>
                            <Typography variant="body2" color="textSecondary">
                              Health Factor
                            </Typography>
                            <Box display="flex" alignItems="center">
                              <Chip
                                label={getHealthFactorText(position.healthFactor)}
                                size="small"
                                className={`${classes.healthChip} ${getHealthFactorColor(position.healthFactor)}`}
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              className={classes.actionButton}
                            >
                              Repay
                            </Button>
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              className={classes.actionButton}
                            >
                              Add Collateral
                            </Button>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              Loan to Value (LTV): {position.ltv}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={position.ltv}
                              classes={{
                                root: classes.progressBar,
                                bar: `${classes.barRoot} ${getProgressBarColorClass(position.ltv)}`,
                              }}
                            />
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                  Interest Rate: {position.interestRate}%
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                  Liquidation at: 85% LTV
                                </Typography>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Box>
                    ))
                  ) : (
                    <Box className={classes.emptyState}>
                      <Typography variant="body1">
                        You have no active borrowing positions
                      </Typography>
                    </Box>
                  )}
                  
                  <Box className={classes.terminalBox}>
                    <div className={classes.scanLine}></div>
                    <Box className={classes.terminalContent}>
                      <Typography variant="body2">
                        <span className={classes.highlightedText}>Total Debt: </span>
                        ${formatCurrency(totalBorrowing)}
                      </Typography>
                      <Typography variant="body2">
                        <span className={classes.highlightedText}>Total Collateral Value: </span>
                        ${formatCurrency(totalCollateral)}
                      </Typography>
                      <Typography variant="body2">
                        <span className={classes.highlightedText}>Average Health Factor: </span>
                        {(borrowPositions.reduce((sum, pos) => sum + pos.healthFactor, 0) / borrowPositions.length).toFixed(2)}
                      </Typography>
                      <Typography variant="body2">
                        <span className={classes.highlightedText}>Borrowing Power Remaining: </span>
                        ${formatCurrency(totalCollateral * 0.8 - totalBorrowing)}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Paper>
          </>
        ) : (
          <Paper className={classes.paper}>
            <Box className={classes.emptyState}>
              <Typography variant="h6" gutterBottom>
                Connect your wallet to view your dashboard
              </Typography>
              <Typography variant="body1">
                Your lending and borrowing positions will appear here once you connect your wallet
              </Typography>
            </Box>
          </Paper>
        )}
      </Container>
    </div>
  );
};

export default Dashboard; 