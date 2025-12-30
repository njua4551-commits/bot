require('dotenv').config();
const { ethers } = require('ethers');
const chalk = require('chalk');
const inquirer = require('inquirer');

const networks = require('./config/networks');
const WalletManager = require('./src/wallets/manager');
const MintDetector = require('./src/mint/detector');
const MintExecutor = require('./src/mint/executor');
const MintScheduler = require('./src/mint/scheduler');
const Helpers = require('./src/utils/helpers');

// Banner
console.log(chalk.cyan('\n' + '='.repeat(60)));
console.log(chalk.green.bold('          🚀 MONAD NFT SNIPER BOT 🚀'));
console.log(chalk.cyan('      Multi-Wallet | FCFS Optimizado | Magic Eden'));
console.log(chalk.gray('          Compatible con OpenSea y todos los launchpads'));
console.log(chalk.cyan('='.repeat(60) + '\n'));

async function main() {
  try {
    // Validar configuración básica
    if (!process.env.MONAD_RPC) {
      throw new Error('❌ MONAD_RPC no está configurado en .env');
    }

    // Conectar a Monad
    console.log(chalk.yellow('🔌 Conectando a Monad...'));
    const provider = new ethers.JsonRpcProvider(networks.monad.rpc);
    
    try {
      const network = await provider.getNetwork();
      console.log(chalk.green(`✓ Conectado a ${networks.monad.name}`));
      console.log(chalk.gray(`  Chain ID: ${network.chainId}`));
      console.log(chalk.gray(`  RPC: ${networks.monad.rpc}\n`));
    } catch (error) {
      throw new Error(`❌ Error conectando al RPC: ${error.message}`);
    }

    // Cargar wallets
    const walletManager = new WalletManager(provider);
    await walletManager.checkBalances();

    // Preguntas interactivas
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: '¿Qué modo de mint quieres usar?',
        choices: [
          { name: '⚡ Mint Instantáneo (FCFS)', value: 'instant' },
          { name: '⏰ Mint Programado (Timestamp)', value: 'scheduled' },
          { name: '🔗 Mint por Bloque', value: 'block' }
        ]
      },
      {
        type: 'input',
        name: 'contractAddress',
        message: 'Dirección del contrato NFT o URL de Magic Eden:',
        validate: (input) => {
          // Intentar extraer dirección de URL
          const extracted = Helpers.extractContractFromMagicEdenUrl(input);
          if (extracted) return true;
          
          // Validar como dirección directa
          return ethers.isAddress(input) || 'Dirección inválida o URL no reconocida';
        },
        filter: (input) => {
          // Si es una URL, extraer la dirección
          const extracted = Helpers.extractContractFromMagicEdenUrl(input);
          return extracted || input;
        }
      },
      {
        type: 'number',
        name: 'quantity',
        message: '¿Cuántos NFTs por wallet?',
        default: 1,
        validate: (input) => {
          try {
            Helpers.validateMintQuantity(input);
            return true;
          } catch (error) {
            return error.message;
          }
        }
      }
    ]);

    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.yellow('🔍 Analizando contrato NFT...'));
    console.log(chalk.cyan('='.repeat(60) + '\n'));

    // Detectar configuración del contrato
    const detector = new MintDetector(provider);
    
    // Verificar que el contrato existe
    const code = await provider.getCode(answers.contractAddress);
    if (code === '0x') {
      throw new Error('❌ No hay contrato en esta dirección');
    }
    console.log(chalk.green('✓ Contrato encontrado'));

    // Detectar funciones y precios
    const mintFunction = await detector.detectMintFunction(answers.contractAddress);
    const mintPrice = await detector.getMintPrice(answers.contractAddress);
    await detector.getSupplyInfo(answers.contractAddress);
    await detector.checkMintStatus(answers.contractAddress);

    // Mostrar estimación de costos
    const wallets = walletManager.getAllWallets();
    await walletManager.estimateTotalCost(mintPrice, answers.quantity);

    // Confirmación final
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.yellow('¿Continuar con el mint?'),
        default: true
      }
    ]);

    if (!confirm) {
      console.log(chalk.red('❌ Operación cancelada por el usuario\n'));
      process.exit(0);
    }

    // Crear executor
    const executor = new MintExecutor(
      provider,
      answers.contractAddress,
      mintFunction,
      mintPrice
    );

    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.green.bold('🎯 INICIANDO PROCESO DE MINT'));
    console.log(chalk.cyan('='.repeat(60)));

    // Ejecutar según el modo
    if (answers.mode === 'instant') {
      // Mint instantáneo
      console.log(chalk.yellow('\n⚡ Modo: MINT INSTANTÁNEO\n'));
      await executor.executeBatchMint(wallets, answers.quantity);

    } else if (answers.mode === 'scheduled') {
      // Mint programado por timestamp
      const { timestamp } = await inquirer.prompt([
        {
          type: 'input',
          name: 'timestamp',
          message: 'Timestamp UNIX del lanzamiento (ej: 1735555200):',
          validate: (input) => {
            const ts = parseInt(input);
            if (isNaN(ts)) return 'Debe ser un número';
            if (ts <= Date.now() / 1000) return 'Debe ser un timestamp futuro';
            return true;
          }
        }
      ]);

      const scheduler = new MintScheduler(executor);
      await scheduler.scheduleAtTimestamp(parseInt(timestamp), wallets, answers.quantity);

    } else if (answers.mode === 'block') {
      // Mint por número de bloque
      const currentBlock = await provider.getBlockNumber();
      const { blockNumber } = await inquirer.prompt([
        {
          type: 'number',
          name: 'blockNumber',
          message: `Número de bloque (actual: ${currentBlock}):`,
          validate: (input) => {
            if (isNaN(input)) return 'Debe ser un número';
            if (input <= currentBlock) return 'Debe ser un bloque futuro';
            return true;
          }
        }
      ]);

      const scheduler = new MintScheduler(executor);
      await scheduler.scheduleAtBlock(blockNumber, wallets, answers.quantity);
    }

    console.log(chalk.green('\n✅ Proceso completado!\n'));
    console.log(chalk.gray('Los logs se guardaron en la carpeta logs/\n'));
    process.exit(0);

  } catch (error) {
    console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
    console.log(chalk.gray('Stack trace:'));
    console.log(chalk.gray(error.stack));
    process.exit(1);
  }
}

// Manejar errores no capturados
process.on('unhandledRejection', (error) => {
  console.log(chalk.red('\n❌ Error no manejado:'));
  console.log(chalk.red(error.message));
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n⚠️  Proceso interrumpido por el usuario'));
  console.log(chalk.gray('Cerrando de forma segura...\n'));
  process.exit(0);
});

// Ejecutar
main();
