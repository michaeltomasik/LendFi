// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Rainbow Kit imports
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { 
  WagmiConfig, 
  configureChains, 
  createClient 
} from 'wagmi';
import { mainnet, sepolia, goerli } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';

// React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Custom Web3 Context
import { Web3Provider } from './contexts/Web3Context';

// Import components
import Navbar from './components/shared/Navbar';
import Home from './components/Home';
import Borrow from './components/Borrow';
import Lend from './components/Lend';
import Dashboard from './components/Dashboard';

// Import custom RainbowKit theme
import cyberpunkTheme from './theme/RainbowKitTheme';

// Constants
const ALCHEMY_API_KEY = 'demo'; // Use your Alchemy API key here
const APP_NAME = 'LendFi';
const WALLETCONNECT_PROJECT_ID = 'c5e4f68a42bee9df48927d0b2668ef5d';

// Configure chains & providers
const { chains, provider } = configureChains(
  [mainnet, sepolia, goerli],
  [
    alchemyProvider({ apiKey: ALCHEMY_API_KEY }),
    publicProvider()
  ]
);

// Set up connectors
const { connectors } = getDefaultWallets({
  appName: APP_NAME,
  projectId: WALLETCONNECT_PROJECT_ID,
  chains
});

// Create a react-query client
const queryClient = new QueryClient();

// Set up wagmi client with the correct configuration for v0.12.x
const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
});

// Create Material UI theme
const theme = createTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#00f5ff', // Bright cyan neon color
      light: '#64ffda',
      dark: '#0097a7',
      contrastText: '#000',
    },
    secondary: {
      main: '#ff0090', // Neon pink
      light: '#ff6ec7',
      dark: '#c51162',
      contrastText: '#000',
    },
    error: {
      main: '#ff3d00', // Bright orange
    },
    background: {
      default: '#111111',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#fff',
      secondary: '#b0bec5',
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Courier New", monospace',
    h4: {
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
    h5: {
      fontWeight: 500,
      letterSpacing: '0.05em',
    },
    h6: {
      fontWeight: 500,
      letterSpacing: '0.05em',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.1em',
    },
  },
  shape: {
    borderRadius: 4,
  },
  overrides: {
    MuiPaper: {
      root: {
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03))',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
      },
    },
    MuiButton: {
      containedPrimary: {
        background: 'linear-gradient(45deg, #00f5ff 30%, #00b8d4 90%)',
        boxShadow: '0 4px 10px rgba(0, 245, 255, 0.25)',
        '&:hover': {
          background: 'linear-gradient(45deg, #00f5ff 30%, #00b8d4 60%)',
          boxShadow: '0 6px 12px rgba(0, 245, 255, 0.4)',
        },
      },
      containedSecondary: {
        background: 'linear-gradient(45deg, #ff0090 30%, #ea80fc 90%)',
        boxShadow: '0 4px 10px rgba(255, 0, 144, 0.25)',
        '&:hover': {
          background: 'linear-gradient(45deg, #ff0090 30%, #ea80fc 60%)',
          boxShadow: '0 6px 12px rgba(255, 0, 144, 0.4)',
        },
      },
      outlined: {
        borderWidth: '2px',
        '&:hover': {
          borderWidth: '2px',
        },
      },
    },
    MuiInputBase: {
      root: {
        background: 'rgba(0, 0, 0, 0.2)',
      },
    },
    MuiOutlinedInput: {
      root: {
        '&:hover $notchedOutline': {
          borderColor: '#00f5ff',
          borderWidth: 2,
        },
        '&$focused $notchedOutline': {
          borderColor: '#00f5ff',
          borderWidth: 2,
          boxShadow: '0 0 10px rgba(0, 245, 255, 0.4)',
        },
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider theme={cyberpunkTheme} chains={chains}>
          <Web3Provider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Router>
                <div className="App">
                  <Navbar />
                  <Switch>
                    <Route exact path="/" component={Home} />
                    <Route path="/borrow" component={Borrow} />
                    <Route path="/lend" component={Lend} />
                    <Route path="/dashboard" component={Dashboard} />
                  </Switch>
                  <ToastContainer 
                    position="bottom-right" 
                    autoClose={5000}
                    theme="dark" 
                    toastClassName="cyber-toast"
                  />
                </div>
              </Router>
            </ThemeProvider>
          </Web3Provider>
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default App;