import React from 'react';
import { Container, Typography, Button, Box, Card, CardContent, Grid, makeStyles } from '@material-ui/core';
import { Link } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  heroSection: {
    padding: theme.spacing(8, 0, 6),
    textAlign: 'center',
  },
  heroButtons: {
    marginTop: theme.spacing(4),
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardContent: {
    flexGrow: 1,
  },
  cardGrid: {
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(8),
  },
  icon: {
    fontSize: 64,
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
  },
  section: {
    padding: theme.spacing(6, 0),
  },
}));

const Home = () => {
  const classes = useStyles();

  return (
    <main>
      <div className={classes.heroSection}>
        <Container maxWidth="sm">
          <Typography component="h1" variant="h2" align="center" color="textPrimary" gutterBottom>
            Crypto Lending Platform
          </Typography>
          <Typography variant="h5" align="center" color="textSecondary" paragraph>
            A decentralized platform for under-collateralized lending, enabling more capital-efficient borrowing 
            with enhanced risk management through Uniswap V4 hooks.
          </Typography>
          <div className={classes.heroButtons}>
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Button variant="contained" color="primary" component={Link} to="/borrow">
                  Borrow Now
                </Button>
              </Grid>
              <Grid item>
                <Button variant="outlined" color="primary" component={Link} to="/lend">
                  Provide Liquidity
                </Button>
              </Grid>
            </Grid>
          </div>
        </Container>
      </div>

      <Container className={classes.cardGrid} maxWidth="md">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={4}>
            <Card className={classes.card}>
              <CardContent className={classes.cardContent}>
                <Typography gutterBottom variant="h5" component="h2">
                  Under-Collateralized Lending
                </Typography>
                <Typography>
                  Borrow funds with lower collateral requirements than traditional DeFi platforms,
                  reducing capital inefficiency while maintaining system security.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card className={classes.card}>
              <CardContent className={classes.cardContent}>
                <Typography gutterBottom variant="h5" component="h2">
                  Risk Management
                </Typography>
                <Typography>
                  Advanced risk assessment mechanisms through Uniswap V4 hooks,
                  monitoring market conditions in real-time for dynamic loan adjustments.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card className={classes.card}>
              <CardContent className={classes.cardContent}>
                <Typography gutterBottom variant="h5" component="h2">
                  Liquidity Provider Rewards
                </Typography>
                <Typography>
                  Earn competitive returns by providing liquidity to the lending pool,
                  with interest distributed proportionally to your contribution.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Box className={classes.section} bgcolor="background.paper">
        <Container maxWidth="md">
          <Typography variant="h4" align="center" gutterBottom>
            How It Works
          </Typography>
          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h6" gutterBottom>
                  1. Provide Collateral
                </Typography>
                <Typography>
                  Deposit your assets as collateral, with lower requirements 
                  than traditional platforms.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h6" gutterBottom>
                  2. Borrow Tokens
                </Typography>
                <Typography>
                  Borrow tokens with flexible loan terms and competitive
                  interest rates.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h6" gutterBottom>
                  3. Repay Your Loan
                </Typography>
                <Typography>
                  Return the borrowed amount plus interest to recover your 
                  collateral in full.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </main>
  );
};

export default Home; 