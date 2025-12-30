/**
 * EJEMPLOS DE USO AVANZADO
 * Monad NFT Sniper Bot v2.0 - Modo Adaptativo
 */

require('dotenv').config();
const { ethers } = require('ethers');
const networks = require('./config/networks');
const WalletManager = require('./src/wallets/manager');
const AdaptiveMintExecutor = require('./src/mint/adaptive-executor');

// ============================================================
// EJEMPLO 1: Mint Adaptativo Básico
// ============================================================

async function example1_BasicAdaptiveMint() {
  console.log('\n=== EJEMPLO 1: Mint Adaptativo Básico ===\n');

  const provider = new ethers.JsonRpcProvider(networks.monad.rpc);
  const walletManager = new WalletManager(provider);
  
  const contractAddress = '0xYOUR_CONTRACT_ADDRESS';
  
  // Crear executor adaptativo
  const executor = new AdaptiveMintExecutor(provider, contractAddress);
  
  // Analizar contrato (escanea últimos 50 bloques)
  await executor.analyze();
  
  // Ejecutar mint desde todas las wallets
  const wallets = walletManager.getAllWallets();
  const results = await executor.executeBatchMint(wallets, 1);
  
  console.log(`Exitosos: ${results.successful}, Fallidos: ${results.failed}`);
}

// ============================================================
// EJEMPLO 2: Mint con Override de Precio
// ============================================================

async function example2_PriceOverride() {
  console.log('\n=== EJEMPLO 2: Override de Precio ===\n');

  const provider = new ethers.JsonRpcProvider(networks.monad.rpc);
  const walletManager = new WalletManager(provider);
  
  const contractAddress = '0xYOUR_CONTRACT_ADDRESS';
  
  // Crear con override de precio
  const executor = new AdaptiveMintExecutor(provider, contractAddress, {
    overrides: {
      price: '0.01' // Precio manual en MON
    }
  });
  
  await executor.analyze();
  
  const wallets = walletManager.getAllWallets();
  await executor.executeBatchMint(wallets, 2); // 2 NFTs por wallet
}

// ============================================================
// EJEMPLO 3: Whitelist con Merkle Proof
// ============================================================

async function example3_WhitelistMerkle() {
  console.log('\n=== EJEMPLO 3: Whitelist con Merkle Proof ===\n');

  const provider = new ethers.JsonRpcProvider(networks.monad.rpc);
  const walletManager = new WalletManager(provider);
  
  const contractAddress = '0xYOUR_CONTRACT_ADDRESS';
  
  // Tu Merkle proof (obtenido del proyecto)
  const myProof = [
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  ];
  
  const executor = new AdaptiveMintExecutor(provider, contractAddress, {
    overrides: {
      proof: myProof,
      limit: 2 // Límite de whitelist
    }
  });
  
  await executor.analyze();
  
  // Solo mintear desde la primera wallet (la que tiene whitelist)
  const wallet = walletManager.getWallet(0);
  const result = await executor.executeMint(wallet, 2);
  
  if (result.success) {
    console.log(`✅ Mint exitoso: ${result.txHash}`);
  }
}

// ============================================================
// EJEMPLO 4: OpenSea Signed (FCFS con Firma)
// ============================================================

async function example4_OpenSeaSigned() {
  console.log('\n=== EJEMPLO 4: OpenSea Signed ===\n');

  const provider = new ethers.JsonRpcProvider(networks.monad.rpc);
  const walletManager = new WalletManager(provider);
  
  const contractAddress = '0xYOUR_OPENSEA_CONTRACT';
  
  // Estos parámetros se obtienen interceptando la request del sitio
  const dropStage = {
    currency: '0x0000000000000000000000000000000000000000',
    feeRecipient: '0xFEE_RECIPIENT_ADDRESS',
    startTime: 1735555200,
    endTime: 1735641600,
    restrictFeeRecipients: false,
    maxTotalMintableByWallet: 10,
    feeBps: 500,
    mintPrice: ethers.parseEther('0.01')
  };
  
  const validationParams = {
    maxSupply: 10000,
    publicDropTimingRestricted: true
  };
  
  const signature = '0xYOUR_VALID_SIGNATURE_FROM_OPENSEA';
  
  const executor = new AdaptiveMintExecutor(provider, contractAddress);
  await executor.analyze();
  
  // Ejecutar con parámetros extras
  const wallets = walletManager.getAllWallets();
  const results = await executor.executeBatchMint(wallets, 1, {
    dropStage,
    validationParams,
    signature,
    feeRecipient: dropStage.feeRecipient
  });
}

// ============================================================
// EJEMPLO 5: Mint Programado con Análisis Previo
// ============================================================

async function example5_ScheduledWithAnalysis() {
  console.log('\n=== EJEMPLO 5: Mint Programado con Análisis Previo ===\n');

  const provider = new ethers.JsonRpcProvider(networks.monad.rpc);
  const walletManager = new WalletManager(provider);
  const MintScheduler = require('./src/mint/scheduler');
  
  const contractAddress = '0xYOUR_CONTRACT_ADDRESS';
  const mintTimestamp = 1735555200; // Timestamp del drop
  
  // Analizar ANTES del drop (cuando ya hay mints de testeo)
  const executor = new AdaptiveMintExecutor(provider, contractAddress);
  await executor.analyze();
  
  const pattern = executor.getPattern();
  console.log('Patrón detectado:', pattern.functionName);
  console.log('Precio:', pattern.avgPrice, 'MON');
  
  // Crear scheduler con el executor
  const scheduler = new MintScheduler(executor);
  
  // Programar mint
  const wallets = walletManager.getAllWallets();
  await scheduler.scheduleAtTimestamp(mintTimestamp, wallets, 1);
}

// ============================================================
// EJEMPLO 6: Verificar Elegibilidad Antes de Mintear
// ============================================================

async function example6_CheckEligibility() {
  console.log('\n=== EJEMPLO 6: Verificar Elegibilidad ===\n');

  const provider = new ethers.JsonRpcProvider(networks.monad.rpc);
  const walletManager = new WalletManager(provider);
  const MintAnalyzer = require('./src/mint/analyzer');
  
  const contractAddress = '0xYOUR_CONTRACT_ADDRESS';
  const analyzer = new MintAnalyzer(provider);
  
  // Analizar patrón
  const pattern = await analyzer.analyzeMints(contractAddress);
  
  if (!pattern) {
    console.log('No se pudo detectar patrón');
    return;
  }
  
  // Verificar cada wallet
  const wallets = walletManager.getAllWallets();
  
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const eligibility = await analyzer.canWalletMint(
      contractAddress,
      wallet.address,
      pattern
    );
    
    console.log(`\nWallet ${i + 1}: ${wallet.address}`);
    console.log(`  Puede mintear: ${eligibility.canMint ? '✅' : '❌'}`);
    if (eligibility.minted) {
      console.log(`  Ya minteado: ${eligibility.minted}`);
    }
    if (eligibility.maxPerWallet) {
      console.log(`  Límite: ${eligibility.maxPerWallet}`);
    }
    if (eligibility.reason) {
      console.log(`  Razón: ${eligibility.reason}`);
    }
  }
}

// ============================================================
// EJEMPLO 7: Mint Solo desde Wallets Elegibles
// ============================================================

async function example7_MintOnlyEligible() {
  console.log('\n=== EJEMPLO 7: Mint Solo Elegibles ===\n');

  const provider = new ethers.JsonRpcProvider(networks.monad.rpc);
  const walletManager = new WalletManager(provider);
  const MintAnalyzer = require('./src/mint/analyzer');
  
  const contractAddress = '0xYOUR_CONTRACT_ADDRESS';
  const analyzer = new MintAnalyzer(provider);
  const pattern = await analyzer.analyzeMints(contractAddress);
  
  // Filtrar wallets elegibles
  const allWallets = walletManager.getAllWallets();
  const eligibleWallets = [];
  
  for (const wallet of allWallets) {
    const check = await analyzer.canWalletMint(contractAddress, wallet.address, pattern);
    if (check.canMint) {
      eligibleWallets.push(wallet);
    }
  }
  
  console.log(`Wallets elegibles: ${eligibleWallets.length}/${allWallets.length}`);
  
  // Mintear solo desde elegibles
  const executor = new AdaptiveMintExecutor(provider, contractAddress);
  await executor.analyze();
  
  const results = await executor.executeBatchMint(eligibleWallets, 1);
  console.log(`Exitosos: ${results.successful}, Fallidos: ${results.failed}`);
}

// ============================================================
// EJEMPLO 8: Análisis Detallado sin Mintear
// ============================================================

async function example8_AnalysisOnly() {
  console.log('\n=== EJEMPLO 8: Solo Análisis ===\n');

  const provider = new ethers.JsonRpcProvider(networks.monad.rpc);
  const MintAnalyzer = require('./src/mint/analyzer');
  
  const contractAddress = '0xYOUR_CONTRACT_ADDRESS';
  const analyzer = new MintAnalyzer(provider);
  
  // Análisis exhaustivo
  const pattern = await analyzer.analyzeMints(contractAddress, 100); // 100 bloques
  
  if (!pattern) {
    console.log('No hay datos suficientes');
    return;
  }
  
  console.log('\n📊 ANÁLISIS COMPLETO:');
  console.log('='.repeat(50));
  console.log(`Función: ${pattern.functionName}`);
  console.log(`Tipo: ${pattern.functionType}`);
  console.log(`Method ID: ${pattern.methodId}`);
  console.log(`Signature: ${pattern.signature}`);
  console.log(`\nPrecio promedio: ${pattern.avgPrice} MON`);
  console.log(`Cantidad promedio: ${pattern.avgQty} NFTs`);
  console.log(`Muestras analizadas: ${pattern.sampleCount}`);
  console.log(`\n¿Es whitelist?: ${pattern.isWhitelist ? 'Sí' : 'No'}`);
  console.log(`¿Es público?: ${pattern.isPublic ? 'Sí' : 'No'}`);
  
  console.log('\n📋 MUESTRAS:');
  for (let i = 0; i < Math.min(3, pattern.samples.length); i++) {
    const sample = pattern.samples[i];
    console.log(`\n${i + 1}. TX: ${sample.txHash.slice(0, 10)}...`);
    console.log(`   Block: ${sample.blockNumber}`);
    console.log(`   Cantidad: ${sample.qty} NFTs`);
    console.log(`   Precio: ${sample.pricePerNFT} MON`);
    console.log(`   Gas: ${sample.gasUsed}`);
  }
  
  // Obtener precio actual
  const currentPrice = await analyzer.getCurrentMintPrice(contractAddress);
  if (currentPrice) {
    console.log(`\n💰 Precio actual: ${ethers.formatEther(currentPrice)} MON`);
  }
}

// ============================================================
// EJEMPLO 9: Múltiples Contratos en Paralelo
// ============================================================

async function example9_MultipleContracts() {
  console.log('\n=== EJEMPLO 9: Múltiples Contratos ===\n');

  const provider = new ethers.JsonRpcProvider(networks.monad.rpc);
  const walletManager = new WalletManager(provider);
  
  const contracts = [
    '0xCONTRACT_1',
    '0xCONTRACT_2',
    '0xCONTRACT_3'
  ];
  
  // Analizar todos en paralelo
  const executors = contracts.map(addr => 
    new AdaptiveMintExecutor(provider, addr)
  );
  
  await Promise.all(executors.map(ex => ex.analyze()));
  
  // Mintear desde el primero que sea público
  for (let i = 0; i < executors.length; i++) {
    const pattern = executors[i].getPattern();
    
    if (pattern && pattern.isPublic) {
      console.log(`\n✅ Minteando desde contrato ${i + 1}: ${contracts[i]}`);
      
      const wallets = walletManager.getAllWallets();
      await executors[i].executeBatchMint(wallets, 1);
      break;
    }
  }
}

// ============================================================
// EJEMPLO 10: Gas Ultra-Agresivo para FCFS
// ============================================================

async function example10_AggressiveGas() {
  console.log('\n=== EJEMPLO 10: Gas Ultra-Agresivo ===\n');

  const provider = new ethers.JsonRpcProvider(networks.monad.rpc);
  const walletManager = new WalletManager(provider);
  
  const contractAddress = '0xYOUR_CONTRACT_ADDRESS';
  
  const executor = new AdaptiveMintExecutor(provider, contractAddress, {
    maxRetries: 5,
    retryDelay: 100 // Reintentos más rápidos
  });
  
  await executor.analyze();
  
  const wallets = walletManager.getAllWallets();
  
  // Gas ultra-agresivo
  const results = await executor.executeBatchMint(wallets, 1, {
    maxPriorityFee: ethers.parseUnits('10', 'gwei'), // 10 gwei priority
    gasLimit: 500000 // Gas limit alto
  });
  
  console.log(`Exitosos: ${results.successful}`);
  console.log(`Tiempo promedio: ${results.totalTime / results.successful}s por mint`);
}

// ============================================================
// EJECUTAR EJEMPLO
// ============================================================

// Descomenta el ejemplo que quieras ejecutar:

// example1_BasicAdaptiveMint();
// example2_PriceOverride();
// example3_WhitelistMerkle();
// example4_OpenSeaSigned();
// example5_ScheduledWithAnalysis();
// example6_CheckEligibility();
// example7_MintOnlyEligible();
// example8_AnalysisOnly();
// example9_MultipleContracts();
// example10_AggressiveGas();

// O exporta para usar desde otro archivo
module.exports = {
  example1_BasicAdaptiveMint,
  example2_PriceOverride,
  example3_WhitelistMerkle,
  example4_OpenSeaSigned,
  example5_ScheduledWithAnalysis,
  example6_CheckEligibility,
  example7_MintOnlyEligible,
  example8_AnalysisOnly,
  example9_MultipleContracts,
  example10_AggressiveGas
};
