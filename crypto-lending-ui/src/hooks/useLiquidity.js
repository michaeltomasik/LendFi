// src/hooks/useLiquidity.js
import { useState, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

export const useLiquidity = () => {
  const { lendingContract, account } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [lpPosition, setLpPosition] = useState('0');
  const [rewards, setRewards] = useState('0');

  const fetchLPInfo = useCallback(async () => {
    if (!lendingContract || !account) return;
    
    setIsLoading(true);
    try {
      const position = await lendingContract.lpPositions(account);
      setLpPosition(ethers.utils.formatEther(position));
      
      const rewardsBalance = await lendingContract.getClaimableRewards(account);
      setRewards(ethers.utils.formatEther(rewardsBalance));
    } catch (error) {
      console.error("Error fetching LP info:", error);
    } finally {
      setIsLoading(false);
    }
  }, [lendingContract, account]);

  const claimRewards = useCallback(async () => {
    if (!lendingContract || !account) {
      toast.error("Please connect your wallet");
      return;
    }
    
    setIsLoading(true);
    try {
      const tx = await lendingContract.claimRewards();
      await tx.wait();
      
      toast.success("Rewards claimed successfully!");
      fetchLPInfo();
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast.error("Failed to claim rewards");
    } finally {
      setIsLoading(false);
    }
  }, [lendingContract, account, fetchLPInfo]);

  return {
    lpPosition,
    rewards,
    isLoading,
    fetchLPInfo,
    claimRewards
  };
};