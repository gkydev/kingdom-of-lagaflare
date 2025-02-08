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
        sx={{ borderRadius: 0, backgroundColor: '#000', width: "200px", height: "50px"}}
      >
        Connect Wallet
      </Button>
    </Box>
  );

  return (
    <Box sx={{ 
      padding: 0,
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh'
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