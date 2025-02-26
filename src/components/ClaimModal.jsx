import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, IconButton, DialogActions, Tooltip, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useState, useEffect } from 'react';
import { formatEther, createWalletClient, custom, createPublicClient, http } from 'viem';
import { unichainSepolia } from '../wallet';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';
import AvatarGenerator from './AvatarGenerator';

const ClaimOption = ({ title, description, amount, onClick, disabled, warning, details, effectAmount, redistributeAmount }) => (
  <Box sx={{
    p: 2.5,
    borderRadius: '16px',
    border: '1px solid rgba(245, 13, 180, 0.1)',
    backgroundColor: 'white',
    transition: 'all 0.2s ease-in-out',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    '&:hover': disabled ? {} : {
      borderColor: 'rgba(245, 13, 180, 0.2)',
      backgroundColor: 'rgba(245, 13, 180, 0.02)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 16px rgba(245, 13, 180, 0.08)'
    }
  }}>
    <Box sx={{ 
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1,
      mb: 1
    }}>
      <Typography sx={{ 
        fontSize: '1rem',
        fontWeight: 700,
        color: '#111',
        flex: 1
      }}>
        {title}
      </Typography>
      {details && (
        <Tooltip 
          title={details} 
          arrow
          placement="top"
          sx={{ 
            maxWidth: 300,
            '& .MuiTooltip-tooltip': {
              fontSize: '0.85rem',
              padding: '8px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          <InfoOutlinedIcon sx={{ 
            color: '#666',
            fontSize: '1rem',
            cursor: 'help',
            '&:hover': { color: '#F50DB4' }
          }} />
        </Tooltip>
      )}
    </Box>
    
    <Typography sx={{ 
      fontSize: '0.85rem',
      color: '#666',
      mb: 1.5,
      lineHeight: 1.6
    }}>
      {description}
    </Typography>

    {warning && (
      <Typography sx={{ 
        fontSize: '0.8rem',
        color: '#f44336',
        mb: 1.5,
        fontStyle: 'italic',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        <InfoOutlinedIcon sx={{ fontSize: '0.9rem' }} />
        {warning}
      </Typography>
    )}

    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5,
      mt: 'auto',
      pt: 1.5,
      borderTop: '1px solid rgba(245, 13, 180, 0.05)'
    }}>
      <Typography sx={{ 
        fontSize: '0.8rem',
        color: '#666',
        mb: 0.5
      }}>
        Earned Rewards
      </Typography>
      <Typography sx={{ 
        fontSize: '1rem',
        color: '#666',
        fontWeight: 500,
        fontFamily: 'Space Grotesk'
      }}>
        {formatEther(amount).slice(0, 8)} ETH
      </Typography>

      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 1
      }}>
        <Box>
          <Typography sx={{ 
            fontSize: '0.8rem',
            color: '#4CAF50',
            mb: 0.25
          }}>
            You'll Receive
          </Typography>
          <Typography sx={{ 
            fontSize: '0.95rem',
            color: '#4CAF50',
            fontWeight: 600,
            fontFamily: 'Space Grotesk'
          }}>
            {formatEther(amount * BigInt(effectAmount) / BigInt(100)).slice(0, 8)} ETH
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ 
            fontSize: '0.8rem',
            color: '#F50DB4',
            mb: 0.25
          }}>
            Community Pool
          </Typography>
          <Typography sx={{ 
            fontSize: '0.95rem',
            color: '#F50DB4',
            fontWeight: 600,
            fontFamily: 'Space Grotesk'
          }}>
            {formatEther(amount * BigInt(redistributeAmount) / BigInt(100)).slice(0, 8)} ETH
          </Typography>
        </Box>
      </Box>

      <Button
        variant="contained"
        size="large"
        onClick={onClick}
        disabled={disabled}
        sx={{ 
          backgroundColor: '#F50DB4',
          color: 'white',
          fontSize: '0.85rem',
          py: 0.75,
          px: 2.5,
          mt: 1.5,
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: '#d00a9b'
          }
        }}
      >
        Select
      </Button>
    </Box>
  </Box>
);

const ClaimModal = ({ open, onClose, token, onSuccess }) => {
  const [claiming, setClaiming] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const handleClaim = async (type) => {
    if (!window.ethereum) {
      setError('Please install a Web3 wallet');
      return;
    }

    try {
      setClaiming(true);
      setSelectedOption(type);
      setError('');
      setTxStatus('Preparing transaction...');

      // Add rate limiting check
      const now = Date.now();
      const lastTxTime = localStorage.getItem('lastClaimTx');
      if (lastTxTime && (now - parseInt(lastTxTime)) < 10000) { // 10 second cooldown
        throw new Error('Please wait a moment between transactions');
      }

      const [account] = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const walletClient = createWalletClient({
        account,
        chain: unichainSepolia,
        transport: custom(window.ethereum)
      });

      let functionName;
      let actionName;
      switch (type) {
        case 'soft':
          functionName = 'softWithdraw';
          actionName = 'Soft Withdraw';
          break;
        case 'hard':
          functionName = 'hardWithdraw';
          actionName = 'Hard Withdraw';
          break;
        case 'redistribute':
          functionName = 'redistribute';
          actionName = 'Redistribute';
          break;
        default:
          throw new Error('Invalid claim type');
      }

      setTxStatus(`Waiting for ${actionName} confirmation in your wallet...`);
      
      // Add delay if this is a retry attempt
      if (retryCount > 0) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Store transaction time for rate limiting
      localStorage.setItem('lastClaimTx', Date.now().toString());

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName,
        args: [token.id]
      });

      setTxStatus(`Transaction submitted! Waiting for network confirmation...`);

      // Create a new publicClient for each transaction to avoid stale connections
      const publicClient = createPublicClient({
        chain: unichainSepolia,
        transport: http()
      });

      try {
        // Wait for transaction with timeout
        const receipt = await Promise.race([
          publicClient.waitForTransactionReceipt({ hash }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction confirmation timeout')), 45000)
          )
        ]);
        
        if (receipt.status === 'success') {
          setTxStatus('Success! Your claim has been processed.');
          
          // Wait a moment before closing to ensure blockchain state is updated
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Close modal first to improve perceived performance
          onClose();
          
          // Then trigger the refresh
          if (typeof onSuccess === 'function') {
            onSuccess(token.id);
          } else {
            // Only reload as last resort
            window.location.reload();
          }
        } else {
          throw new Error('Transaction failed');
        }

      } catch (receiptError) {
        // If we have a hash but got a timeout/RPC error, consider it potentially successful
        if (hash && (
          receiptError.message.includes('timeout') || 
          receiptError.message.includes('Non-200') ||
          receiptError.message.includes('internal error')
        )) {
          setTxStatus('Transaction submitted but confirmation is taking longer than expected. Please check your wallet or the explorer for status.');
          
          // Still close the modal and refresh after a delay
          await new Promise(resolve => setTimeout(resolve, 3000));
          onClose();
          if (typeof onSuccess === 'function') {
            onSuccess(token.id);
          }
          return;
        }
        throw receiptError;
      }

    } catch (error) {
      console.error('Claim error:', error);
      let errorMessage = 'Failed to process claim';
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        
        if (msg.includes('user rejected')) {
          errorMessage = 'Transaction was rejected in your wallet';
          setRetryCount(0);
        } else if (msg.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas fees';
          setRetryCount(0);
        } else if (msg.includes('please wait')) {
          errorMessage = error.message;
          setRetryCount(0);
        } else if (msg.includes('timeout')) {
          errorMessage = 'Transaction is taking longer than expected. Please check your wallet or explorer.';
          setRetryCount(prev => prev + 1);
        } else if (msg.includes('429') || msg.includes('too many requests')) {
          errorMessage = 'Network is busy. Please try again in a moment.';
          setRetryCount(prev => prev + 1);
        } else if (msg.includes('nonce too low') || msg.includes('replacement fee too low')) {
          errorMessage = 'Transaction conflict. Please wait a moment and try again.';
          setRetryCount(prev => prev + 1);
        } else {
          errorMessage = 'Transaction failed. Please try again.';
          setRetryCount(0);
        }
      }
      
      setError(errorMessage);
      setTxStatus('');
    } finally {
      setClaiming(false);
      setSelectedOption(null);
    }
  };

  // Reset retry count when modal closes
  useEffect(() => {
    if (!open) {
      setRetryCount(0);
    }
  }, [open]);

  if (!token) return null;

  return (
    <Dialog 
      open={open} 
      onClose={claiming ? undefined : onClose}
      fullScreen={window.innerWidth < 600}
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 2 },
          maxWidth: '600px',
          width: '100%',
          borderRadius: { xs: 0, sm: '24px' },
          background: '#FAFAFA',
          height: { xs: '100%', sm: 'auto' },
          overflowY: 'auto'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        p: { xs: 2, sm: 3 },
        position: 'sticky',
        top: 0,
        backgroundColor: '#FAFAFA',
        zIndex: 1,
        borderBottom: '1px solid rgba(245, 13, 180, 0.1)'
      }}>
        <Typography 
          component="div"
          sx={{ 
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            fontWeight: 600,
            color: '#111',
            fontFamily: 'Space Grotesk',
            letterSpacing: '-0.02em'
          }}
        >
          {claiming ? 'Processing Transaction' : 'Choose Your Move'}
        </Typography>
        {!claiming && (
          <IconButton
            onClick={onClose}
            sx={{
              color: '#666',
              '&:hover': { color: '#F50DB4' }
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ 
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5
      }}>
        {claiming ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            py: 4
          }}>
            <CircularProgress sx={{ color: '#F50DB4' }} />
            {txStatus && (
              <Typography sx={{ 
                color: '#666',
                textAlign: 'center',
                maxWidth: '400px',
                fontSize: '0.95rem',
                lineHeight: 1.6
              }}>
                {txStatus}
              </Typography>
            )}
          </Box>
        ) : error ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            py: 3
          }}>
            <Typography sx={{ 
              color: '#f44336',
              textAlign: 'center',
              maxWidth: '400px',
              fontSize: '0.95rem',
              lineHeight: 1.6
            }}>
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                setError('');
                setTxStatus('');
              }}
              sx={{ 
                borderColor: '#F50DB4',
                color: '#F50DB4',
                '&:hover': {
                  borderColor: '#d00a9b',
                  backgroundColor: 'rgba(245, 13, 180, 0.04)'
                }
              }}
            >
              Try Again
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{
              pt: 1,
              pb: 4,
              borderBottom: '1px solid rgba(245, 13, 180, 0.05)'
            }}>
              <Typography 
                component="div" 
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1.2rem' },
                  fontWeight: 600,
                  color: '#111',
                  mb: 2,
                  fontFamily: 'Space Grotesk'
                }}
              >
                Ready to Make Your Move?
              </Typography>
              <Typography sx={{ 
                fontSize: '0.95rem',
                color: '#666',
                lineHeight: 1.7,
                maxWidth: '600px'
              }}>
                Choose your strategy wisely! Each option below offers unique advantages for your Fren's journey. Remember, your choice will shape your path forward.
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              <ClaimOption
                title="Stay & Play"
                description="Keep your Fren in the game while taking some profits. You'll get 25% of your rewards, while the rest goes back to the community pot—keeping the game exciting for everyone!"
                details="Perfect for players who want to stay in the game while taking some profits. The 75% that goes back helps maintain a healthy reward pool for all players."
                amount={token.rewards}
                effectAmount={25}
                redistributeAmount={75}
                onClick={() => handleClaim('soft')}
                disabled={claiming && selectedOption !== 'soft'}
              />

              <ClaimOption
                title="Strategic Power-Up"
                description={`Convert 75% of your rewards (${formatEther(token.rewards * BigInt(75) / BigInt(100)).slice(0, 8)} ETH) into increased weight. The remaining 25% stays in your rewards balance. No ETH is withdrawn! Your weight will increase based on the amount converted (max weight: 1000).`}
                details="A strategic move that converts most of your rewards into increased earning potential. No ETH is withdrawn - instead, your rewards are converted to weight, which determines how quickly your Fren earns future rewards. The weight increase gets progressively harder the higher your weight is."
                amount={token.rewards}
                effectAmount={25}
                redistributeAmount={75}
                onClick={() => handleClaim('redistribute')}
                disabled={claiming && selectedOption !== 'redistribute'}
              />

              <ClaimOption
                title="Cash Out"
                description={`Withdraw 75% of your rewards (${formatEther(token.rewards * BigInt(75) / BigInt(100)).slice(0, 8)} ETH) and retire your Fren. The remaining 25% is redistributed to the community. This Fren will stop earning rewards.`}
                warning="Game over! Your Fren's weight will be set to 0 and can't be reactivated."
                details="The nuclear option. You'll get 75% of your current rewards, but this Fren will permanently stop earning. The remaining 25% goes back to the community. Only choose this if you're sure you want to exit the game."
                amount={token.rewards}
                effectAmount={75}
                redistributeAmount={25}
                onClick={() => handleClaim('hard')}
                disabled={claiming && selectedOption !== 'hard'}
              />
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClaimModal; 