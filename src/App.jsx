import { useState } from 'react';

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
  Fab,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  Avatar,
  Box
} from '@mui/material';

import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { ethers } from 'ethers';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DownloadingIcon from '@mui/icons-material/Downloading';
import SearchIcon from '@mui/icons-material/Search';

const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

const theme = createTheme({
  palette: {
    primary: blue,
    secondary: yellow,
  },
});

function App() {
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);

  async function connectWallet() {
    const accounts = await provider.send('eth_requestAccounts', []);

    if (accounts.length !== 0) {
      setUserAddress(accounts[0]);

      setConnected(true);
    }
  }

  async function disconnectWallet() {
    setConnected(false);
    setHasQueried(false);
    setTokenDataObjects([]);
    setResults([]);
  }

  async function getTokenBalance() {
    const config = {
      apiKey: "...", // your alchemy api key ,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.core.getTokenBalances(userAddress);

    setResults(data);

    console.log(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));

    console.log(await Promise.all(tokenDataPromises));
    setHasQueried(true);
  }
  return (
    <>
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
            {connected && (
              <>
                <Stack direction="row" spacing={1}>
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
              </>
            )}
            {!connected && (
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
            )}
          </Toolbar>
        </AppBar>

        {!connected && (
          <Typography m={30} align='center' variant='h4'>
            “Building ERC20 & NFT Indexer Powered by Cryptographic Truth”
          </Typography>
        )}

        {connected &&
          <>
            <Box m={1} mt={7}>

              <Card>
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    Assets
                  </Typography>

                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell align="left">Logo</TableCell>
                          <TableCell align="left">Token</TableCell>
                          <TableCell align="left">Symbol</TableCell>
                          <TableCell align="center">Balance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {hasQueried ? results.tokenBalances.map((e, i) => (
                          <TableRow
                            key={i}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell align="left">
                              <Avatar alt={tokenDataObjects[i].symbol} src={tokenDataObjects[i].logo} />
                            </TableCell>
                            <TableCell align="left">
                              {tokenDataObjects[i].name}
                            </TableCell>
                            <TableCell align="left">
                              {tokenDataObjects[i].symbol}
                            </TableCell>
                            <TableCell align="center">{Utils.formatUnits(
                              e.tokenBalance,
                              tokenDataObjects[i].decimals
                            )}</TableCell>
                          </TableRow>
                        )) : (
                          "Please make a query! This may take a few seconds..."
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                </CardContent>
              </Card>

            </Box>

            <Fab color="secondary" size="small" variant="extended" aria-label="add" sx={{
              position: "absolute",
              bottom: 25,
              right: 25
            }} onClick={getTokenBalance}>
              <SearchIcon />
              Query
            </Fab>
          </>
        }
      </ThemeProvider>
    </>
  );
}

export default App;
