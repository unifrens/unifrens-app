import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, IconButton, DialogActions, Tooltip, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useState, useEffect } from 'react';
import { formatEther, createWalletClient, custom, createPublicClient, http } from 'viem';
import { unichainSepolia } from '../wallet';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';
import AvatarGenerator from './AvatarGenerator';

const ClaimOption = ({ title, description, amount, onClick, disabled, warning, details, effectAmount, redistributeAmount, customLabels = {} }) => (
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
            {customLabels.receive || "You'll Receive"}
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

const VictoryClaimOption = ({ title, description, amount, onClick, disabled, details }) => (
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
        Contract Balance
      </Typography>
      <Typography sx={{ 
        fontSize: '1rem',
        color: '#666',
        fontWeight: 500,
        fontFamily: 'Space Grotesk'
      }}>
        {formatEther(amount || BigInt(0)).slice(0, 8)} ETH
      </Typography>

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
        {disabled ? 'Not Eligible' : 'Select'}
      </Button>
    </Box>
  </Box>
);

const ClaimModal = ({ open, onClose, token, onSuccess, contractBalance }) => {
  const [claiming, setClaiming] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [success, setSuccess] = useState(false);

  // Add error constants that match the contract
  const CONTRACT_ERRORS = {
    NOT_OWNER: "UNIFRENS: Not the owner",
    MAX_WEIGHT: "UNIFRENS: Max weight reached",
    NO_REWARDS: "UNIFRENS: No rewards available",
    MIN_REWARDS: "UNIFRENS: Insufficient rewards for redistribution",
    INSUFFICIENT_BALANCE: "UNIFRENS: Insufficient contract balance",
    POSITION_INACTIVE: "UNIFRENS: Position is inactive",
    POSITION_ALREADY_INACTIVE: "UNIFRENS: Position already inactive",
    WITHDRAWAL_TOO_SMALL: "UNIFRENS: Withdrawal amount too small",
    NOT_LAST_ACTIVE: "UNIFRENS: Not the last active position"
  };

  // Add user-friendly error messages
  const ERROR_MESSAGES = {
    [CONTRACT_ERRORS.NOT_OWNER]: "You don't own this Fren",
    [CONTRACT_ERRORS.MAX_WEIGHT]: "This Fren has reached maximum weight (1000×). Try a different claim option.",
    [CONTRACT_ERRORS.NO_REWARDS]: "No rewards available to claim. Please wait for rewards to accumulate.",
    [CONTRACT_ERRORS.MIN_REWARDS]: "Need at least 0.0009 ETH in rewards to redistribute. Try the 'Stay & Play' option instead.",
    [CONTRACT_ERRORS.INSUFFICIENT_BALANCE]: "Contract balance is too low. Please try again later.",
    [CONTRACT_ERRORS.POSITION_INACTIVE]: "This Fren is inactive and cannot claim rewards.",
    [CONTRACT_ERRORS.POSITION_ALREADY_INACTIVE]: "This Fren is already inactive.",
    [CONTRACT_ERRORS.WITHDRAWAL_TOO_SMALL]: "Withdrawal amount is too small. Accumulate more rewards first.",
    [CONTRACT_ERRORS.NOT_LAST_ACTIVE]: "There are still other active Frens. Victory can only be claimed when you have the last active Fren."
  };

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

      // Create clients
      const publicClient = createPublicClient({
        chain: unichainSepolia,
        transport: http()
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
        case 'victory':
          functionName = 'claimVictory';
          actionName = 'Claim Victory';
          break;
        default:
          throw new Error('Invalid claim type');
      }

      // Simulate the transaction first to get potential revert reasons
      try {
        setTxStatus('Simulating transaction...');
        const { request } = await publicClient.simulateContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName,
          args: [token.id],
          account
        });

        console.log('Simulation successful:', request);
      } catch (error) {
        console.error('Simulation failed:', error);
        
        // Extract error message
        const errorMessage = error.message || '';
        
        // Check for known contract errors first
        for (const [key, contractError] of Object.entries(CONTRACT_ERRORS)) {
          if (errorMessage.includes(contractError)) {
            throw new Error(ERROR_MESSAGES[contractError]);
          }
        }
        
        // If we can't determine specific error, throw simulation error
        throw new Error(`Transaction would fail: ${errorMessage}`);
      }

      setTxStatus(`Initiating ${actionName}...`);
      
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName,
        args: [token.id]
      });

      setTxStatus(`Waiting for ${actionName} confirmation...`);
      console.log('Transaction hash:', hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('Transaction receipt:', receipt);

      if (receipt.status === 'reverted') {
        throw new Error(`${actionName} failed. Please check your wallet for details.`);
      }

      // Store last successful tx time
      localStorage.setItem('lastClaimTx', Date.now().toString());

      setTxStatus(`${actionName} successful!`);
      setSuccess(true);
      
      // Refresh token data after successful claim
      await onSuccess(token.id);

      // Close modal after successful claim
      onClose();

    } catch (error) {
      // Enhanced error logging
      console.error('Claim error full details:', {
        error,
        errorMessage: error.message,
        errorData: error.data,
        errorCode: error.code,
        token: {
          id: token.id,
          rewards: token.rewards ? formatEther(token.rewards) : '0',
          weight: token.weight
        }
      });
      
      let errorMessage = 'Failed to process claim';
      
      // Check for known contract errors first
      for (const [key, contractError] of Object.entries(CONTRACT_ERRORS)) {
        if (error.message.includes(contractError)) {
          errorMessage = ERROR_MESSAGES[contractError];
          setRetryCount(0);
          setError(errorMessage);
          return;
        }
      }
      
      // Handle other common errors
      if (error.message.toLowerCase().includes('user rejected')) {
        errorMessage = 'Transaction was rejected in your wallet';
      } else if (error.message.toLowerCase().includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees';
      } else if (error.message.toLowerCase().includes('please wait')) {
        errorMessage = error.message;
      } else if (error.message.toLowerCase().includes('timeout')) {
        errorMessage = 'Transaction is taking longer than expected. Please check your wallet or explorer.';
        setRetryCount(prev => prev + 1);
      } else {
        console.warn('Unhandled error type:', error);
        errorMessage = `Transaction failed: ${error.message || 'Unknown error'}`;
        setRetryCount(0);
      }
      
      setError(errorMessage);
      setTxStatus('');
    } finally {
      setClaiming(false);
      setSelectedOption(null);
    }
  };

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
                customLabels={{ receive: "You'll Retain" }}
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

              <VictoryClaimOption
                title="Claim Victory 🏆"
                description="If you're the last active Fren standing (all other Frens have weight 0), you can claim the entire contract balance as the ultimate winner!"
                details="The ultimate victory condition! When all other Frens have been retired (weight 0), the last active Fren can claim the entire remaining contract balance. This is the grand finale of the game - the true winner takes all!"
                amount={contractBalance}
                onClick={() => handleClaim('victory')}
                disabled={true}
              />
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClaimModal; 