import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { toast } from 'react-toastify';
import { useAccount } from 'wagmi';

const useStyles = makeStyles((theme) => ({
  connectContainer: {
    position: 'relative',
  },
  customConnectButton: {
    '& button': {
      backgroundColor: 'rgba(0, 0, 0, 0.6) !important',
      color: `${theme.palette.primary.main} !important`,
      border: `2px solid ${theme.palette.primary.main} !important`,
      boxShadow: `0 0 10px ${theme.palette.primary.main} !important`,
      transition: 'all 0.3s ease !important',
      overflow: 'hidden !important',
      borderRadius: '4px !important',
      fontFamily: '"Roboto Mono", monospace !important',
      '&:hover': {
        backgroundColor: 'rgba(0, 245, 255, 0.1) !important',
        boxShadow: `0 0 15px ${theme.palette.primary.main}, 0 0 20px rgba(0, 245, 255, 0.4) !important`,
      },
    },
    '& [role="dialog"]': {
      backgroundColor: 'rgba(0, 0, 0, 0.9) !important',
      border: `1px solid ${theme.palette.primary.main} !important`,
      boxShadow: `0 0 20px rgba(0, 245, 255, 0.3) !important`,
      backdropFilter: 'blur(10px) !important',
      fontFamily: '"Roboto Mono", monospace !important',
    },
  },
}));

const WalletConnect = () => {
  const classes = useStyles();
  const { isConnected } = useAccount();

  // Handle connection state changes
  React.useEffect(() => {
    if (isConnected) {
      toast.success('Wallet connected successfully!', {
        className: 'cyber-toast success-toast',
        bodyClassName: 'cyber-toast-body',
        progressClassName: 'cyber-toast-progress'
      });
    }
  }, [isConnected]);

  return (
    <Box className={classes.connectContainer}>
      <div className={classes.customConnectButton}>
        <ConnectButton
          accountStatus="address"
          chainStatus="icon"
          showBalance={false}
        />
      </div>
    </Box>
  );
};

export default WalletConnect;