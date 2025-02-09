import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, CircularProgress, Card, CardContent, Container, Modal, Snackbar, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { Interface } from '@ethersproject/abi';
import Dragonblade from './assets/Cards/Dragonblade.png';
import Frostguard from './assets/Cards/Frostguard.png';
import Shadowstrike from './assets/Cards/Shadowstrike.png';
import Soulreaver from './assets/Cards/Soulreaver.png';
import Thunderclaw from './assets/Cards/Thunderclaw.png';
import Confetti from 'react-confetti';

const Dashboard = ({ userAddress, provider, logoImage, contractAddress, contractABI }) => {
  const [contract, setContract] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [isMinting, setIsMinting] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCard, setNewCard] = useState(null);
  const [isCardRotating, setIsCardRotating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null); // Track selected card
  const [error, setError] = useState(null); // For error messages
  const [isFightModalOpen, setIsFightModalOpen] = useState(false);
  const [fightMode, setFightMode] = useState(null); // 'create' or 'join'
  const [fightId, setFightId] = useState('');
  const [createdFightId, setCreatedFightId] = useState(null);
  const [fightAction, setFightAction] = useState(null); // 'create' or 'join'
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [showWinnerConfetti, setShowWinnerConfetti] = useState(false);
  const [isLoserModalOpen, setIsLoserModalOpen] = useState(false);

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

      const tx = await contract.mintNFT({
        value: mintPrice,
        gasLimit: 500000,
      });
      console.log('Transaction hash:', tx.hash);

      let receipt = null;
      while (!receipt) {
        receipt = await provider.getTransactionReceipt(tx.hash);
        if (!receipt) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log('Transaction receipt:', receipt);

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
        setIsModalOpen(true);
        setIsCardRotating(true);

        setTimeout(() => {
          setIsCardRotating(false);
          setShowConfetti(true);
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
    return `Welcome Adventurer ${address.substring(0, 10)}...${address.substring(address.length - 4)}`;
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

  const handleCardSelect = (card) => {
    setSelectedCard(card.tokenId === selectedCard ? null : card.tokenId); // Toggle selection
  };

  const handleFight = () => {
    if (!selectedCard) {
      setError('Please select a card before fighting!');
      return;
    }
    setIsFightModalOpen(true);
    setFightAction(null); // Reset fight action when opening modal
  };

  const handleCreateFight = async () => {
    try {
      if (!selectedCard) {
        setError('Please select a card before creating a fight!');
        return;
      }

      const tx = await contract.startFight(selectedCard);
      console.log("Creating fight with card:", selectedCard);
      
      // Remove the fight action immediately when transaction is sent
      setFightAction(null);
      
      let receipt = null;
      while (!receipt) {
        receipt = await provider.getTransactionReceipt(tx.hash);
        if (!receipt) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log("Fight creation receipt:", receipt);

      const log = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'FightStarted';
        } catch {
          return false;
        }
      });

      if (log) {
        const parsedLog = contract.interface.parseLog(log);
        console.log("Parsed event:", parsedLog);
        
        const fightId = Number(parsedLog.args[0]);
        console.log("Fight created with ID:", fightId);
        setCreatedFightId(fightId);
        await navigator.clipboard.writeText(fightId.toString());
        setError('Fight ID has been copied to clipboard!');
      }

    } catch (error) {
      console.error('Error creating fight:', error);
      setError('Failed to create fight. Please try again.');
    }
  };

  const handleJoinFight = async () => {
    try {
      if (!fightId) {
        setError('Please enter a fight ID!');
        return;
      }
      const tx = await contract.joinFight(fightId, selectedCard);
      console.log("Joining fight:", fightId, "with card:", selectedCard);
      
      let receipt = null;
      while (!receipt) {
        receipt = await provider.getTransactionReceipt(tx.hash);
        if (!receipt) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // After joining, resolve the fight
      await resolveFight(fightId);
      
      setIsFightModalOpen(false);
      setFightAction(null);
      setFightId('');
      
    } catch (error) {
      console.error('Error joining fight:', error);
      setError('Failed to join fight. Please try again.');
    }
  };

  const resolveFight = async (fightId) => {
    try {
      const tx = await contract.resolveFight(fightId);
      let receipt = null;
      while (!receipt) {
        receipt = await provider.getTransactionReceipt(tx.hash);
        if (!receipt) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const log = receipt.logs.find(log => {
        try {
          return contract.interface.parseLog(log).name === 'FightResolved';
        } catch {
          return false;
        }
      });

      if (log) {
        const parsedLog = contract.interface.parseLog(log);
        const winner = parsedLog.args[1];
        console.log("Fight winner:", winner);

        // Wait for blockchain to finalize
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Refresh NFTs first
        await loadNFTs(contract);

        // Then show appropriate modal
        if (winner.toLowerCase() === userAddress.toLowerCase()) {
          setShowWinnerConfetti(true);
          setIsWinnerModalOpen(true);
        } else {
          setIsLoserModalOpen(true);
        }
      }

    } catch (error) {
      console.error('Error resolving fight:', error);
      setError('Failed to resolve fight. Please try again.');
    }
  };

  const handleFightSubmit = () => {
    if (fightMode === 'create') {
      console.log('Creating fight with ID:', fightId);
      // Add your create fight logic here
    } else {
      console.log('Joining fight with ID:', fightId);
      // Add your join fight logic here
    }
    setIsFightModalOpen(false);
    setFightMode(null);
    setFightId('');
  };

  const handleCloseError = () => {
    setError(null);
  };

  // Add this function to handle copying fight ID
  const copyFightId = async () => {
    try {
      await navigator.clipboard.writeText(createdFightId.toString());
      setError('Fight ID copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Add a function to handle modal closing and NFT refresh
  const handleModalClose = async () => {
    setIsWinnerModalOpen(false);
    setIsLoserModalOpen(false);
    setShowWinnerConfetti(false);
    await loadNFTs(contract); // Refresh NFTs one more time
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
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
          }}
        >
          <img src={logoImage} alt="Logo" style={{ height: '180px', paddingTop: '50px' }} />
        </Box>
        <Box sx={{ flex: 1 }} />
        <Typography
          variant="body1"
          sx={{
            color: '#fff',
            fontFamily: 'monospace',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            zIndex: 2,
            position: 'relative',
            right: '20px',
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
                mt: 4,
                mb: 2,
                backgroundColor: '#7c2d12',
                color: '#fef3c7',
                fontFamily: 'serif',
                fontWeight: 'bold',
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
                letterSpacing: '0.025em',
                px: 3,
                py: 1.5,
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
                'Open Pack'
              )}
            </Button>
            <Button
              variant="contained"
              sx={{
                mt: 4,
                mb: 2,
                ml: 2,
                backgroundColor: '#7c2d12',
                color: '#fef3c7',
                fontFamily: 'serif',
                fontWeight: 'bold',
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
                letterSpacing: '0.025em',
                px: 3,
                py: 1.5,
              }}
              onClick={handleFight}
            >
              FIGHT !
            </Button>

            <Grid container spacing={3} justifyContent="center">
              {nfts.map((nft, index) => {
                const styles = getRarityStyles(nft.rarity);
                return (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      sx={{
                        background: styles.bgGradient,
                        border: `3px solid ${nft.tokenId === selectedCard ? '#ffd700' : styles.borderColor}`, // Highlight selected card
                        color: styles.textColor,
                        overflow: 'hidden',
                        maxWidth: 300,
                        cursor: 'pointer',
                        transition: 'border-color 0.3s',
                      }}
                      onClick={() => handleCardSelect(nft)}
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
                        <Typography>Card ID: {nft.tokenId}</Typography>
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
          setShowConfetti(false);
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
          {showConfetti && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={500}
              gravity={0.2}
            />
          )}

          <motion.div
            animate={{
              rotateY: isCardRotating ? 360 : 0,
              transition: { duration: 2, ease: 'linear' },
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
                backgroundColor: '#7c2d12',
                color: '#fef3c7',
                fontFamily: 'serif',
                fontWeight: 'bold',
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
                letterSpacing: '0.025em',
                px: 3,
                py: 1.5,
              }}
              onClick={() => setIsModalOpen(false)}
            >
              ADD TO MY DECK !
            </Button>
          )}
        </Box>
      </Modal>

      {/* Fight Modal */}
      <Modal
        open={isFightModalOpen}
        onClose={() => {
          setIsFightModalOpen(false);
          setCreatedFightId(null);
          setFightAction(null);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '2rem',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #b45309',
            maxWidth: '400px',
            width: '90%',
          }}
        >
          {!fightAction && !createdFightId ? (
            <>
              <Typography variant="h5" sx={{ color: '#fef3c7', mb: 3 }}>
                Choose Your Battle Path
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  onClick={() => setFightAction('create')}
                  sx={{
                    backgroundColor: '#7c2d12',
                    color: '#fef3c7',
                    border: '2px solid #b45309',
                    '&:hover': { backgroundColor: '#92400e' },
                  }}
                >
                  Create Fight
                </Button>
                <Button
                  onClick={() => setFightAction('join')}
                  sx={{
                    backgroundColor: '#7c2d12',
                    color: '#fef3c7',
                    border: '2px solid #b45309',
                    '&:hover': { backgroundColor: '#92400e' },
                  }}
                >
                  Join Fight
                </Button>
              </Box>
            </>
          ) : fightAction === 'join' ? (
            <>
              <Typography variant="h5" sx={{ color: '#fef3c7', mb: 3 }}>
                Join Existing Fight
              </Typography>
              <input
                type="number"
                value={fightId}
                onChange={(e) => setFightId(e.target.value)}
                placeholder="Enter fight ID to join"
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '20px',
                  backgroundColor: '#1f2937',
                  border: '2px solid #b45309',
                  borderRadius: '4px',
                  color: '#fef3c7',
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  onClick={handleJoinFight}
                  sx={{
                    backgroundColor: '#7c2d12',
                    color: '#fef3c7',
                    border: '2px solid #b45309',
                    '&:hover': { backgroundColor: '#92400e' },
                  }}
                >
                  Join
                </Button>
                <Button
                  onClick={() => setFightAction(null)}
                  sx={{
                    backgroundColor: '#1f2937',
                    color: '#fef3c7',
                    border: '2px solid #b45309',
                    '&:hover': { backgroundColor: '#374151' },
                  }}
                >
                  Back
                </Button>
              </Box>
            </>
          ) : fightAction === 'create' ? (
            <>
              <Typography variant="h5" sx={{ color: '#fef3c7', mb: 3 }}>
                Create New Fight
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  onClick={handleCreateFight}
                  sx={{
                    backgroundColor: '#7c2d12',
                    color: '#fef3c7',
                    border: '2px solid #b45309',
                    '&:hover': { backgroundColor: '#92400e' },
                  }}
                >
                  Create
                </Button>
                <Button
                  onClick={() => setFightAction(null)}
                  sx={{
                    backgroundColor: '#1f2937',
                    color: '#fef3c7',
                    border: '2px solid #b45309',
                    '&:hover': { backgroundColor: '#374151' },
                  }}
                >
                  Back
                </Button>
              </Box>
            </>
          ) : (
            /* Show fight created success message */
            <>
              <Typography variant="h5" sx={{ color: '#ffd700', mb: 3 }}>
                Fight Created Successfully!
              </Typography>
              <Box
                sx={{
                  backgroundColor: '#1f2937',
                  padding: '1rem',
                  borderRadius: '4px',
                  border: '2px solid #ffd700',
                  mb: 3,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#374151',
                  },
                }}
                onClick={copyFightId}
              >
                <Typography sx={{ color: '#fef3c7', fontSize: '32px', fontWeight: 'bold' }}>
                  Fight ID: {createdFightId}
                </Typography>
                <Typography sx={{ color: '#9ca3af', fontSize: '14px', mt: 1 }}>
                  Click to copy
                </Typography>
              </Box>
              <Typography sx={{ color: '#fef3c7', mb: 3 }}>
                Share this Fight ID with your opponent to join the fight!
              </Typography>
              <Button
                onClick={() => {
                  setIsFightModalOpen(false);
                  setCreatedFightId(null);
                }}
                sx={{
                  backgroundColor: '#7c2d12',
                  color: '#fef3c7',
                  border: '2px solid #b45309',
                  '&:hover': { backgroundColor: '#92400e' },
                }}
              >
                Close
              </Button>
            </>
          )}
        </Box>
      </Modal>

      {/* Winner Modal */}
      <Modal
        open={isWinnerModalOpen}
        onClose={handleModalClose}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '2rem',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #ffd700',
            maxWidth: '400px',
            width: '90%',
          }}
        >
          {showWinnerConfetti && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={500}
              gravity={0.2}
            />
          )}
          <Typography variant="h4" sx={{ color: '#ffd700', mb: 3 }}>
            🎉 Congratulations! 🎉
          </Typography>
          <Typography sx={{ color: '#fef3c7', mb: 3 }}>
            You won the battle! The opponent's card has been added to your collection.
          </Typography>
          <Button
            onClick={handleModalClose}
            sx={{
              backgroundColor: '#7c2d12',
              color: '#fef3c7',
              border: '2px solid #ffd700',
              '&:hover': { backgroundColor: '#92400e' },
            }}
          >
            Claim Victory!
          </Button>
        </Box>
      </Modal>

      {/* Add Loser Modal */}
      <Modal
        open={isLoserModalOpen}
        onClose={handleModalClose}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '2rem',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #991b1b',
            maxWidth: '400px',
            width: '90%',
          }}
        >
          <Typography variant="h4" sx={{ color: '#991b1b', mb: 3 }}>
            💔 Defeat! 💔
          </Typography>
          <Typography sx={{ color: '#fef3c7', mb: 3 }}>
            You lost the battle! Your card has been claimed by the victor.
          </Typography>
          <Button
            onClick={handleModalClose}
            sx={{
              backgroundColor: '#7c2d12',
              color: '#fef3c7',
              border: '2px solid #991b1b',
              '&:hover': { backgroundColor: '#92400e' },
            }}
          >
            Accept Defeat
          </Button>
        </Box>
      </Modal>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Dashboard;