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
      <Typography variant="h6" gutterBottom>
        Connect your wallet to embark on your adventure
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleConnectWallet}
        sx={{
          mt: 2,
          backgroundColor: '#7c2d12', // bg-amber-900
          color: '#fef3c7', // text-amber-100
          fontFamily: 'serif', // font-serif
          fontWeight: 'bold', // font-bold
          fontSize: '1.125rem', // text-lg
          border: '2px solid #b45309', // border-2 border-amber-700
          borderRadius: '0.375rem', // rounded
          boxShadow: 'inset 0 2px 4px 0 rgba(146, 64, 14, 0.5)', // shadow-inner shadow-amber-800/50
          transition: 'all 0.3s', // transition-all duration-300
          '&:hover': {
            backgroundColor: '#92400e', // hover:bg-amber-800
            color: '#fef9c3', // hover:text-amber-50
          },
          '&:active': {
            backgroundColor: '#431407', // active:bg-amber-950
          },
          letterSpacing: '0.025em', // tracking-wide
          px: 3, // px-6 (1 unit = 8px, so 6 * 8 = 48px / 16px = 3)
          py: 1.5, // py-2 (2 * 8 = 16px / 16px = 1)
          
        }}
      >
        Connect Wallet
      </Button>
    </Box>
  );

  return (
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
  );
};

export default NFTCardGame;