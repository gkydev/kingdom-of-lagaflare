import { useState, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, Button, Grid, Typography, CircularProgress, Card, CardContent } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import nftContractABI from './abi.json';
import logoImage from './assets/kindomoflegaflarenobg.png';
import bgImage from './assets/bg.png';
import Dashboard from './Dashboard.jsx';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Create theme with Cinzel font
const theme = createTheme({
  typography: {
    fontFamily: 'Cinzel, serif',
    allVariants: {
      letterSpacing: '0.03em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
        },
      },
    },
  },
});

const NFTCardGame = () => {
  const [provider, setProvider] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const navigate = useNavigate();

  const handleConnectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask not detected!");
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const providerInstance = new Web3Provider(window.ethereum);
      const signer = providerInstance.getSigner();
      const address = await signer.getAddress();
      
      setProvider(providerInstance);
      setUserAddress(address);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const connectWalletContent = (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh" 
    }}>
      <img src={logoImage} alt="Logo" style={{ marginBottom: "20px", width: "400px" }} />
      <Typography variant="h6" gutterBottom style={{ color: "#d97706" }}>
      Connect your wallet to embark on your adventure
    </Typography>

      <Button 
        variant="contained" 
        onClick={handleConnectWallet}
        sx={{
          mt: 2,
          backgroundColor: '#7c2d12',
          color: '#fef3c7',
          fontSize: '1.125rem',
          border: '2px solid #b45309',
          borderRadius: '0.375rem',
          boxShadow: 'inset 0 2px 4px 0 rgba(146, 64, 14, 0.5)',
          transition: 'all 0.3s',
          '&:hover': {
            backgroundColor: '#92400e',
            color: '#fef9c3',
          },
          '&:active': {
            backgroundColor: '#431407',
          },
          px: 3,
          py: 1.5,
        }}
      >
        Connect Wallet
      </Button>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        padding: 0,
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${bgImage})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          zIndex: -1
        }
      }}>
        <Routes>
          <Route path="/" element={!provider ? connectWalletContent : <Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            !provider ? <Navigate to="/" replace /> : 
            <Dashboard 
              userAddress={userAddress} 
              provider={provider}
              logoImage={logoImage} 
              contractAddress={"0x6Dd60539316747995a76DCa3def165E3d43408Dd"}
              contractABI={nftContractABI}
            />
          } />
        </Routes>
      </Box>
    </ThemeProvider>
  );
};

export default NFTCardGame;