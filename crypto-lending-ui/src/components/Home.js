import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  makeStyles,
  Button,
  Card,
  CardContent,
  CardActions
} from '@material-ui/core';
import { Link } from 'react-router-dom';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import AccountBalanceIcon from '@material-ui/icons/AccountBalance';
import DashboardIcon from '@material-ui/icons/Dashboard';

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
  hero: {
    position: 'relative',
    padding: theme.spacing(8, 0),
    textAlign: 'center',
    marginBottom: theme.spacing(6),
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  title: {
    fontSize: '4rem',
    fontWeight: 700,
    marginBottom: theme.spacing(2),
    fontFamily: '"Roboto Mono", monospace',
    color: theme.palette.primary.main,
    textShadow: '0 0 20px rgba(0, 245, 255, 0.7)',
    '&::before': {
      content: '">_"',
      marginRight: theme.spacing(1),
      fontSize: '3rem',
      opacity: 0.7,
    },
  },
  subtitle: {
    fontSize: '1.5rem',
    marginBottom: theme.spacing(4),
    maxWidth: 800,
    margin: '0 auto',
  },
  terminal: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 4,
    maxWidth: 700,
    margin: '0 auto',
    padding: theme.spacing(3),
    fontFamily: '"Roboto Mono", monospace',
    marginTop: theme.spacing(6),
    marginBottom: theme.spacing(6),
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundImage: `repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.1),
        rgba(0, 0, 0, 0.1) 1px,
        transparent 1px,
        transparent 2px
      )`,
      pointerEvents: 'none',
      opacity: 0.5,
    },
  },
  terminalLine: {
    margin: theme.spacing(1, 0),
    position: 'relative',
    paddingLeft: theme.spacing(3),
    '&::before': {
      content: '"$"',
      position: 'absolute',
      left: 0,
      color: '#4caf50',
    },
    '&.response': {
      paddingLeft: 0,
      color: theme.palette.primary.main,
      '&::before': {
        content: '""',
      },
    },
    '&.success': {
      color: '#4caf50',
    },
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
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    border: `1px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 15px rgba(0, 245, 255, 0.2)`,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: `0 0 20px rgba(0, 245, 255, 0.4)`,
    },
  },
  cardContent: {
    flexGrow: 1,
  },
  cardIcon: {
    fontSize: 48,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
  cardTitle: {
    fontFamily: '"Roboto Mono", monospace',
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  cardDescription: {
    color: theme.palette.text.secondary,
  },
  linkButton: {
    marginTop: theme.spacing(2),
  },
  features: {
    marginTop: theme.spacing(8),
    marginBottom: theme.spacing(8),
  },
  featureTitle: {
    fontFamily: '"Roboto Mono", monospace',
    marginBottom: theme.spacing(4),
    position: 'relative',
    display: 'inline-block',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -10,
      left: 0,
      width: '100%',
      height: '2px',
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
      boxShadow: `0 0 8px ${theme.palette.primary.main}`,
    },
  },
  featureItem: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '4px',
      height: '100%',
      background: theme.palette.primary.main,
      boxShadow: `0 0 10px ${theme.palette.primary.main}`,
    },
  },
  featureNumber: {
    fontFamily: '"Roboto Mono", monospace',
    fontWeight: 600,
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1),
  },
  actionButton: {
    marginTop: theme.spacing(2),
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
}));

const Home = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Container className={classes.container} maxWidth="lg">
        <div className={classes.hero}>
          <div className={classes.heroContent}>
            <Typography variant="h1" className={classes.title}>
              LendFi
            </Typography>
            <Typography variant="h5" className={classes.subtitle}>
              Next-generation crypto lending platform providing liquidity for pairs of assets with under-collateralized loans
            </Typography>
            <Button
              component={Link}
              to="/lend"
              variant="contained"
              color="primary"
              size="large"
              className={classes.actionButton}
            >
              Start Lending
            </Button>
            <Button
              component={Link}
              to="/borrow"
              variant="outlined"
              color="primary"
              size="large"
              style={{ marginLeft: 16 }}
              className={classes.actionButton}
            >
              Get a Loan
            </Button>
          </div>
        </div>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card className={classes.card}>
              <CardContent className={classes.cardContent}>
                <TrendingUpIcon className={classes.cardIcon} />
                <Typography variant="h5" className={classes.cardTitle}>
                  Lend
                </Typography>
                <Typography variant="body1" className={classes.cardDescription}>
                  Provide liquidity for pairs of assets and earn interest from borrowers. Your funds are used to create deep liquidity pools that enable under-collateralized loans.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  component={Link}
                  to="/lend"
                  color="primary"
                  className={classes.linkButton}
                >
                  Provide Liquidity
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card className={classes.card}>
              <CardContent className={classes.cardContent}>
                <AccountBalanceIcon className={classes.cardIcon} />
                <Typography variant="h5" className={classes.cardTitle}>
                  Borrow
                </Typography>
                <Typography variant="body1" className={classes.cardDescription}>
                  Get loans with flexible collateral requirements. Our dual-asset liquidity pools enable you to borrow assets with less collateral than traditional platforms.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  component={Link}
                  to="/borrow"
                  color="primary"
                  className={classes.linkButton}
                >
                  Get a Loan
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card className={classes.card}>
              <CardContent className={classes.cardContent}>
                <DashboardIcon className={classes.cardIcon} />
                <Typography variant="h5" className={classes.cardTitle}>
                  Dashboard
                </Typography>
                <Typography variant="body1" className={classes.cardDescription}>
                  Monitor your loans, dual-asset liquidity positions, and credit score in real-time with our comprehensive dashboard.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  component={Link}
                  to="/dashboard"
                  color="primary"
                  className={classes.linkButton}
                >
                  View Dashboard
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        <div className={classes.terminal}>
          <div className={classes.scanLine}></div>
          <Typography variant="body1" className={classes.terminalLine}>
            initialize_lendfi_protocol --network ethereum --version 0.1.0_alpha
          </Typography>
          <Typography variant="body1" className={`${classes.terminalLine} response success`}>
            LendFi protocol initialized successfully. Ready for transactions.
          </Typography>
          <Typography variant="body1" className={classes.terminalLine}>
            deploy_dual_asset_pools --base-assets ETH,WBTC --quote-assets DAI,USDC
          </Typography>
          <Typography variant="body1" className={`${classes.terminalLine} response success`}>
            Successfully created dual-asset liquidity pools:
            - ETH/DAI pool: 0x8Fc8d9...
            - ETH/USDC pool: 0x7Ab3e5...
            - WBTC/DAI pool: 0x5Fd2b1...
            - WBTC/USDC pool: 0x9Ce4a2...
          </Typography>
          <Typography variant="body1" className={classes.terminalLine}>
            fetch_lending_rates
          </Typography>
          <Typography variant="body1" className={`${classes.terminalLine} response`}>
            Current lending rates:
            - ETH/DAI: 5.8% APY
            - ETH/USDC: 4.9% APY
            - WBTC/DAI: 3.8% APY
            - WBTC/USDC: 4.2% APY
          </Typography>
        </div>

        <div className={classes.features}>
          <Typography variant="h4" className={classes.featureTitle}>
            Key Features
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper className={classes.featureItem}>
                <Typography variant="h6" gutterBottom>
                  <span className={classes.featureNumber}>01</span>
                  Dual-Asset Liquidity Pools
                </Typography>
                <Typography variant="body1">
                  Our innovative dual-asset liquidity pools enable efficient capital allocation and reduced risk for lenders while providing better terms for borrowers.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper className={classes.featureItem}>
                <Typography variant="h6" gutterBottom>
                  <span className={classes.featureNumber}>02</span>
                  Variable Collateral Ratios
                </Typography>
                <Typography variant="body1">
                  Borrow with collateral ratios as low as 0.5x based on on-chain credit scoring and transaction history. Better scores mean better terms.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper className={classes.featureItem}>
                <Typography variant="h6" gutterBottom>
                  <span className={classes.featureNumber}>03</span>
                  Advanced Risk Management
                </Typography>
                <Typography variant="body1">
                  Our system continuously monitors health factors, liquidation thresholds, and market volatility to ensure the safety of all platform participants.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper className={classes.featureItem}>
                <Typography variant="h6" gutterBottom>
                  <span className={classes.featureNumber}>04</span>
                  Liquidity Mining Rewards
                </Typography>
                <Typography variant="body1">
                  Earn additional rewards for providing liquidity to our dual-asset pools, with bonus incentives for less common pairs.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </div>
      </Container>
    </div>
  );
};

export default Home; 