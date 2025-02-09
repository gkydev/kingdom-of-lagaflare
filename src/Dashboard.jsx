import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, CircularProgress, Card, CardContent, Container } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { Interface } from '@ethersproject/abi';
import Dragonblade from './assets/Cards/Dragonblade.png';
import Frostguard from './assets/Cards/Frostguard.png';
import Shadowstrike from './assets/Cards/Shadowstrike.png';
import Soulreaver from './assets/Cards/Soulreaver.png';
import Thunderclaw from './assets/Cards/Thunderclaw.png';

const Dashboard = ({ userAddress, provider, logoImage, contractAddress, contractABI }) => {
  const [contract, setContract] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [isMinting, setIsMinting] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCard, setNewCard] = useState(null);

  const Rarity = ["Common", "Rare", "Epic", "Legendary"];

  const getRarityStyles = (rarity) => {
    switch (rarity) {
      case 0: // Common
        return {
          borderColor: '#44403c',
          bgGradient: 'linear-gradient(to bottom, #57534e, #292524)',
          textColor: '#e7e5e4',
          accentColor: '#57534e',
        };
      case 1: // Rare
        return {
          borderColor: '#312e81',
          bgGradient: 'linear-gradient(to bottom, #3730a3, #1e1b4b)',
          textColor: '#e0e7ff',
          accentColor: '#3730a3',
        };
      case 2: // Epic
        return {
          borderColor: '#6b21a8',
          bgGradient: 'linear-gradient(to bottom, #7e22ce, #4c1d95)',
          textColor: '#f3e8ff',
          accentColor: '#7e22ce',
        };
      case 3: // Legendary
        return {
          borderColor: '#854d0e',
          bgGradient: 'linear-gradient(to bottom, #a16207, #451a03)',
          textColor: '#fef3c7',
          accentColor: '#b45309',
        };
      default:
        return {
          borderColor: '#000',
          bgGradient: 'linear-gradient(to bottom, #333, #111)',
          textColor: '#fff',
          accentColor: '#333',
        };
    }
  };

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
      console.error('Error loading NFTs:', error);
    }
  };

  const mintNFT = async () => {
    try {
      setIsMinting(true);
      const mintPrice = await contract.mintPrice();
      console.log('Mint price (wei):', mintPrice.toString());

      // Send transaction
      const tx = await contract.mintNFT({
        value: mintPrice,
        gasLimit: 500000,
      });
      console.log('Transaction hash:', tx.hash);

      // Simple polling for transaction receipt
      let receipt = null;
      while (!receipt) {
        receipt = await provider.getTransactionReceipt(tx.hash);
        if (!receipt) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }

      console.log('Transaction receipt:', receipt);

      // Find the event from transaction logs
      const event = receipt.logs.find((log) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'NFTMinted';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        console.log('NFTMinted event:', parsed);

        setNewCard({
          tokenId: Number(parsed.args[1]),
          rarity: Number(parsed.args[2]),
          name: parsed.args[3],
          attackDamage: Number(parsed.args[4]),
        });

        setShowNewCard(true);
        await loadNFTs(contract);
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Error minting NFT. Check console for details.');
    } finally {
      setIsMinting(false);
    }
  };

  const formatAddress = (address) => {
    return `Knight ${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getCardImage = (name) => {
    switch (name) {
      case 'Dragonblade':
        return Dragonblade;
      case 'Frostguard':
        return Frostguard;
      case 'Shadowstrike':
        return Shadowstrike;
      case 'Soulreaver':
        return Soulreaver;
      case 'Thunderclaw':
        return Thunderclaw;
      default:
        return null;
    }
  };

  return (
    <>
      <Box
        sx={{
          width: '100%',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      >
        <Box sx={{ flex: 1 }} /> {/* Spacer */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <img src={logoImage} alt="Logo" style={{ height: '120px', paddingTop: '50px' }} />
        </Box>
        <Typography
          variant="body1"
          sx={{
            color: '#fff',
            flex: 1,
            textAlign: 'right',
            fontFamily: 'monospace',
            left: '100px',
          }}
        >
          {formatAddress(userAddress)}
        </Typography>
      </Box>

      <Container>
        <Box>
          <Box sx={{ padding: '2rem', textAlign: 'center' }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#000',
                borderRadius: 0,
                mb: 4,
                mt: 2,
                width: '200px',
                height: '50px',
              }}
              onClick={mintNFT}
              disabled={isMinting}
            >
              {isMinting ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  Minting...
                </>
              ) : (
                'Open New Pack'
              )}
            </Button>

            <AnimatePresence>
              {showNewCard && newCard && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  style={{ marginBottom: '2rem' }}
                >
                  <Card
                    sx={{
                      width: 300,
                      margin: 'auto',
                      background: getRarityStyles(newCard.rarity).bgGradient,
                      border: `3px solid ${getRarityStyles(newCard.rarity).borderColor}`,
                      color: getRarityStyles(newCard.rarity).textColor,
                      overflow: 'hidden',
                    }}
                  >
                    <CardContent>
                      {getCardImage(newCard.name) && (
                        <img
                          src={getCardImage(newCard.name)}
                          alt={newCard.name}
                          style={{
                            width: '100%',
                            height: 'auto',
                            marginBottom: '1rem',
                          }}
                        />
                      )}
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
              {nfts.map((nft, index) => {
                const styles = getRarityStyles(nft.rarity);
                return (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      sx={{
                        background: styles.bgGradient,
                        border: `3px solid ${styles.borderColor}`,
                        color: styles.textColor,
                        overflow: 'hidden',
                        maxWidth: 300,
                      }}
                    >
                      <CardContent>
                        {getCardImage(nft.name) && (
                          <img
                            src={getCardImage(nft.name)}
                            alt={nft.name}
                            style={{
                              width: '100%',
                              height: 'auto',
                              marginBottom: '1rem',
                            }}
                          />
                        )}
                        <Typography variant="h5">{nft.name}</Typography>
                        <Typography>Rarity: {Rarity[nft.rarity]}</Typography>
                        <Typography>Attack: {(nft.attackDamage / 100).toFixed(2)}</Typography>
                        <Typography>Token ID: {nft.tokenId}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default Dashboard;