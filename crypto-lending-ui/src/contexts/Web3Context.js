import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useNetwork, useProvider, useSigner } from 'wagmi';
import { toast } from 'react-toastify';

// Import ABIs
import LendingAbi from '../abis/LendingAbi.json';
import { SUPPORTED_CHAIN_IDS, CONTRACT_ADDRESSES } from '../constants';

// Create context
const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  
  // Contract instances
  const [lendingContract, setLendingContract] = useState(null);
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [userLoanPositions, setUserLoanPositions] = useState([]);
  const [userLendingPositions, setUserLendingPositions] = useState([]);

  // Initialize contracts when connected
  useEffect(() => {
    if (isConnected && address && chain) {
      initializeContracts();
      loadUserData();
    } else {
      // Reset state when disconnected
      setLendingContract(null);
      setUserLoanPositions([]);
      setUserLendingPositions([]);
    }
  }, [isConnected, address, chain]);

  // Initialize contract instances
  const initializeContracts = async () => {
    try {
      // Check if on supported chain
      if (!chain || !SUPPORTED_CHAIN_IDS.includes(chain.id)) {
        toast.error('Please connect to a supported network');
        return;
      }

      // For now we're just setting up access to the contracts
      // In a real app, you would create contract instances here
      const lendingContractAddress = CONTRACT_ADDRESSES[chain.id]?.lendingPool;
      if (!lendingContractAddress) {
        toast.error('Contract not deployed on this network');
        return;
      }
      
      // For demonstration purposes, just setting the contract address
      // In a real implementation, we would use ethers.js
      // to create contract instances for interaction
      setLendingContract({
        address: lendingContractAddress,
        abi: LendingAbi
      });
    } catch (error) {
      console.error('Error initializing contracts:', error);
      toast.error('Failed to initialize contracts');
    }
  };

  // Load user positions data
  const loadUserData = async () => {
    if (!isConnected || !address) return;
    
    try {
      setIsLoading(true);
      
      // For demo purposes, setting mock data
      // In a real app, you would fetch this data from the blockchain
      setUserLoanPositions([
        {
          id: '1',
          collateralAsset: 'ETH',
          borrowedAsset: 'DAI',
          collateralAmount: '1.5',
          borrowedAmount: '2000',
          interestRate: '3.5',
          healthFactor: '1.8',
          liquidationThreshold: '1.1'
        }
      ]);
      
      setUserLendingPositions([
        {
          id: '1',
          baseAsset: 'ETH',
          quoteAsset: 'DAI',
          amount: '2.0',
          value: '3200',
          apy: '5.8'
        },
        {
          id: '2',
          baseAsset: 'WBTC',
          quoteAsset: 'USDC',
          amount: '0.12',
          value: '2800',
          apy: '4.2'
        }
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  // Provide liquidity to a dual-asset pool
  const provideLiquidity = async (baseAsset, quoteAsset, amount) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Mock implementation - in a real app, this would be a contract call
      toast.info(`Providing ${amount} ${baseAsset} to ${baseAsset}/${quoteAsset} pool...`);
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Successfully provided liquidity to ${baseAsset}/${quoteAsset} pool`);
      
      // Refresh user data
      await loadUserData();
      
      return true;
    } catch (error) {
      console.error('Error providing liquidity:', error);
      toast.error('Failed to provide liquidity');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Take a loan
  const takeLoan = async (collateralAsset, borrowAsset, collateralAmount, borrowAmount) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Mock implementation - in a real app, this would be a contract call
      toast.info(`Creating loan: ${borrowAmount} ${borrowAsset} with ${collateralAmount} ${collateralAsset} as collateral...`);
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Successfully borrowed ${borrowAmount} ${borrowAsset}`);
      
      // Refresh user data
      await loadUserData();
      
      return true;
    } catch (error) {
      console.error('Error taking loan:', error);
      toast.error('Failed to take loan');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const contextValue = {
    address,
    isConnected,
    chain,
    provider,
    signer,
    lendingContract,
    isLoading,
    userLoanPositions,
    userLendingPositions,
    provideLiquidity,
    takeLoan,
    refreshData: loadUserData
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook for using the Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export default Web3Context; 