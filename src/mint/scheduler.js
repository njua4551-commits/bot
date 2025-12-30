const chalk = require('chalk');

class MintScheduler {
  constructor(executor) {
    this.executor = executor;
  }

  async scheduleAtTimestamp(timestamp, wallets, quantity) {
    const now = Date.now();
    const targetTime = timestamp * 1000; // Convertir a milisegundos
    const delay = targetTime - now;

    if (delay < 0) {
      console.log(chalk.red('❌ El tiempo de mint ya pasó'));
      return;
    }

    const targetDate = new Date(targetTime);
    console.log(chalk.yellow(`⏰ Mint programado para: ${targetDate.toLocaleString()}`));
    console.log(chalk.yellow(`⏱  Tiempo restante: ${Math.floor(delay / 1000)} segundos\n`));

    // Countdown con actualización cada segundo
    let remaining = Math.floor(delay / 1000);
    
    const countdownInterval = setInterval(() => {
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(chalk.yellow(`⏱  Tiempo restante: ${timeString}`));
      
      remaining--;
      
      if (remaining < 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    // Esperar hasta 100ms antes del momento exacto
    const preciseDelay = delay - 100;
    if (preciseDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, preciseDelay));
    }

    // Busy wait para los últimos 100ms (máxima precisión)
    while (Date.now() < targetTime) {
      // Espera activa
    }
    
    clearInterval(countdownInterval);
    console.log(chalk.green('\n\n🚀 ¡INICIANDO MINT AHORA!'));
    console.log(chalk.cyan('='.repeat(60)));
    
    // Ejecutar mint
    return await this.executor.executeBatchMint(wallets, quantity);
  }

  async scheduleAtBlock(blockNumber, wallets, quantity) {
    console.log(chalk.yellow(`⏰ Esperando al bloque #${blockNumber}...\n`));

    let lastBlock = 0;
    
    // Monitorear bloques hasta llegar al target
    return new Promise((resolve) => {
      const blockListener = async (currentBlock) => {
        if (currentBlock !== lastBlock) {
          lastBlock = currentBlock;
          const remaining = blockNumber - currentBlock;
          
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(
            chalk.yellow(`⏱  Bloque actual: ${currentBlock} | Target: ${blockNumber} | Restantes: ${remaining}`)
          );

          if (currentBlock >= blockNumber) {
            this.executor.provider.removeListener('block', blockListener);
            
            console.log(chalk.green('\n\n🚀 ¡BLOQUE ALCANZADO! INICIANDO MINT'));
            console.log(chalk.cyan('='.repeat(60)));
            
            const results = await this.executor.executeBatchMint(wallets, quantity);
            resolve(results);
          }
        }
      };

      this.executor.provider.on('block', blockListener);
    });
  }

  async scheduleRelativeTime(seconds, wallets, quantity) {
    const targetTimestamp = Math.floor(Date.now() / 1000) + seconds;
    return this.scheduleAtTimestamp(targetTimestamp, wallets, quantity);
  }
}

module.exports = MintScheduler;
