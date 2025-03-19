// src/components/BorrowerDashboard.js
import React, { useEffect } from 'react';
import { useLoan } from '../hooks/useLoan';
import { Card, CardContent, Typography, Grid, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import { toast } from 'react-toastify';
import { useState } from 'react';

const BorrowerDashboard = () => {
  const { loans, fetchLoans, repayLoan, isLoading } = useLoan();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleRepayClick = (loan) => {
    setSelectedLoan(loan);
    setOpenDialog(true);
  };

  const handleRepaySubmit = () => {
    if (!repayAmount) {
      toast.error("Please enter an amount to repay");
      return;
    }
    
    repayLoan(selectedLoan.id, repayAmount);
    setOpenDialog(false);
    setRepayAmount('');
  };

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Loans
      </Typography>
      
      {isLoading ? (
        <Typography>Loading your loans...</Typography>
      ) : loans.length === 0 ? (
        <Typography>You don't have any active loans.</Typography>
      ) : (
        <Grid container spacing={3}>
          {loans.map(loan => (
            <Grid item xs={12} sm={6} md={4} key={loan.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Loan #{loan.id}</Typography>
                  <Typography>Principal: {loan.principal} Tokens</Typography>
                  <Typography>Collateral: {loan.collateralAmount} Tokens</Typography>
                  <Typography>Interest Rate: {loan.interestRate}%</Typography>
                  <Typography>
                    Due Date: {loan.dueDate.toLocaleDateString()}
                  </Typography>
                  <Typography color={Date.now() > loan.dueDate ? "error" : "textPrimary"}>
                    Status: {Date.now() > loan.dueDate ? "Overdue" : "Active"}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => handleRepayClick(loan)}
                    style={{ marginTop: 16 }}
                    fullWidth
                  >
                    Repay Loan
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Repay Loan #{selectedLoan?.id}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Repayment Amount"
            type="number"
            fullWidth
            value={repayAmount}
            onChange={(e) => setRepayAmount(e.target.value)}
          />
          <Typography variant="body2" color="textSecondary">
            Loan Principal: {selectedLoan?.principal} Tokens
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleRepaySubmit} color="primary" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Repay'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BorrowerDashboard;