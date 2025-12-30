const { ethers } = require('ethers');

class Helpers {
  // Valida si una dirección de Ethereum es válida
  static isValidAddress(address) {
    return ethers.isAddress(address);
  }

  // Formatea un número grande a string legible
  static formatBigNumber(bn, decimals = 18) {
    return ethers.formatUnits(bn, decimals);
  }

  // Parsea un string a BigNumber
  static parseToBigNumber(value, decimals = 18) {
    return ethers.parseUnits(value.toString(), decimals);
  }

  // Acorta una dirección para display
  static shortAddress(address, chars = 4) {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  }

  // Espera X milisegundos
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Obtiene timestamp actual en segundos
  static getCurrentTimestamp() {
    return Math.floor(Date.now() / 1000);
  }

  // Convierte timestamp a fecha legible
  static timestampToDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleString();
  }

  // Calcula el tiempo restante hasta un timestamp
  static getTimeRemaining(targetTimestamp) {
    const now = this.getCurrentTimestamp();
    const remaining = targetTimestamp - now;
    
    if (remaining <= 0) return 'Pasado';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  // Extrae dirección de contrato de URL de Magic Eden
  static extractContractFromMagicEdenUrl(url) {
    // Ejemplos de URLs:
    // https://magiceden.io/launchpad/monad/0x1234...
    // https://magiceden.io/mint-terminal/monad/0x1234...
    
    const patterns = [
      /launchpad\/monad\/(0x[a-fA-F0-9]{40})/,
      /mint-terminal\/monad\/(0x[a-fA-F0-9]{40})/,
      /marketplace\/(0x[a-fA-F0-9]{40})/,
      /(0x[a-fA-F0-9]{40})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  // Calcula el porcentaje
  static calculatePercentage(value, total) {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(2);
  }

  // Valida cantidad de mint
  static validateMintQuantity(quantity, max = 100) {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > max) {
      throw new Error(`Cantidad debe estar entre 1 y ${max}`);
    }
    return qty;
  }

  // Genera un delay aleatorio entre min y max ms
  static randomDelay(min = 100, max = 500) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Calcula gas total estimado
  static estimateGasCost(gasLimit, gasPrice) {
    return BigInt(gasLimit) * BigInt(gasPrice);
  }

  // Formatea Wei a Ether con decimales específicos
  static formatEther(wei, decimals = 4) {
    const ether = ethers.formatEther(wei);
    return parseFloat(ether).toFixed(decimals);
  }

  // Verifica si un timestamp es futuro
  static isFutureTimestamp(timestamp) {
    return timestamp > this.getCurrentTimestamp();
  }

  // Crea URL del explorador
  static getExplorerUrl(txHash, network = 'monad') {
    const explorers = {
      monad: 'https://monadexplorer.com/tx/',
      monadTestnet: 'https://testnet.monadexplorer.com/tx/',
      ethereum: 'https://etherscan.io/tx/'
    };
    
    return `${explorers[network] || explorers.monad}${txHash}`;
  }

  // Retry con backoff exponencial
  static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        const delay = baseDelay * Math.pow(2, i);
        await this.sleep(delay);
      }
    }
  }
}

module.exports = Helpers;
