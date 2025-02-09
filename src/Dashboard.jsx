import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, CircularProgress, Card, CardContent, Container, Modal } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { Interface } from '@ethersproject/abi';
import Dragonblade from './assets/Cards/Dragonblade.png';
import Frostguard from './assets/Cards/Frostguard.png';
import Shadowstrike from './assets/Cards/Shadowstrike.png';
import Soulreaver from './assets/Cards/Soulreaver.png';
import Thunderclaw from './assets/Cards/Thunderclaw.png';
import Confetti from 'react-confetti'; // Import Confetti

const Dashboard = ({ userAddress, provider, logoImage, contractAddress, contractABI }) => {
  const [contract, setContract] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [isMinting, setIsMinting] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCard, setNewCard] = useState(null);
  const [isCardRotating, setIsCardRotating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false); // State for confetti

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

        const newCardData = {
          tokenId: Number(parsed.args[1]),
          rarity: Number(parsed.args[2]),
          name: parsed.args[3],
          attackDamage: Number(parsed.args[4]),
        };

        setNewCard(newCardData);
        setIsModalOpen(true); // Open the modal
        setIsCardRotating(true); // Start the rotation effect

        // Stop rotation after 2 seconds and show confetti
        setTimeout(() => {
          setIsCardRotating(false);
          setShowConfetti(true); // Trigger confetti
        }, 2000);

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
          <img src={logoImage} alt="Logo" style={{ height: '140px', paddingTop: '50px' }} />
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
                mt: 3,
                width: '200px',
                height: '50px',
              }}
              onClick={mintNFT}
              disabled={isMinting}
            >
              {isMinting ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  OPENING NEW PACK...
                </>
              ) : (
                'Open New Pack'
              )}
            </Button>

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

      {/* Modal for New Card */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setShowConfetti(false); // Stop confetti when modal is closed
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '2rem',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          {/* Confetti Effect */}
          {showConfetti && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false} // Stop confetti after one cycle
              numberOfPieces={500} // Increase confetti density
              gravity={0.2} // Adjust falling speed
            />
          )}

          <motion.div
            animate={{
              rotateY: isCardRotating ? 360 : 0,
              transition: { duration: 2, ease: 'linear' }, // Faster rotation
            }}
          >
            <Card
              sx={{
                width: 300,
                background: getRarityStyles(newCard?.rarity).bgGradient,
                border: `3px solid ${getRarityStyles(newCard?.rarity).borderColor}`,
                color: getRarityStyles(newCard?.rarity).textColor,
                overflow: 'hidden',
              }}
            >
              <CardContent>
                {newCard && getCardImage(newCard.name) && (
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
                {!isCardRotating && newCard && (
                  <>
                    <Typography variant="h5">{newCard.name}</Typography>
                    <Typography>Rarity: {Rarity[newCard.rarity]}</Typography>
                    <Typography>Attack: {(newCard.attackDamage / 100).toFixed(2)}</Typography>
                    <Typography>Token ID: {newCard.tokenId}</Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
          {!isCardRotating && (
            <Button
            variant="contained"
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
            onClick={() => setIsModalOpen(false)}
          >
            AMAZING !
          </Button>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default Dashboard;