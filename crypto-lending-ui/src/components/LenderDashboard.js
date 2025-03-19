// src/components/LenderDashboard.js
import React, { useEffect } from 'react';
import { useLiquidity } from '../hooks/useLiquidity';
import { Card, CardContent, Typography, Button, Grid } from '@material-ui/core';

const LenderDashboard = () => {
  const { lpPosition, rewards, fetchLPInfo, claimRewards, isLoading } = useLiquidity();

  useEffect(() => {
    fetchLPInfo();
  }, [fetchLPInfo]);

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Liquidity Provider Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Your Liquidity Position</Typography>
              <Typography variant="h4">{lpPosition} Tokens</Typography>
              <Typography color="textSecondary">
                Liquidity is added automatically when you provide it on Uniswap V4
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Claimable Rewards</Typography>
              <Typography variant="h4">{rewards} Tokens</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={claimRewards}
                disabled={isLoading || parseFloat(rewards) <= 0}
                style={{ marginTop: 16 }}
              >
                {isLoading ? 'Processing...' : 'Claim Rewards'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default LenderDashboard;