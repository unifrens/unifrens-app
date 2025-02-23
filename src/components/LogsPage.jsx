import { Box, Typography, Card, CardContent, Stack, Chip, Grid } from '@mui/material';
import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';
import { formatEther, decodeEventLog } from 'viem';
import Layout from './Layout';
import Avatar from 'boring-avatars';

// Cache for block timestamps to avoid duplicate requests
const blockTimestampCache = new Map();

// Utility function for delay with exponential backoff
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getWithdrawalType = (type) => {
    const types = {
      0: { label: 'Soft Withdraw', color: 'primary' },
      1: { label: 'Hard Withdraw', color: 'error' },
      2: { label: 'Redistribute', color: 'success' }
    };
    return types[type] || { label: 'Unknown', color: 'default' };
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchBlockTimestamp = async (blockNumber, retryCount = 0) => {
      try {
        // Check cache first
        if (blockTimestampCache.has(blockNumber)) {
          return blockTimestampCache.get(blockNumber);
        }

        const response = await fetch(`https://unichain-sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBlockByNumber',
            params: [blockNumber, false]
          }),
          signal: controller.signal
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        if (!data.result || !data.result.timestamp) {
          throw new Error('Invalid block data');
        }

        const timestamp = new Date(parseInt(data.result.timestamp, 16) * 1000);
        blockTimestampCache.set(blockNumber, timestamp);
        return timestamp;
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        
        // Implement exponential backoff for rate limits
        if (err.message.includes('Too Many Requests') && retryCount < 3) {
          const backoffTime = Math.pow(2, retryCount) * 1000;
          await delay(backoffTime);
          return fetchBlockTimestamp(blockNumber, retryCount + 1);
        }
        throw err;
      }
    };

    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('Fetching logs for contract:', CONTRACT_ADDRESS);
        const deploymentBlock = '0xc4a079'; // 12888921 in hex

        const response = await fetch(`https://unichain-sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getLogs',
            params: [{
              address: CONTRACT_ADDRESS,
              fromBlock: deploymentBlock,
              toBlock: 'latest'
            }]
          }),
          signal: controller.signal
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message);
        }

        if (!data.result) {
          throw new Error('Invalid response format');
        }

        console.log('Raw logs:', data.result);

        // Get unique block numbers from all logs
        const uniqueBlockNumbers = [...new Set(data.result.map(log => log.blockNumber))];
        
        // Process blocks in smaller batches with exponential backoff
        const batchSize = 5; // Smaller batch size
        const blockTimestamps = new Map();
        
        for (let i = 0; i < uniqueBlockNumbers.length; i += batchSize) {
          const batch = uniqueBlockNumbers.slice(i, i + batchSize);
          
          // Process each block in the batch with individual retries
          const batchPromises = batch.map(blockNumber => 
            fetchBlockTimestamp(blockNumber)
              .then(timestamp => {
                blockTimestamps.set(blockNumber, timestamp);
                return { blockNumber, timestamp };
              })
              .catch(err => {
                console.warn(`Failed to fetch timestamp for block ${blockNumber}:`, err);
                return { blockNumber, timestamp: null };
              })
          );

          await Promise.all(batchPromises);

          // Add delay between batches to respect rate limits
          if (i + batchSize < uniqueBlockNumbers.length) {
            await delay(1000);
          }
        }

        const parsedLogs = data.result.map(log => {
          try {
            const decodedLog = decodeEventLog({
              abi: CONTRACT_ABI,
              data: log.data,
              topics: log.topics,
            });

            console.log('Decoded log:', decodedLog);
            
            const timestamp = blockTimestamps.get(log.blockNumber);
            if (!timestamp) {
              // Use block number as fallback sort key if timestamp is not available
              return {
                type: 'mint',
                tokenId: decodedLog.args.tokenId,
                weight: decodedLog.args.weight,
                name: decodedLog.args.name,
                owner: decodedLog.args.owner,
                blockNumber: parseInt(log.blockNumber, 16),
                transactionHash: log.transactionHash,
                timestamp: new Date(0), // Use epoch time as fallback
                blockNumberHex: log.blockNumber // Keep hex for sorting
              };
            }

            if (decodedLog.eventName === 'PositionMinted') {
              return {
                type: 'mint',
                tokenId: decodedLog.args.tokenId,
                weight: decodedLog.args.weight,
                name: decodedLog.args.name,
                owner: decodedLog.args.owner,
                blockNumber: parseInt(log.blockNumber, 16),
                transactionHash: log.transactionHash,
                timestamp,
                blockNumberHex: log.blockNumber
              };
            }
            
            return null;
          } catch (err) {
            console.error('Error decoding log:', err);
            return null;
          }
        });

        const validLogs = parsedLogs.filter(log => log !== null);
        console.log('Valid logs:', validLogs);

        if (validLogs.length === 0) {
          console.log('No valid logs found');
          if (isMounted) setLogs([]);
          return;
        }

        // Sort logs by timestamp first, then by block number if timestamps are equal
        if (isMounted) {
          setLogs(validLogs.sort((a, b) => {
            if (a.timestamp.getTime() === b.timestamp.getTime()) {
              return parseInt(b.blockNumberHex, 16) - parseInt(a.blockNumberHex, 16);
            }
            return b.timestamp - a.timestamp;
          }));
        }
      } catch (err) {
        console.error('Error in fetchLogs:', err);
        if (isMounted) {
          setError(err.message || 'Failed to fetch logs');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLogs();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []); // Empty dependency array to run only once

  return (
    <Layout>
      <Box sx={{
        maxWidth: '1200px', // Increased max width for grid
        width: '100%',
        mx: 'auto',
        px: 3 // Add padding on the sides
      }}>
        <Typography 
          variant="h2" 
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            color: '#111',
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            mb: 3,
            textAlign: 'center'
          }}
        >
          Unifrens Collection
        </Typography>
        
        <Box sx={{ 
          py: 3,
          textAlign: 'left'
        }}>
          {loading ? (
            <Typography sx={{ color: '#666', textAlign: 'center' }}>
              Loading collection...
            </Typography>
          ) : error ? (
            <Typography sx={{ color: '#f44336', textAlign: 'center' }}>
              Error: {error}
            </Typography>
          ) : logs.length === 0 ? (
            <Typography sx={{ color: '#666', textAlign: 'center' }}>
              No Unifrens found
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {logs
                .sort((a, b) => Number(a.tokenId) - Number(b.tokenId))
                .map((log, index) => (
                  <Grid item xs={6} sm={4} md={3} key={log.tokenId}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        background: '#fff',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                    >
                      <Box 
                        sx={{ 
                          pt: '100%',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Avatar
                            size={250}
                            name={`${log.tokenId}-${log.name}`}
                            variant="beam"
                            colors={['#F50DB4', '#FEAFF0']}
                            square={true}
                          />
                        </Box>
                      </Box>
                      <CardContent sx={{ flexGrow: 1, p: 1.5, pb: '12px !important' }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#111',
                            lineHeight: 1.2,
                            mb: 0.5,
                            width: '100%',
                            whiteSpace: 'nowrap',
                            transform: 'scale(var(--scale, 1))',
                            transformOrigin: 'left',
                            '&::before': {
                              content: 'attr(data-content)',
                              display: 'block',
                              height: 0,
                              overflow: 'hidden',
                              visibility: 'hidden'
                            }
                          }}
                          ref={(el) => {
                            if (el) {
                              const parent = el.parentElement;
                              const scale = parent.offsetWidth / el.offsetWidth;
                              el.style.setProperty('--scale', Math.min(1, scale));
                            }
                          }}
                        >
                          {log.name}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#666',
                              fontSize: '0.7rem',
                              opacity: 0.8,
                            }}
                          >
                            ID: {log.tokenId}
                          </Typography>
                          <Chip
                            label={log.weight}
                            size="small"
                            sx={{ 
                              backgroundColor: 'rgba(245, 13, 180, 0.1)',
                              color: '#F50DB4',
                              fontWeight: 600,
                              height: '18px',
                              '& .MuiChip-label': {
                                px: 1,
                                fontSize: '0.7rem'
                              }
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Layout>
  );
};

export default LogsPage;