import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, CircularProgress, Card, CardContent } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';

const Dashboard = ({ userAddress, provider, logoImage, contractAddress, contractABI }) => {
  const [contract, setContract] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [isMinting, setIsMinting] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCard, setNewCard] = useState(null);
  
  const Rarity = ["Common", "Rare", "Epic", "Legendary"];

  useEffect(() => {
    const initContract = async () => {
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
      setContract(contractInstance);
      await loadNFTs(contractInstance);
    };
    initContract();
  }, []);

  const loadNFTs = async (contractInstance) => {
    try {
      const data = await contractInstance.getMyNFTsWithData();
      const [tokenIds, rarities, names, attackDamages] = data;
      const formattedNFTs = tokenIds.map((tokenId, i) => ({
        tokenId: Number(tokenId.toString()),
        rarity: Number(rarities[i].toString()),
        name: names[i],
        attackDamage: Number(attackDamages[i].toString()),
      }));
      setNfts(formattedNFTs);
    } catch (error) {
      console.error("Error loading NFTs:", error);
    }
  };

  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 0: return '#808080'; // Common
      case 1: return '#007bff'; // Rare
      case 2: return '#800080'; // Epic
      case 3: return '#ff8c00'; // Legendary
      default: return '#000';
    }
  };

  const mintNFT = async () => {
    try {
      setIsMinting(true);
      const mintPrice = await contract.mintPrice();
      console.log("Minting with price:", mintPrice.toString());
      
      const tx = await contract.mintNFT({ value: mintPrice });
      console.log("Minting transaction:", tx.hash);
      
      await tx.wait();
      console.log("Transaction confirmed");
      
      // Get the latest token ID
      const newTokenId = (await contract._tokenIdCounter()) - 1;
      console.log("New token ID:", newTokenId);
      
      // Get the NFT attributes
      const newNFT = await contract.getNFTAttributes(newTokenId);
      setNewCard({ 
        rarity: newNFT[0],
        name: newNFT[1],
        attackDamage: newNFT[2],
        tokenId: newTokenId 
      });
      
      setShowNewCard(true);
      await loadNFTs(contract);
      
    } catch (error) {
      console.error("Error minting NFT:", error);
      alert("Error minting NFT. Check console for details.");
    } finally {
      setIsMinting(false);
    }
  };

  const formatAddress = (address) => {
    return `Knight ${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Box>
      <Box sx={{ 
        width: '100%', 
        padding: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.5)' 
      }}>
        <Box sx={{ flex: 1 }} /> {/* Spacer */}
        <Box sx={{ 
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <img src={logoImage} alt="Logo" style={{ height: '50px' }} />
        </Box>
        <Typography variant="body1" sx={{ 
          color: '#fff',
          flex: 1,
          textAlign: 'right',
          fontFamily: 'monospace'
        }}>
          {formatAddress(userAddress)}
        </Typography>
      </Box>
      
      <Box sx={{ padding: '2rem', textAlign: 'center' }}>
        <Button
          variant="contained"
          sx={{ 
            backgroundColor: '#000', 
            borderRadius: 0,
            mb: 4,
            width: "200px",
            height: "50px"
          }}
          onClick={mintNFT}
          disabled={isMinting}
        >
          {isMinting ? (
            <>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              Minting...
            </>
          ) : 'Mint NFT'}
        </Button>

        <AnimatePresence>
          {showNewCard && newCard && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{ marginBottom: '2rem' }}
            >
              <Card sx={{
                width: 300,
                margin: 'auto',
                background: getRarityColor(newCard.rarity),
                color: 'white',
              }}>
                <CardContent>
                  <Typography variant="h5">{newCard.name}</Typography>
                  <Typography>Rarity: {Rarity[newCard.rarity]}</Typography>
                  <Typography>Attack: {(newCard.attackDamage / 100).toFixed(2)}</Typography>
                  <Typography>Token ID: {newCard.tokenId}</Typography>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Grid container spacing={3} justifyContent="center">
          {nfts.map((nft, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{
                background: getRarityColor(nft.rarity),
                color: 'white'
              }}>
                <CardContent>
                  <Typography variant="h5">{nft.name}</Typography>
                  <Typography>Rarity: {Rarity[nft.rarity]}</Typography>
                  <Typography>Attack: {(nft.attackDamage / 100).toFixed(2)}</Typography>
                  <Typography>Token ID: {nft.tokenId}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
