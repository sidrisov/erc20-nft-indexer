import { useState } from 'react';

import {
  Box,
  Flex,
  Heading,
  Image,
  SimpleGrid,
} from '@chakra-ui/react';

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
  Fab
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
  }

  async function getTokenBalance() {
    const config = {
      apiKey: "", // your alchemy api key ,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.core.getTokenBalances(userAddress);

    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
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
              Web3 Indexer
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
        {
          connected &&
          <>
            <Fab color="secondary" size="small" variant="extended" aria-label="add" sx={{
              position: "absolute",
              bottom: 25,
              right: 25
            }} onClick={getTokenBalance}>
              <SearchIcon />
              Query
            </Fab>

            <Flex
              w='100%'
              flexDirection='column'
              alignItems='center'
              justifyContent={"center"}
            >

              <Heading my={36}>ERC-20 token balances:</Heading>

              {hasQueried ? (
                <SimpleGrid w={"90vw"} columns={4} spacing={24}>
                  {results.tokenBalances.map((e, i) => {
                    return (
                      <Flex
                        flexDir={"column"}
                        color='white'
                        bg='blue'
                        w={"20vw"}
                        key={e.id}
                      >
                        <Box>
                          <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                        </Box>
                        <Box>
                          <b>Balance:</b>&nbsp;
                          {Utils.formatUnits(
                            e.tokenBalance,
                            tokenDataObjects[i].decimals
                          )}
                        </Box>
                        <Image src={tokenDataObjects[i].logo} />
                      </Flex>
                    );
                  })}
                </SimpleGrid>
              ) : (
                "Please make a query! This may take a few seconds..."
              )}
            </Flex>
          </>
        }
      </ThemeProvider>
    </>
  );
}

export default App;
