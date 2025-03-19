// src/hooks/useLoan.js
import { useState, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

export const useLoan = () => {
  const { lendingContract, account, loanToken, collateralToken } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [loans, setLoans] = useState([]);

  // Fetch user's active loans
  const fetchLoans = useCallback(async () => {
    if (!lendingContract || !account) return;
    
    setIsLoading(true);
    try {
      const loanIds = await lendingContract.getUserActiveLoans(account);
      const loanDetails = await Promise.all(
        loanIds.map(async id => {
          const loan = await lendingContract.loans(id);
          return {
            id: id.toNumber(),
            borrower: loan.borrower,
            principal: ethers.utils.formatEther(loan.principal),
            interestRate: loan.interestRate.toNumber() / 100, // Convert basis points to percentage
            collateralAmount: ethers.utils.formatEther(loan.collateralAmount),
            dueDate: new Date(loan.dueDate.toNumber() * 1000),
            active: loan.active
          };
        })
      );
      setLoans(loanDetails);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Failed to load your loans");
    } finally {
      setIsLoading(false);
    }
  }, [lendingContract, account]);

  // Create a new loan
  const createLoan = useCallback(async (amount, durationDays, collateralAmount) => {
    if (!lendingContract || !account) {
      toast.error("Please connect your wallet");
      return;
    }
    
    setIsLoading(true);
    try {
      // Convert to wei
      const amountWei = ethers.utils.parseEther(amount);
      const collateralWei = ethers.utils.parseEther(collateralAmount);
      
      // Approve collateral token transfer
      const approveTx = await collateralToken.approve(
        lendingContract.address, 
        collateralWei
      );
      await approveTx.wait();
      
      // Create loan
      const tx = await lendingContract.createLoan(
        amountWei, 
        durationDays, 
        collateralWei
      );
      await tx.wait();
      
      toast.success("Loan created successfully!");
      fetchLoans();
    } catch (error) {
      console.error("Error creating loan:", error);
      if (error.message.includes("Not KYC verified")) {
        toast.error("KYC verification required");
      } else if (error.message.includes("Insufficient collateral")) {
        toast.error("Insufficient collateral provided");
      } else {
        toast.error("Failed to create loan");
      }
    } finally {
      setIsLoading(false);
    }
  }, [lendingContract, account, collateralToken, fetchLoans]);

  // Repay a loan
  const repayLoan = useCallback(async (loanId, amount) => {
    if (!lendingContract || !account) {
      toast.error("Please connect your wallet");
      return;
    }
    
    setIsLoading(true);
    try {
      // Convert to wei
      const amountWei = ethers.utils.parseEther(amount);
      
      // Approve loan token transfer
      const approveTx = await loanToken.approve(
        lendingContract.address, 
        amountWei
      );
      await approveTx.wait();
      
      // Repay loan
      const tx = await lendingContract.repayLoan(loanId, amountWei);
      await tx.wait();
      
      toast.success("Loan repaid successfully!");
      fetchLoans();
    } catch (error) {
      console.error("Error repaying loan:", error);
      toast.error("Failed to repay loan");
    } finally {
      setIsLoading(false);
    }
  }, [lendingContract, account, loanToken, fetchLoans]);

  return {
    loans,
    isLoading,
    fetchLoans,
    createLoan,
    repayLoan
  };
};