import React from 'react';
import { AppBar, Toolbar, Typography, makeStyles, Button, Box } from '@material-ui/core';
import { Link, useLocation } from 'react-router-dom';
import WalletConnect from './WalletConnect';
import CasinoIcon from '@material-ui/icons/Casino';
import CodeIcon from '@material-ui/icons/Code';
import DashboardIcon from '@material-ui/icons/Dashboard';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  appBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backgroundImage: 'linear-gradient(180deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.75))',
    borderBottom: `1px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 10px ${theme.palette.primary.main}, 0 0 20px rgba(0, 245, 255, 0.2)`,
    backdropFilter: 'blur(10px)',
    zIndex: theme.zIndex.drawer + 1,
  },
  title: {
    flexGrow: 1,
    fontWeight: 'bold',
    color: theme.palette.primary.main,
    textDecoration: 'none',
    textShadow: `0 0 10px ${theme.palette.primary.main}`,
    display: 'flex',
    alignItems: 'center',
    letterSpacing: '0.05em',
    '&::before': {
      content: '">_"',
      marginRight: theme.spacing(1),
      fontFamily: 'monospace',
      opacity: 0.7,
    },
  },
  brandMain: {
    color: theme.palette.primary.main,
    fontWeight: 'bold',
  },
  brandSub: {
    fontSize: '0.7rem',
    opacity: 0.8,
    display: 'block',
    letterSpacing: '0.05em',
    marginLeft: theme.spacing(1),
    marginTop: theme.spacing(0.5),
    color: theme.palette.primary.main,
    textDecoration: 'none',
    textShadow: `0 0 10px ${theme.palette.primary.main}`,
  },
  navContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  navLink: {
    color: '#fff',
    textDecoration: 'none',
    marginRight: theme.spacing(2),
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    position: 'relative',
    padding: theme.spacing(1, 2),
    transition: 'all 0.3s ease',
    borderRadius: '4px',
    border: '1px solid transparent',
    '&:hover': {
      backgroundColor: 'rgba(0, 245, 255, 0.1)',
      border: `1px solid ${theme.palette.primary.main}`,
      boxShadow: `0 0 10px rgba(0, 245, 255, 0.3)`,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: '5px',
      left: '10%',
      width: '80%',
      height: '1px',
      background: theme.palette.primary.main,
      transform: 'scaleX(0)',
      transition: 'transform 0.3s ease',
    },
    '&:hover::after': {
      transform: 'scaleX(1)',
    },
  },
  borrowLink: {
    marginLeft: theme.spacing(2),
  },
  navLinkContent: {
    display: 'flex',
    alignItems: 'center',
  },
  navIcon: {
    marginRight: theme.spacing(1),
    fontSize: '1rem',
  },
  activeLink: {
    backgroundColor: 'rgba(0, 245, 255, 0.15)',
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 10px rgba(0, 245, 255, 0.3)`,
    '&::after': {
      transform: 'scaleX(1)',
    },
  },
  icon: {
    marginRight: theme.spacing(1),
    animation: '$pulse 2s infinite',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      backgroundColor: 'rgba(0, 245, 255, 0.05)',
      backgroundImage: `repeating-linear-gradient(
        0deg, 
        transparent, 
        transparent 2px, 
        rgba(0, 245, 255, 0.05) 2px, 
        rgba(0, 245, 255, 0.05) 4px
      )`,
      animation: '$scanLine 8s linear infinite',
      opacity: 0.3,
      zIndex: -1,
    },
  },
  walletContainer: {
    marginLeft: 'auto', // This pushes the wallet all the way to the right
  },
  '@keyframes pulse': {
    '0%': {
      opacity: 0.6,
    },
    '50%': {
      opacity: 1,
      transform: 'scale(1.05)',
    },
    '100%': {
      opacity: 0.6,
    },
  },
  '@keyframes scanLine': {
    '0%': {
      transform: 'translateY(0)',
    },
    '100%': {
      transform: 'translateY(100%)',
    },
  },
  version: {
    fontSize: '0.7rem',
    opacity: 0.7,
    marginLeft: theme.spacing(1),
    marginTop: theme.spacing(0.5),
    fontFamily: 'monospace',
    color: theme.palette.primary.main,
    textDecoration: 'none',
    textShadow: `0 0 10px ${theme.palette.primary.main}`,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  titlePrefix: {
    marginRight: theme.spacing(1),
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  scanLine: {
    width: '100%',
    height: '2px',
    backgroundColor: theme.palette.primary.main,
    margin: theme.spacing(1, 0),
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
  },
}));

const Navbar = () => {
  const classes = useStyles();
  const location = useLocation();

  return (
    <div className={classes.root}>
      <AppBar position="static" className={classes.appBar}>
        <Toolbar className={classes.toolbar}>
          <Box className={classes.brand}>
            <Typography variant="h6" className={classes.title}>
              LendFi
            </Typography>
            <Typography variant="subtitle2" className={classes.brandSub}>
              Crypto Lending
            </Typography>
            <Typography variant="caption" className={classes.version}>
              v0.1.0_alpha
            </Typography>
            <Box className={classes.scanLine}></Box>
          </Box>
          <div className={classes.navLinks}>
            <Button 
              component={Link} 
              to="/lend"
              className={`${classes.navLink} ${location.pathname === '/lend' ? classes.activeLink : ''}`}
            >
              <div className={classes.navLinkContent}>
                <span>Lend</span>
              </div>
            </Button>
            <Button 
              component={Link} 
              to="/borrow"
              className={`${classes.navLink} ${classes.borrowLink} ${location.pathname === '/borrow' ? classes.activeLink : ''}`}
            >
              <div className={classes.navLinkContent}>
                <span>Borrow</span>
              </div>
            </Button>
            <Button 
              component={Link} 
              to="/dashboard"
              className={`${classes.navLink} ${location.pathname === '/dashboard' ? classes.activeLink : ''}`}
            >
              <div className={classes.navLinkContent}>
                <span>Dashboard</span>
              </div>
            </Button>
          </div>
          <WalletConnect />
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default Navbar; 