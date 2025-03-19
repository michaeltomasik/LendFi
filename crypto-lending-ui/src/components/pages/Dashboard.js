import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Box,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Button,
  Tab,
  Tabs,
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
  tabs: {
    marginBottom: theme.spacing(3),
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
  highlightCard: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    marginBottom: theme.spacing(3),
  },
  warningCard: {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
    marginBottom: theme.spacing(3),
  },
  progress: {
    margin: theme.spacing(2),
  },
  detailItem: {
    margin: theme.spacing(1, 0),
  },
  actions: {
    marginTop: theme.spacing(2),
  },
}));

// TabPanel component for tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

const Dashboard = () => {
  const classes = useStyles();
  const { 
    account, 
    lendingContract, 
    activeLoan,
    isLoading,
    refreshData,
    collateralBalance,
    borrowableBalance
  } = useWeb3();

  // State
  const [tabValue, setTabValue] = useState(0);
  const [lpProviderDetails, setLpProviderDetails] = useState(null);
  const [loanHistory, setLoanHistory] = useState([]);
  
  // Load data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!account || !lendingContract) return;
      
      try {
        // Get LP provider details
        const providerDetails = await lendingContract.getLpProviderDetails(account);
        setLpProviderDetails({
          amountProvided: providerDetails.amountProvided.toString(),
          sharePercentage: providerDetails.sharePercentage.toString(),
        });
        
        // For demo purposes, we'll create mock loan history data
        // In a real app, you would fetch this from events or contract state
        setLoanHistory([
          {
            id: 1,
            amount: ethers.utils.parseEther('0.5').toString(),
            collateral: ethers.utils.parseEther('0.7').toString(),
            startTime: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, // 30 days ago
            endTime: Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60, // 5 days ago
            repaid: true,
            interestPaid: ethers.utils.parseEther('0.025').toString(),
          },
          {
            id: 2,
            amount: ethers.utils.parseEther('1.2').toString(),
            collateral: ethers.utils.parseEther('1.5').toString(),
            startTime: Math.floor(Date.now() / 1000) - 15 * 24 * 60 * 60, // 15 days ago
            endTime: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60, // 2 days ago
            repaid: true,
            interestPaid: ethers.utils.parseEther('0.072').toString(),
          }
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    
    loadDashboardData();
  }, [account, lendingContract]);

  // Refresh data on mount
  useEffect(() => {
    if (account) {
      refreshData();
    }
  }, [account, refreshData]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format timestamp to date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  // Calculate days remaining for active loan
  const calculateDaysRemaining = () => {
    if (!activeLoan) return 0;
    
    const endTime = activeLoan.startTime + activeLoan.duration * 24 * 60 * 60;
    const now = Math.floor(Date.now() / 1000);
    const secondsRemaining = Math.max(0, endTime - now);
    
    return Math.ceil(secondsRemaining / (24 * 60 * 60));
  };

  if (isLoading) {
    return (
      <Container className={classes.container} maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress className={classes.progress} />
          <Typography variant="h6">Loading Dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container className={classes.container} maxWidth="md">
      <Typography variant="h4" className={classes.title}>
        Your Dashboard
      </Typography>
      
      {/* Overview Card */}
      <Card className={classes.highlightCard}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" className={classes.label}>
                Collateral Balance
              </Typography>
              <Typography variant="h6">
                {formatTokenAmount(collateralBalance)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" className={classes.label}>
                Borrowable Balance
              </Typography>
              <Typography variant="h6">
                {formatTokenAmount(borrowableBalance)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" className={classes.label}>
                Active Loans
              </Typography>
              <Typography variant="h6">
                {activeLoan && !activeLoan.repaid ? '1' : '0'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Paper className={classes.paper}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          className={classes.tabs}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Active Loans" {...a11yProps(0)} />
          <Tab label="Loan History" {...a11yProps(1)} />
          <Tab label="Liquidity Provided" {...a11yProps(2)} />
        </Tabs>
        
        {/* Active Loans Tab */}
        <TabPanel value={tabValue} index={0}>
          {activeLoan && !activeLoan.repaid ? (
            <div>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Active Loan Details
                  </Typography>
                </Grid>
                
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.label}>Borrowed Amount:</Typography>
                </Grid>
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.valueDisplay}>
                    {formatTokenAmount(activeLoan.amount)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.label}>Collateral:</Typography>
                </Grid>
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.valueDisplay}>
                    {formatTokenAmount(activeLoan.collateral)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.label}>Start Date:</Typography>
                </Grid>
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.valueDisplay}>
                    {formatDate(activeLoan.startTime)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.label}>Duration:</Typography>
                </Grid>
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.valueDisplay}>
                    {activeLoan.duration} days
                  </Typography>
                </Grid>
                
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.label}>Days Remaining:</Typography>
                </Grid>
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.valueDisplay}>
                    {calculateDaysRemaining()} days
                  </Typography>
                </Grid>
                
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.label}>Interest Rate:</Typography>
                </Grid>
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.valueDisplay}>
                    {(activeLoan.interestRate / 100).toFixed(2)}%
                  </Typography>
                </Grid>
                
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.label}>Status:</Typography>
                </Grid>
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.valueDisplay}>
                    Active
                  </Typography>
                </Grid>
                
                <Grid item xs={12} className={classes.actions}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={() => window.location.href = '/borrow'}
                  >
                    Go to Repay Page
                  </Button>
                </Grid>
              </Grid>
            </div>
          ) : (
            <Box textAlign="center" my={4}>
              <Typography variant="h6">
                You don't have any active loans
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => window.location.href = '/borrow'}
                style={{ marginTop: 16 }}
              >
                Create a New Loan
              </Button>
            </Box>
          )}
        </TabPanel>
        
        {/* Loan History Tab */}
        <TabPanel value={tabValue} index={1}>
          {loanHistory.length > 0 ? (
            loanHistory.map((loan) => (
              <Card key={loan.id} style={{ marginBottom: 16 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6} className={classes.detailItem}>
                      <Typography className={classes.label}>Borrowed Amount:</Typography>
                    </Grid>
                    <Grid item xs={6} className={classes.detailItem}>
                      <Typography className={classes.valueDisplay}>
                        {formatTokenAmount(loan.amount)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} className={classes.detailItem}>
                      <Typography className={classes.label}>Collateral:</Typography>
                    </Grid>
                    <Grid item xs={6} className={classes.detailItem}>
                      <Typography className={classes.valueDisplay}>
                        {formatTokenAmount(loan.collateral)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} className={classes.detailItem}>
                      <Typography className={classes.label}>Start Date:</Typography>
                    </Grid>
                    <Grid item xs={6} className={classes.detailItem}>
                      <Typography className={classes.valueDisplay}>
                        {formatDate(loan.startTime)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} className={classes.detailItem}>
                      <Typography className={classes.label}>End Date:</Typography>
                    </Grid>
                    <Grid item xs={6} className={classes.detailItem}>
                      <Typography className={classes.valueDisplay}>
                        {formatDate(loan.endTime)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} className={classes.detailItem}>
                      <Typography className={classes.label}>Interest Paid:</Typography>
                    </Grid>
                    <Grid item xs={6} className={classes.detailItem}>
                      <Typography className={classes.valueDisplay}>
                        {formatTokenAmount(loan.interestPaid)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} className={classes.detailItem}>
                      <Typography className={classes.label}>Status:</Typography>
                    </Grid>
                    <Grid item xs={6} className={classes.detailItem}>
                      <Typography className={classes.valueDisplay} style={{ color: loan.repaid ? 'green' : 'red' }}>
                        {loan.repaid ? 'Repaid' : 'Default'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))
          ) : (
            <Box textAlign="center" my={4}>
              <Typography variant="h6">
                No loan history found
              </Typography>
            </Box>
          )}
        </TabPanel>
        
        {/* Liquidity Provided Tab */}
        <TabPanel value={tabValue} index={2}>
          {lpProviderDetails && parseFloat(lpProviderDetails.amountProvided) > 0 ? (
            <div>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Your Liquidity Position
                  </Typography>
                </Grid>
                
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.label}>Amount Provided:</Typography>
                </Grid>
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.valueDisplay}>
                    {formatTokenAmount(lpProviderDetails.amountProvided)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.label}>Pool Share:</Typography>
                </Grid>
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.valueDisplay}>
                    {(lpProviderDetails.sharePercentage / 100).toFixed(2)}%
                  </Typography>
                </Grid>
                
                {/* For demo purposes, showing mock earnings */}
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.label}>Estimated Earnings (30d):</Typography>
                </Grid>
                <Grid item xs={6} className={classes.detailItem}>
                  <Typography className={classes.valueDisplay}>
                    {formatTokenAmount(
                      ethers.BigNumber.from(lpProviderDetails.amountProvided)
                        .mul(52)
                        .div(1000)
                        .toString()
                    )}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} className={classes.actions}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={() => window.location.href = '/lend'}
                  >
                    Manage Liquidity
                  </Button>
                </Grid>
              </Grid>
            </div>
          ) : (
            <Box textAlign="center" my={4}>
              <Typography variant="h6">
                You haven't provided any liquidity yet
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => window.location.href = '/lend'}
                style={{ marginTop: 16 }}
              >
                Become a Liquidity Provider
              </Button>
            </Box>
          )}
        </TabPanel>
      </Paper>
      
      {/* Call to Action */}
      <Box mt={4} textAlign="center">
        <Typography variant="body1" paragraph>
          Looking to expand your DeFi portfolio?
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.href = '/'}
        >
          Explore More Options
        </Button>
      </Box>
    </Container>
  );
};

export default Dashboard; 