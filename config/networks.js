require('dotenv').config();

module.exports = {
  monad: {
    name: 'Monad Mainnet',
    rpc: process.env.MONAD_RPC,
    chainId: parseInt(process.env.MONAD_CHAIN_ID),
    explorer: 'https://monadexplorer.com',
    nativeCurrency: {
      name: 'MON',
      symbol: 'MON',
      decimals: 18
    }
  },
  // Puedes añadir otras redes si lo necesitas
  ethereum: {
    name: 'Ethereum Mainnet',
    rpc: 'https://eth.llamarpc.com',
    chainId: 1,
    explorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    }
  },
  monadTestnet: {
    name: 'Monad Testnet',
    rpc: 'https://testnet-rpc.monad.xyz',
    chainId: 41453,
    explorer: 'https://testnet.monadexplorer.com',
    nativeCurrency: {
      name: 'MON',
      symbol: 'MON',
      decimals: 18
    }
  }
};
