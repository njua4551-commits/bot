const { ethers } = require('ethers');
const chalk = require('chalk');

class WalletManager {
  constructor(provider) {
    this.provider = provider;
    this.wallets = [];
    this.loadWallets();
  }

  loadWallets() {
    const privateKeys = [];
    let i = 1;
    
    // Carga todas las private keys del .env
    while (process.env[`PRIVATE_KEY_${i}`]) {
      privateKeys.push(process.env[`PRIVATE_KEY_${i}`]);
      i++;
    }

    if (privateKeys.length === 0) {
      throw new Error('❌ No se encontraron private keys en el archivo .env');
    }

    // Crea wallets a partir de las private keys
    this.wallets = privateKeys.map((pk, index) => {
      try {
        const wallet = new ethers.Wallet(pk, this.provider);
        console.log(chalk.green(`✓ Wallet ${index + 1} cargada: ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`));
        return wallet;
      } catch (error) {
        console.log(chalk.red(`✗ Error cargando wallet ${index + 1}: ${error.message}`));
        return null;
      }
    }).filter(w => w !== null);

    if (this.wallets.length === 0) {
      throw new Error('❌ No se pudieron cargar wallets válidas');
    }

    console.log(chalk.cyan(`\n📱 Total de wallets cargadas: ${this.wallets.length}\n`));
  }

  getAllWallets() {
    return this.wallets;
  }

  getWallet(index) {
    return this.wallets[index];
  }

  getWalletCount() {
    return this.wallets.length;
  }

  async checkBalances() {
    console.log(chalk.yellow('💰 Verificando balances...\n'));
    
    const balancePromises = this.wallets.map(async (wallet, i) => {
      try {
        const balance = await this.provider.getBalance(wallet.address);
        const balanceInMON = ethers.formatEther(balance);
        
        const displayBalance = parseFloat(balanceInMON) > 0.001 
          ? chalk.green(`${balanceInMON} MON`) 
          : chalk.red(`${balanceInMON} MON (⚠️ Bajo)`);
        
        console.log(
          `Wallet ${i + 1}: ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} - ${displayBalance}`
        );
        
        return { wallet, balance: balanceInMON };
      } catch (error) {
        console.log(chalk.red(`Error verificando wallet ${i + 1}: ${error.message}`));
        return { wallet, balance: '0', error: true };
      }
    });

    const results = await Promise.all(balancePromises);
    console.log('');
    
    return results;
  }

  async estimateTotalCost(mintPrice, quantityPerWallet) {
    const gasEstimate = ethers.parseUnits('0.001', 'ether'); // Estimación aproximada de gas
    const costPerWallet = (BigInt(mintPrice) * BigInt(quantityPerWallet)) + gasEstimate;
    const totalCost = costPerWallet * BigInt(this.wallets.length);
    
    console.log(chalk.cyan('💵 Estimación de costos:'));
    console.log(chalk.gray(`   Precio por NFT: ${ethers.formatEther(mintPrice)} MON`));
    console.log(chalk.gray(`   Gas estimado: ${ethers.formatEther(gasEstimate)} MON`));
    console.log(chalk.gray(`   Costo por wallet: ${ethers.formatEther(costPerWallet)} MON`));
    console.log(chalk.yellow(`   COSTO TOTAL: ${ethers.formatEther(totalCost)} MON`));
    console.log('');
    
    return totalCost;
  }
}

module.exports = WalletManager;
