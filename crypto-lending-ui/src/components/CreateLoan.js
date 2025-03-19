// src/components/CreateLoan.js
import React, { useState } from 'react';
import { useLoan } from '../hooks/useLoan';
import { TextField, Button, Card, CardContent, Typography, Grid } from '@material-ui/core';

const CreateLoan = () => {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const [collateral, setCollateral] = useState('');
  const { createLoan, isLoading } = useLoan();

  const handleSubmit = (e) => {
    e.preventDefault();
    createLoan(amount, parseInt(duration), collateral);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Create a New Loan
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Loan Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                required
                InputProps={{
                  endAdornment: <Typography variant="body2">Tokens</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Duration (Days)"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Collateral Amount"
                type="number"
                value={collateral}
                onChange={(e) => setCollateral(e.target.value)}
                fullWidth
                required
                InputProps={{
                  endAdornment: <Typography variant="body2">Tokens</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Required collateral: {(parseFloat(amount || 0) * 0.8).toFixed(2)} Tokens (80%)
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Create Loan'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateLoan;