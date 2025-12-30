module.exports = {
  // Gas settings
  DEFAULT_GAS_LIMIT: 250000,
  MAX_GAS_LIMIT: 500000,
  MIN_GAS_LIMIT: 150000,
  
  // Timing
  BLOCK_TIME: 400, // milliseconds (Monad average block time)
  DEFAULT_RETRY_DELAY: 500,
  MAX_RETRY_ATTEMPTS: 5,
  
  // Mint settings
  MAX_NFTS_PER_TX: 20,
  DEFAULT_MINT_QUANTITY: 1,
  
  // Concurrency
  MAX_CONCURRENT_REQUESTS: 50,
  
  // URLs
  MONAD_EXPLORER: 'https://monadexplorer.com',
  MONAD_TESTNET_EXPLORER: 'https://testnet.monadexplorer.com',
  
  // Magic Eden
  MAGIC_EDEN_API: 'https://api-mainnet.magiceden.dev',
  MAGIC_EDEN_URL: 'https://magiceden.io',
  
  // Status codes
  TX_STATUS: {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
    TIMEOUT: 'timeout'
  },
  
  // Error messages
  ERRORS: {
    INSUFFICIENT_FUNDS: 'Fondos insuficientes',
    MINT_NOT_ACTIVE: 'Mint no está activo',
    MAX_SUPPLY_REACHED: 'Supply máximo alcanzado',
    INVALID_QUANTITY: 'Cantidad inválida',
    TRANSACTION_FAILED: 'Transacción falló',
    NETWORK_ERROR: 'Error de red',
    CONTRACT_ERROR: 'Error en el contrato'
  }
};
