import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Link
} from '@mui/material';
import { createPublicClient, createWalletClient, http, custom, parseEther, formatEther } from 'viem';
import { unichainSepolia } from '../wallet';
import Navbar from '../components/Navbar';

const MAINNET_FACTORY = '0xb47262baFA9bb7f7959cBCB68a5699EC43B24e2B';
const TESTNET_FACTORY = '0xA05Fb40c2ED642653FcF61749B2502006b8f26B9';

const FACTORY_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "symbol", "type": "string" },
      { "internalType": "uint256", "name": "initialSupply", "type": "uint256" }
    ],
    "name": "createToken",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deploymentFee",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const TokenDeployerPage = () => {
  const [formData, setFormData] = useState({ name: '', symbol: '', totalSupply: '' });
  const [network, setNetwork] = useState('testnet');
  const [wallet, setWallet] = useState('');
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deploymentFee, setDeploymentFee] = useState(null);

  useEffect(() => {
    const connect = async () => {
      if (!window.ethereum) {
        setError('Please install MetaMask');
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWallet(accounts[0]);

        const chain = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(parseInt(chain, 16));

        window.ethereum.on('accountsChanged', ([account]) => setWallet(account));
        window.ethereum.on('chainChanged', (chain) => setChainId(parseInt(chain, 16)));

        // Get deployment fee
        const publicClient = createPublicClient({
          chain: { 
            id: 1301,
            name: 'Unichain Sepolia',
            network: 'unichain-sepolia',
            nativeCurrency: { decimals: 18, name: 'ETH', symbol: 'ETH' },
            rpcUrls: { default: { http: ['https://sepolia.unichain.org'] }, public: { http: ['https://sepolia.unichain.org'] } }
          },
          transport: http()
        });

        const fee = await publicClient.readContract({
          address: TESTNET_FACTORY,
          abi: FACTORY_ABI,
          functionName: 'deploymentFee'
        });

        setDeploymentFee(fee);
        console.log('Deployment fee:', formatEther(fee), 'ETH');

      } catch (err) {
        console.error(err);
        setError('Failed to connect wallet');
      }
    };

    connect();
  }, []);

  const validateInputs = () => {
    // Validate inputs
    if (!formData.name || !formData.symbol || !formData.totalSupply) {
      setError('Please fill all fields');
      return false;
    }

    // Validate token name length
    if (formData.name.length < 3) {
      setError('Token name must be at least 3 characters');
      return false;
    }

    // Validate symbol length
    if (formData.symbol.length < 3) {
      setError('Token symbol must be at least 3 characters');
      return false;
    }

    // Validate total supply
    const supplyNum = Number(formData.totalSupply);
    if (isNaN(supplyNum) || supplyNum < 10) {
      setError('Total supply must be at least 10 tokens');
      return false;
    }
    if (supplyNum > 999000000000000) { // 999 trillion max
      setError('Total supply cannot exceed 999 trillion tokens');
      return false;
    }

    // Check if we're on the right network
    const expectedChainId = network === 'mainnet' ? 130 : 1301;
    if (chainId !== expectedChainId) {
      setError(`Please switch to ${network === 'mainnet' ? 'Unichain Mainnet' : 'Unichain Testnet'}`);
      return false;
    }

    return true;
  };

  const deployToken = async () => {
    try {
      setIsDeploying(true);
      setError('');
      setSuccess('');

      const walletClient = createWalletClient({
        chain: network === 'mainnet' ? { 
          id: 130,
          name: 'Unichain',
          network: 'unichain',
          nativeCurrency: { decimals: 18, name: 'ETH', symbol: 'ETH' },
          rpcUrls: { default: { http: ['https://mainnet.unichain.org'] }, public: { http: ['https://mainnet.unichain.org'] } }
        } : {
          id: 1301,
          name: 'Unichain Sepolia',
          network: 'unichain-sepolia',
          nativeCurrency: { decimals: 18, name: 'ETH', symbol: 'ETH' },
          rpcUrls: { default: { http: ['https://sepolia.unichain.org'] }, public: { http: ['https://sepolia.unichain.org'] } }
        },
        transport: custom(window.ethereum)
      });

      const publicClient = createPublicClient({
        chain: network === 'mainnet' ? { 
          id: 130,
          name: 'Unichain',
          network: 'unichain',
          nativeCurrency: { decimals: 18, name: 'ETH', symbol: 'ETH' },
          rpcUrls: { default: { http: ['https://mainnet.unichain.org'] }, public: { http: ['https://mainnet.unichain.org'] } }
        } : {
          id: 1301,
          name: 'Unichain Sepolia',
          network: 'unichain-sepolia',
          nativeCurrency: { decimals: 18, name: 'ETH', symbol: 'ETH' },
          rpcUrls: { default: { http: ['https://sepolia.unichain.org'] }, public: { http: ['https://sepolia.unichain.org'] } }
        },
        transport: http()
      });

      const name = formData.name.trim().toLowerCase();
      const symbol = formData.symbol.trim().toLowerCase();
      const supply = BigInt(formData.totalSupply);
      
      console.log('Deploying token with params:', {
        name,
        symbol,
        supply: supply.toString(),
        fee: formatEther(deploymentFee),
        factoryAddress: chainId === 130 ? MAINNET_FACTORY : TESTNET_FACTORY
      });

      // Deploy token with fee
      const hash = await walletClient.writeContract({
        account: wallet,
        address: chainId === 130 ? MAINNET_FACTORY : TESTNET_FACTORY,
        abi: FACTORY_ABI,
        functionName: 'createToken',
        args: [name, symbol, supply],
        value: deploymentFee
      });

      console.log('Deployment transaction hash:', hash);
      
      // Wait for deployment confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('Transaction receipt:', receipt);

      if (receipt.status === 'success') {
        // Get token address from logs (first log's first topic is the token address)
        const tokenAddress = receipt.logs[0]?.address;
        setSuccess({
          hash,
          tokenAddress,
          symbol: formData.symbol,
          supply: formData.totalSupply
        });
        setFormData({ name: '', symbol: '', totalSupply: '' });
      } else {
        setError('Deployment failed. Please check the transaction on the block explorer.');
      }

    } catch (err) {
      console.error('Deployment error:', err);
      const errorMessage = err.message || '';
      if (errorMessage.includes('execution reverted')) {
        const revertReason = errorMessage.match(/reason="([^"]+)"/)?.[1] || 'Contract rejected the parameters';
        setError(`Deployment failed: ${revertReason}`);
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient funds for deployment');
      } else if (errorMessage.toLowerCase().includes('user rejected')) {
        setError('You rejected the transaction');
      } else {
        setError(`Failed to deploy token: ${errorMessage}`);
      }
    } finally {
      setIsDeploying(false);
      setShowConfirm(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateInputs()) {
      setShowConfirm(true);
    }
  };

  // Get network name for display
  const getNetworkName = () => {
    if (!chainId) return 'Not Connected';
    switch (chainId) {
      case 130:
        return 'Unichain Mainnet';
      case 1301:
        return 'Unichain Testnet';
      default:
        return `Unknown Network (${chainId})`;
    }
  };

  const getExplorerUrl = (hash) => {
    return `https://${network === 'mainnet' ? '' : 'sepolia.'}uniscan.xyz/tx/${hash}`;
  };

  const getTokenUrl = (address) => {
    return `https://${network === 'mainnet' ? '' : 'sepolia.'}uniscan.xyz/token/${address}`;
  };

  return (
    <>
      <Navbar />
      <Box 
        sx={{ 
          minHeight: '100vh',
          pt: '64px',
          display: 'flex',
          flexDirection: 'column',
          background: '#FAFAFA',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'linear-gradient(180deg, rgba(245, 13, 180, 0.03) 0%, transparent 100%)',
            pointerEvents: 'none'
          }
        }}
      >
        <Container 
          maxWidth="sm" 
          sx={{ 
            py: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, sm: 3 }
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{
                fontWeight: 700,
                color: '#111',
                letterSpacing: '-0.02em',
                display: 'inline-block',
                position: 'relative',
                fontSize: { xs: '1.75rem', sm: '2.25rem' },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: '10%',
                  width: '80%',
                  height: 3,
                  background: 'linear-gradient(90deg, transparent, rgba(245, 13, 180, 0.2), transparent)'
                }
              }}
            >
              Deploy <Box component="span" sx={{ color: '#F50DB4' }}>Token</Box>
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid rgba(245, 13, 180, 0.1)',
              p: { xs: 2, sm: 3 },
              boxShadow: '0 4px 16px rgba(245, 13, 180, 0.08)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'1\' fill=\'%23F50DB4\' fill-opacity=\'0.05\'/%3E%3C/svg%3E")',
                backgroundSize: '20px 20px',
                opacity: 0.5,
                pointerEvents: 'none'
              }
            }}
          >
            <Stack 
              spacing={{ xs: 2, sm: 2.5 }} 
              component="form" 
              onSubmit={handleSubmit}
            >
              <ToggleButtonGroup
                value={network}
                exclusive
                onChange={(e, val) => val && setNetwork(val)}
                sx={{
                  '& .MuiToggleButton-root': {
                    border: '1px solid rgba(245, 13, 180, 0.1)',
                    color: '#666',
                    py: { xs: 0.75, sm: 1 },
                    '&.Mui-selected': {
                      backgroundColor: '#F50DB4',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#d00a9b',
                      }
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(245, 13, 180, 0.05)',
                    }
                  }
                }}
              >
                <ToggleButton value="testnet">Testnet</ToggleButton>
                <ToggleButton value="mainnet">Mainnet</ToggleButton>
              </ToggleButtonGroup>

              {error && (
                <Alert 
                  severity="error"
                  sx={{
                    borderRadius: '12px',
                    '& .MuiAlert-icon': {
                      color: '#d32f2f'
                    }
                  }}
                >
                  <Typography>{error}</Typography>
                </Alert>
              )}
              {success && (
                <Alert 
                  severity="success"
                  sx={{
                    borderRadius: '12px',
                    '& .MuiAlert-icon': {
                      color: '#2e7d32'
                    },
                    '& a': {
                      color: '#F50DB4',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }
                  }}
                >
                  <Stack spacing={1}>
                    <Typography>
                      Success! {formData.totalSupply} {formData.symbol.toUpperCase()} has been minted to your wallet
                    </Typography>
                    <Box>
                      <Typography component="span" sx={{ mr: 1 }}>View:</Typography>
                      <Link 
                        href={getExplorerUrl(success.hash)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ mr: 2 }}
                      >
                        Transaction
                      </Link>
                      <Link 
                        href={getTokenUrl(success.tokenAddress)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Token
                      </Link>
                    </Box>
                  </Stack>
                </Alert>
              )}

              {wallet ? (
                <Alert 
                  severity={network === (chainId === 130 ? 'mainnet' : 'testnet') ? 'info' : 'warning'}
                  sx={{
                    borderRadius: '12px',
                    backgroundColor: network === (chainId === 130 ? 'mainnet' : 'testnet') 
                      ? 'rgba(245, 13, 180, 0.05)'
                      : 'rgba(237, 108, 2, 0.05)',
                    color: network === (chainId === 130 ? 'mainnet' : 'testnet') 
                      ? '#F50DB4'
                      : '#ed6c02',
                    border: '1px solid',
                    borderColor: network === (chainId === 130 ? 'mainnet' : 'testnet')
                      ? 'rgba(245, 13, 180, 0.1)'
                      : 'rgba(237, 108, 2, 0.1)',
                    '& .MuiAlert-icon': {
                      color: network === (chainId === 130 ? 'mainnet' : 'testnet')
                        ? '#F50DB4'
                        : '#ed6c02'
                    }
                  }}
                >
                  <Stack spacing={1}>
                    <Typography>
                      Your wallet {wallet.slice(0,6)}...{wallet.slice(-4)} is currently connected to {getNetworkName()}.
                    </Typography>
                    {network !== (chainId === 130 ? 'mainnet' : 'testnet') && (
                      <Typography>
                        Please switch to {network === 'mainnet' ? 'Unichain Mainnet' : 'Unichain Testnet'} to deploy your token.
                      </Typography>
                    )}
                    {deploymentFee && (
                      <Typography>Estimated Fee: {formatEther(deploymentFee)} ETH</Typography>
                    )}
                  </Stack>
                </Alert>
              ) : (
                <Alert 
                  severity="warning"
                  sx={{
                    borderRadius: '12px',
                    '& .MuiAlert-icon': {
                      color: '#ed6c02'
                    }
                  }}
                >
                  <Typography>Please connect your wallet</Typography>
                </Alert>
              )}

              <TextField
                label="Token Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                helperText="Minimum 3 characters"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(245, 13, 180, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F50DB4',
                    }
                  }
                }}
              />

              <TextField
                label="Token Symbol"
                name="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                required
                helperText="Minimum 3 characters, must be lowercase"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(245, 13, 180, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F50DB4',
                    }
                  }
                }}
              />

              <TextField
                label="Total Supply"
                name="totalSupply"
                type="number"
                value={formData.totalSupply}
                onChange={(e) => setFormData(prev => ({ ...prev, totalSupply: e.target.value }))}
                required
                helperText="Enter the number of tokens (min: 10, max: 999 trillion)"
                inputProps={{ min: "10", step: "1" }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(245, 13, 180, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F50DB4',
                    }
                  }
                }}
              />

              <Button
                type="button"
                variant="contained"
                disabled={!wallet || isDeploying}
                onClick={handleSubmit}
                sx={{
                  bgcolor: '#F50DB4',
                  color: 'white',
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1, sm: 1.25 },
                  borderRadius: '50px',
                  fontSize: { xs: 15, sm: 16 },
                  fontWeight: 600,
                  textTransform: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'translateY(0)',
                  '&:hover': { 
                    bgcolor: '#d00a9b',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 16px rgba(245, 13, 180, 0.25)'
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 2px 8px rgba(245, 13, 180, 0.25)'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(245, 13, 180, 0.12)',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                {isDeploying ? 'Deploying...' : 'Deploy Token'}
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Dialog 
        open={showConfirm} 
        onClose={() => setShowConfirm(false)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(245, 13, 180, 0.1)',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'1\' fill=\'%23F50DB4\' fill-opacity=\'0.05\'/%3E%3C/svg%3E")',
            backgroundSize: '20px 20px'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center',
          fontWeight: 600,
          color: '#111',
          borderBottom: '1px solid rgba(245, 13, 180, 0.1)',
          pb: 2
        }}>
          Confirm Token Deployment
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Alert 
              severity="info"
              sx={{
                mb: 2,
                borderRadius: '12px',
                backgroundColor: 'rgba(245, 13, 180, 0.05)',
                color: '#F50DB4',
                border: '1px solid rgba(245, 13, 180, 0.1)',
                '& .MuiAlert-icon': {
                  color: '#F50DB4'
                }
              }}
            >
              <Typography>Please review your token details carefully before deployment.</Typography>
            </Alert>
            <Box display="flex" justifyContent="space-between">
              <Typography color="#666">Token Name:</Typography>
              <Typography fontWeight={600}>{formData.name}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography color="#666">Token Symbol:</Typography>
              <Typography fontWeight={600}>{formData.symbol}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography color="#666">Total Supply:</Typography>
              <Typography fontWeight={600}>{formData.totalSupply}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography color="#666">Your Wallet:</Typography>
              <Typography fontWeight={600}>{wallet ? `${wallet.slice(0,6)}...${wallet.slice(-4)}` : 'Not Connected'}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography color="#666">Network:</Typography>
              <Typography fontWeight={600}>{network === 'mainnet' ? 'Unichain Mainnet' : 'Unichain Testnet'}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography color="#666">Estimated Deployment Cost:</Typography>
              <Typography fontWeight={600}>{deploymentFee ? `${formatEther(deploymentFee)} ETH` : 'Loading...'}</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ 
          p: 2.5,
          borderTop: '1px solid rgba(245, 13, 180, 0.1)'
        }}>
          <Button 
            onClick={() => setShowConfirm(false)}
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(245, 13, 180, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={deployToken}
            variant="contained"
            sx={{
              bgcolor: '#F50DB4',
              color: 'white',
              borderRadius: '50px',
              textTransform: 'none',
              px: 3,
              '&:hover': {
                bgcolor: '#d00a9b',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 16px rgba(245, 13, 180, 0.25)'
              }
            }}
          >
            Confirm Deployment
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TokenDeployerPage; 