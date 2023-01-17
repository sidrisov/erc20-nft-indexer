import { useEffect, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { blue, yellow } from '@mui/material/colors';

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Chip,
  Stack,
  Divider,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Avatar,
  Box,
  CircularProgress,
  Skeleton,
  Grid
} from '@mui/material';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DownloadingIcon from '@mui/icons-material/Downloading';

import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { ethers } from 'ethers';

const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

const theme = createTheme({
  palette: {
    primary: blue,
    secondary: yellow,
    mode: "light"
  }
});

const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_TESTNET_API_KEY;

function App() {
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [results, setResults] = useState({ "tokens": [], "nfts": [] });
  const [hasQueried, setHasQueried] = useState({ "tokens": false, "nfts": false });
  const [metaDataObjects, setMetaDataObjects] = useState({ "tokens": [], "nfts": [] });
  const [tokenFilter, setTokenFilter] = useState({
    "isErc20": true // false for nfts
  });

  async function connectWallet() {
    const accounts = await provider.send('eth_requestAccounts', []);

    if (accounts.length !== 0) {
      setUserAddress(accounts[0]);

      setConnected(true);
    }
  }

  useEffect(() => {
    if (connected) {
      fetchAllAssets();
    }
  }, [userAddress, connected, tokenFilter]);

  useEffect(() => {
    console.log("results: ", results);
    console.log("meta: ", metaDataObjects);
  }, [results, metaDataObjects]);

  async function disconnectWallet() {
    setConnected(false);
    setHasQueried({ "tokens": false, "nfts": false });
    setMetaDataObjects({ "tokens": [], "nfts": [] });
    setResults({ "tokens": [], "nfts": [] });
  }

  async function filterByTokenType() {
    const isErc20 = !tokenFilter.isErc20;
    setTokenFilter({ ...tokenFilter, isErc20 });
  }

  async function fetchAllAssets() {
    const config = {
      apiKey: ALCHEMY_API_KEY,
      network: Network.ETH_GOERLI,
    };

    const alchemy = new Alchemy(config);

    if (tokenFilter.isErc20) {
      const data = await alchemy.core.getTokenBalances(userAddress);
      setResults({ ...results, tokens: data.tokenBalances });
      const tokenDataPromises = [];

      for (let i = 0; i < data.tokenBalances.length; i++) {
        const tokenData = alchemy.core.getTokenMetadata(
          data.tokenBalances[i].contractAddress
        );
        tokenDataPromises.push(tokenData);
      }

      setMetaDataObjects({ ...metaDataObjects, tokens: await Promise.all(tokenDataPromises) });
      setHasQueried({ ...hasQueried, tokens: true });
    } else {
      const data = await alchemy.nft.getNftsForOwner(userAddress);

      setResults({ ...results, nfts: data.ownedNfts });

      const tokenDataPromises = [];

      for (let i = 0; i < data.ownedNfts.length; i++) {
        const tokenData = alchemy.nft.getNftMetadata(
          data.ownedNfts[i].contract.address,
          data.ownedNfts[i].tokenId
        );
        tokenDataPromises.push(tokenData);
      }

      setMetaDataObjects({ ...metaDataObjects, nfts: await Promise.all(tokenDataPromises) });
      setHasQueried({ ...hasQueried, nfts: true });
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <AppBar position='fixed' color='primary'>
        <Toolbar variant='dense'>
          <DownloadingIcon color={connected ? "secondary" : "inherit"} />
          <Typography
            color={connected ? "secondary" : "inherit"}
            variant='h6'
            sx={{ flexGrow: 1 }}
          >
            Indexer
          </Typography>
          {connected &&
            <Stack direction="row" spacing={1}>
              {
                (tokenFilter.isErc20 ? !hasQueried.tokens : !hasQueried.nfts) && <CircularProgress color="secondary" size={25}
                  thickness={4} />
              }

              <Chip label="Tokens" size="small" variant="filled" color={tokenFilter.isErc20 ? "secondary" : "info"} clickable={!tokenFilter.isErc20} onClick={() => { !tokenFilter.isErc20 && filterByTokenType() }} />
              <Chip label="NFTs" size="small" variant="filled" color={tokenFilter.isErc20 ? "info" : "secondary"} clickable={tokenFilter.isErc20} onClick={() => { tokenFilter.isErc20 && filterByTokenType() }} />

              <Divider orientation="vertical" flexItem sx={{ bgcolor: "white" }} />

              <Chip
                label={userAddress}
                size='small'
                variant='filled'
                color='secondary'
                deleteIcon={<PowerSettingsNewIcon />}
                onDelete={() => {
                  disconnectWallet();
                }}
              />
            </Stack>
          }
          {!connected && 
            <Button
              size='small'
              variant='outlined'
              color='inherit'
              endIcon={<AccountBalanceWalletIcon />}
              onClick={() => {
                connectWallet();
              }}
            >
              Connect
            </Button>
          }
        </Toolbar>
      </AppBar>
      {!connected && (
        <Typography m={30} align='center' variant='h4'>
          “Building ERC20 & NFT Indexer Powered by Cryptographic Truth”
        </Typography>
      )}
      {connected &&
        <Box m={1} mt={7} sx={{ display: 'flex', flexGrow: 1 }}>
          <Card>
            <CardContent>
              <Box sx={{ justifyContent: "space-between", display: "flex", flexDirection: "row" }}>
                <Typography gutterBottom variant="h6" component="box">
                  Assets
                </Typography>
                <Typography gutterBottom variant="subtitle1" component="box">
                  {tokenFilter.isErc20 ? "ERC20" : "NFTs"}
                </Typography>
              </Box>
              {tokenFilter.isErc20 ?
                <TableContainer>
                  <Table sx={{ minWidth: 600 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell align="left">Token</TableCell>
                        <TableCell align="left">Symbol</TableCell>
                        <TableCell align="center">Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {hasQueried.tokens && results.tokens.map((e, i) => (
                        <TableRow
                          key={i}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell align="right">
                            <Avatar alt={metaDataObjects.tokens[i].symbol} src={metaDataObjects.tokens[i].logo} />
                          </TableCell>
                          <TableCell align="left">
                            {metaDataObjects.tokens[i].name}
                          </TableCell>
                          <TableCell align="left">
                            {metaDataObjects.tokens[i].symbol}
                          </TableCell>
                          <TableCell align="center">{parseFloat(Utils.formatUnits(
                            e.tokenBalance,
                            metaDataObjects.tokens[i].decimals
                          )).toFixed(3)}</TableCell>
                        </TableRow>
                      ))
                      }
                    </TableBody>
                  </Table>
                  {!hasQueried.tokens &&
                    <Stack>
                      <Skeleton variant="text" height={75} />
                      <Divider></Divider>
                      <Skeleton variant="text" height={75} />
                      <Divider></Divider>
                      <Skeleton variant="text" height={75} />
                    </Stack>
                  }
                </TableContainer>
                :
                <Grid container sx={{ minWidth: 600 }} spacing={2}>
                  {hasQueried.nfts ?
                    results.nfts.map((e, i) => (
                      <Grid item key={"gridItem:" + e.tokenId}>
                        <Stack
                          direction="column"
                          justifyContent="center"
                          alignItems="center"
                          spacing={1}
                        >
                          <img width="150" src={metaDataObjects.nfts[i].rawMetadata.image} alt={metaDataObjects.nfts[i].title} />
                          <Typography variant="subtitle1">{metaDataObjects.nfts[i].title}</Typography>
                        </Stack>
                      </Grid>
                    )) :
                    [...Array(3)].map(() => (
                      <Grid item>
                        <Skeleton variant="rectangular" width={150} height={150} />
                      </Grid>
                    ))
                  }
                </Grid>
              }
            </CardContent>
          </Card>
        </Box>
      }
    </ThemeProvider>
  );
}

export default App;
