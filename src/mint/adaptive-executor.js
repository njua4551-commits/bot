const { ethers } = require('ethers');
const chalk = require('chalk');
const MintAnalyzer = require('./analyzer');
const PayloadBuilder = require('./payload');

class AdaptiveMintExecutor {
  constructor(provider, contractAddress, options = {}) {
    this.provider = provider;
    this.contractAddress = contractAddress;
    this.analyzer = new MintAnalyzer(provider);
    this.payloadBuilder = new PayloadBuilder(provider);
    this.maxRetries = options.maxRetries || parseInt(process.env.RETRY_ATTEMPTS) || 3;
    this.retryDelay = options.retryDelay || parseInt(process.env.RETRY_DELAY) || 500;
    this.mintPattern = null;
    this.manualOverrides = options.overrides || {};
  }

  /**
   * Analiza el contrato y detecta el patrón de mint automáticamente
   */
  async analyze(blocksToScan = 50) {
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan.bold('🧠 MODO ADAPTATIVO ACTIVADO'));
    console.log(chalk.cyan('='.repeat(60)));

    // Analizar transacciones recientes
    this.mintPattern = await this.analyzer.analyzeMints(this.contractAddress, blocksToScan);

    if (!this.mintPattern) {
      console.log(chalk.yellow('\n⚠ No se pudo detectar patrón automáticamente'));
      console.log(chalk.yellow('   Usando detección manual...\n'));
      return false;
    }

    // Aplicar overrides manuales si existen
    if (this.manualOverrides.price) {
      console.log(chalk.yellow(`\n⚙️  Override manual de precio: ${this.manualOverrides.price} MON`));
      this.mintPattern.avgPriceWei = ethers.parseEther(this.manualOverrides.price);
      this.mintPattern.avgPrice = this.manualOverrides.price;
    }

    if (this.manualOverrides.function) {
      console.log(chalk.yellow(`⚙️  Override manual de función: ${this.manualOverrides.function}\n`));
      this.mintPattern.signature = this.manualOverrides.function;
    }

    return true;
  }

  /**
   * Ejecuta mint desde una wallet usando el patrón detectado
   */
  async executeMint(wallet, quantity = 1, extras = {}) {
    if (!this.mintPattern) {
      throw new Error('❌ Debes ejecutar analyze() primero');
    }

    // Verificar si la wallet puede mintear
    const canMint = await this.analyzer.canWalletMint(
      this.contractAddress,
      wallet.address,
      this.mintPattern
    );

    if (!canMint.canMint) {
      console.log(chalk.red(`\n❌ Wallet ${wallet.address.slice(0, 6)}... no puede mintear`));
      console.log(chalk.red(`   Razón: ${canMint.reason}\n`));
      return { success: false, error: canMint.reason, wallet: wallet.address };
    }

    // Obtener fee data
    let gasPrice;
    try {
      gasPrice = await this.provider.getFeeData();
    } catch (e) {
      gasPrice = {
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
      };
    }

    // Preparar extras con gas configuration
    const mintExtras = {
      ...extras,
      ...this.manualOverrides,
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFee: ethers.parseUnits(process.env.MAX_PRIORITY_FEE || '2', 'gwei'),
      gasLimit: parseInt(process.env.GAS_LIMIT_MAX) || 300000
    };

    // Construir payload
    const contract = this.payloadBuilder.buildContract(
      this.contractAddress,
      this.mintPattern,
      wallet
    );

    const payload = this.payloadBuilder.buildPayload(
      contract,
      this.mintPattern,
      quantity,
      wallet,
      mintExtras
    );

    // Validar payload
    this.payloadBuilder.validatePayload(payload, this.mintPattern);

    console.log(
      chalk.blue(`🚀 Wallet ${wallet.address.slice(0, 6)}... minteando ${quantity} NFT(s)...`)
    );

    // Ejecutar con reintentos
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Ejecutar la transacción
        const tx = await contract[payload.method](...payload.args, payload.config);

        console.log(chalk.yellow(`⏳ TX enviada: ${tx.hash}`));
        console.log(chalk.gray(`   Explorador: https://monadexplorer.com/tx/${tx.hash}`));
        console.log(chalk.gray(`   Esperando confirmación...`));

        // Esperar confirmación con timeout
        const receipt = await Promise.race([
          tx.wait(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout esperando confirmación')), 60000)
          )
        ]);

        if (receipt.status === 1) {
          // Verificar eventos de mint
          const mintSuccess = this.verifyMintSuccess(receipt);
          
          if (mintSuccess) {
            console.log(chalk.green(`✅ Mint verificado! Block: ${receipt.blockNumber}`));
            console.log(chalk.green(`   NFTs minteados: ${mintSuccess.nftsMinted}`));
            console.log(chalk.gray(`   Gas usado: ${receipt.gasUsed.toString()}\n`));
            
            return {
              success: true,
              txHash: tx.hash,
              receipt,
              wallet: wallet.address,
              nftsMinted: mintSuccess.nftsMinted
            };
          } else {
            console.log(chalk.yellow(`⚠️ Transacción exitosa pero no se detectaron NFTs minteados`));
          }
        } else {
          throw new Error('Transacción falló');
        }

      } catch (error) {
        console.log(chalk.red(`❌ Intento ${attempt}/${this.maxRetries} falló`));

        let errorMsg = this.parseError(error);
        console.log(chalk.red(`   Error: ${errorMsg}`));

        if (attempt < this.maxRetries) {
          console.log(chalk.yellow(`   Reintentando en ${this.retryDelay}ms...\n`));
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          return { success: false, error: errorMsg, wallet: wallet.address };
        }
      }
    }
  }

  /**
   * Verifica que el mint fue exitoso mediante eventos
   */
  verifyMintSuccess(receipt) {
    const transferTopic = ethers.id('Transfer(address,address,uint256)');
    const zeroAddress = ethers.zeroPadValue('0x0', 32);

    let nftsMinted = 0;

    for (const log of receipt.logs) {
      // Buscar eventos Transfer con from = 0x0 (mint)
      if (log.topics[0] === transferTopic && log.topics[1] === zeroAddress) {
        nftsMinted++;
      }
    }

    return nftsMinted > 0 ? { nftsMinted } : null;
  }

  /**
   * Parsea errores comunes
   */
  parseError(error) {
    const message = error.message || error.toString();

    if (message.includes('insufficient funds')) {
      return 'Fondos insuficientes';
    }
    if (message.includes('execution reverted')) {
      if (message.includes('max supply')) {
        return 'Supply máximo alcanzado';
      }
      if (message.includes('max per wallet') || message.includes('max per address')) {
        return 'Límite por wallet alcanzado';
      }
      if (message.includes('not started') || message.includes('paused')) {
        return 'Mint no está activo';
      }
      if (message.includes('whitelist') || message.includes('proof')) {
        return 'No estás en whitelist o proof inválido';
      }
      if (message.includes('signature')) {
        return 'Firma inválida';
      }
      return 'Transacción revertida';
    }
    if (message.includes('nonce')) {
      return 'Error de nonce (transacción duplicada)';
    }
    if (message.includes('gas')) {
      return 'Gas insuficiente';
    }
    if (message.includes('timeout')) {
      return 'Timeout esperando confirmación';
    }

    return message.slice(0, 100); // Limitar longitud
  }

  /**
   * Ejecuta mint desde múltiples wallets
   */
  async executeBatchMint(wallets, quantityPerWallet = 1, extras = {}) {
    if (!this.mintPattern) {
      throw new Error('❌ Debes ejecutar analyze() primero');
    }

    console.log(chalk.cyan(`\n🔥 Iniciando mint adaptativo desde ${wallets.length} wallets...\n`));
    console.log(chalk.gray(`   Función detectada: ${this.mintPattern.functionName}`));
    console.log(chalk.gray(`   Tipo: ${this.mintPattern.functionType}`));
    console.log(chalk.gray(`   Precio: ${this.mintPattern.avgPrice} MON por NFT\n`));

    const startTime = Date.now();
    
    // Ejecutar mints con delay escalonado
    const promises = wallets.map((wallet, index) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(this.executeMint(wallet, quantityPerWallet, extras));
        }, index * 100); // 100ms entre cada wallet
      });
    });

    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    // Analizar resultados
    let successful = 0;
    let totalNFTsMinted = 0;

    const successfulTxs = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value?.success) {
        successful++;
        totalNFTsMinted += result.value.nftsMinted || 0;
        successfulTxs.push(result.value);
      }
    }

    const failed = results.length - successful;

    // Mostrar resumen
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.green.bold(`✅ Mints exitosos: ${successful}/${results.length}`));
    console.log(chalk.green(`📦 Total NFTs minteados: ${totalNFTsMinted}`));
    console.log(chalk.red(`❌ Mints fallidos: ${failed}`));
    console.log(chalk.yellow(`⏱  Tiempo total: ${totalTime}s`));
    console.log(chalk.yellow(`💰 Costo total: ${(parseFloat(this.mintPattern.avgPrice) * totalNFTsMinted).toFixed(4)} MON`));
    console.log(chalk.cyan('='.repeat(60) + '\n'));

    // Mostrar transacciones exitosas
    if (successfulTxs.length > 0) {
      console.log(chalk.green('📋 Transacciones exitosas:'));
      successfulTxs.forEach((tx, index) => {
        console.log(chalk.gray(`   ${index + 1}. ${tx.txHash} (${tx.nftsMinted} NFTs)`));
      });
      console.log('');
    }

    // Mostrar errores si los hay
    if (failed > 0) {
      console.log(chalk.red('❌ Errores encontrados:'));
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && !result.value?.success) {
          console.log(chalk.red(`   Wallet ${index + 1}: ${result.value.error}`));
        } else if (result.status === 'rejected') {
          console.log(chalk.red(`   Wallet ${index + 1}: ${result.reason}`));
        }
      });
      console.log('');
    }

    return {
      successful,
      failed,
      totalNFTsMinted,
      results,
      totalTime: parseFloat(totalTime)
    };
  }

  /**
   * Obtiene información del patrón detectado
   */
  getPattern() {
    return this.mintPattern;
  }

  /**
   * Establece overrides manuales
   */
  setOverrides(overrides) {
    this.manualOverrides = { ...this.manualOverrides, ...overrides };
  }
}

module.exports = AdaptiveMintExecutor;
