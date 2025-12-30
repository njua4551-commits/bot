const { ethers } = require('ethers');
const chalk = require('chalk');

class MintExecutor {
  constructor(provider, contractAddress, mintFunction, mintPrice) {
    this.provider = provider;
    this.contractAddress = contractAddress;
    this.mintFunction = mintFunction;
    this.mintPrice = mintPrice;
    this.maxRetries = parseInt(process.env.RETRY_ATTEMPTS) || 3;
    this.retryDelay = parseInt(process.env.RETRY_DELAY) || 500;
  }

  async executeMint(wallet, quantity = 1) {
    const contract = new ethers.Contract(
      this.contractAddress,
      [`function ${this.mintFunction.signature} payable`],
      wallet
    );

    const totalCost = this.mintPrice * BigInt(quantity);
    
    // Optimización de gas
    let gasPrice;
    try {
      gasPrice = await this.provider.getFeeData();
    } catch (e) {
      console.log(chalk.yellow('⚠ No se pudo obtener fee data, usando valores por defecto'));
      gasPrice = {
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
      };
    }
    
    const maxPriorityFee = ethers.parseUnits(process.env.MAX_PRIORITY_FEE || '2', 'gwei');
    
    const txConfig = {
      value: totalCost,
      gasLimit: parseInt(process.env.GAS_LIMIT_MAX) || 280000
    };

    // Solo añadir fees si están disponibles (EIP-1559)
    if (gasPrice.maxFeePerGas) {
      txConfig.maxPriorityFeePerGas = maxPriorityFee;
      txConfig.maxFeePerGas = gasPrice.maxFeePerGas;
    } else if (gasPrice.gasPrice) {
      txConfig.gasPrice = gasPrice.gasPrice;
    }

    console.log(
      chalk.blue(`\n🚀 Wallet ${wallet.address.slice(0, 6)}... minteando ${quantity} NFT(s)...`)
    );

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        let tx;
        
        // Ejecuta la función correcta según los parámetros detectados
        if (this.mintFunction.params.includes('address')) {
          // mint(address, uint256)
          tx = await contract[this.mintFunction.name](wallet.address, quantity, txConfig);
        } else {
          // mint(uint256)
          tx = await contract[this.mintFunction.name](quantity, txConfig);
        }

        console.log(chalk.yellow(`⏳ TX enviada: ${tx.hash}`));
        console.log(chalk.gray(`   Explorador: https://monadexplorer.com/tx/${tx.hash}`));

        // Esperar confirmación con timeout
        const receipt = await Promise.race([
          tx.wait(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout esperando confirmación')), 60000)
          )
        ]);

        if (receipt.status === 1) {
          console.log(chalk.green(`✅ Mint exitoso! Block: ${receipt.blockNumber}`));
          console.log(chalk.gray(`   Gas usado: ${receipt.gasUsed.toString()}`));
          return { success: true, txHash: tx.hash, receipt, wallet: wallet.address };
        } else {
          throw new Error('Transacción falló');
        }

      } catch (error) {
        console.log(chalk.red(`❌ Intento ${attempt}/${this.maxRetries} falló`));
        
        let errorMsg = error.message;
        
        // Parsear errores comunes
        if (error.message.includes('insufficient funds')) {
          errorMsg = 'Fondos insuficientes';
        } else if (error.message.includes('execution reverted')) {
          errorMsg = 'Transacción revertida (mint cerrado o límite alcanzado)';
        } else if (error.message.includes('nonce')) {
          errorMsg = 'Error de nonce (transacción duplicada)';
        } else if (error.message.includes('gas')) {
          errorMsg = 'Gas insuficiente';
        }
        
        console.log(chalk.red(`   Error: ${errorMsg}`));

        if (attempt < this.maxRetries) {
          console.log(chalk.yellow(`   Reintentando en ${this.retryDelay}ms...`));
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          return { success: false, error: errorMsg, wallet: wallet.address };
        }
      }
    }
  }

  async executeBatchMint(wallets, quantityPerWallet = 1) {
    console.log(chalk.cyan(`\n🔥 Iniciando mint desde ${wallets.length} wallets...\n`));

    const startTime = Date.now();
    const promises = wallets.map((wallet, index) => {
      // Pequeño delay escalonado para evitar problemas de nonce
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(this.executeMint(wallet, quantityPerWallet));
        }, index * 100); // 100ms entre cada wallet
      });
    });

    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    // Resumen de resultados
    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const failed = results.length - successful;

    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.green(`✅ Mints exitosos: ${successful}`));
    console.log(chalk.red(`❌ Mints fallidos: ${failed}`));
    console.log(chalk.yellow(`⏱  Tiempo total: ${totalTime}s`));
    console.log(chalk.cyan('='.repeat(60) + '\n'));

    // Mostrar detalles de los exitosos
    if (successful > 0) {
      console.log(chalk.green('📋 Transacciones exitosas:'));
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value?.success) {
          console.log(chalk.gray(`   ${index + 1}. ${result.value.txHash}`));
        }
      });
      console.log('');
    }

    return results;
  }
}

module.exports = MintExecutor;
