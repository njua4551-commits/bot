const { ethers } = require('ethers');
const chalk = require('chalk');

/**
 * Analizador inteligente de transacciones de mint
 * Escanea bloques recientes para detectar patrones de mint reales
 */
class MintAnalyzer {
  constructor(provider) {
    this.provider = provider;
    this.transferEventSignature = ethers.id("Transfer(address,address,uint256)");
  }

  /**
   * Analiza las últimas transacciones de mint para detectar patrones
   */
  async analyzeMints(contractAddress, blocksToScan = 50) {
    console.log(chalk.yellow(`\n🔍 Analizando últimas transacciones de mint...`));
    console.log(chalk.gray(`   Escaneando últimos ${blocksToScan} bloques\n`));

    try {
      const latestBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(latestBlock - blocksToScan, 0);

      // Buscar eventos Transfer con from = 0x0 (mints)
      const logs = await this.provider.getLogs({
        fromBlock,
        toBlock: latestBlock,
        address: contractAddress,
        topics: [
          this.transferEventSignature,
          ethers.zeroPadValue('0x0', 32) // from = 0x0
        ]
      });

      if (logs.length === 0) {
        console.log(chalk.yellow('⚠ No se encontraron mints recientes'));
        return null;
      }

      console.log(chalk.green(`✓ Encontrados ${logs.length} eventos de mint\n`));

      // Agrupar por txHash
      const grouped = {};
      for (const log of logs) {
        if (!grouped[log.transactionHash]) {
          grouped[log.transactionHash] = [];
        }
        grouped[log.transactionHash].push(log);
      }

      // Analizar cada transacción
      const results = [];
      for (const txHash in grouped) {
        try {
          const analysis = await this.analyzeTransaction(txHash, grouped[txHash].length);
          if (analysis) {
            results.push(analysis);
          }
        } catch (error) {
          console.log(chalk.gray(`   Saltando TX ${txHash.slice(0, 10)}... (error: ${error.message})`));
        }
      }

      if (results.length === 0) {
        console.log(chalk.yellow('⚠ No se pudieron analizar las transacciones'));
        return null;
      }

      // Agrupar por método y calcular estadísticas
      const mintPattern = this.detectMintPattern(results);
      
      console.log(chalk.cyan('\n📊 Patrón de mint detectado:'));
      console.log(chalk.green(`   Función: ${mintPattern.functionName}`));
      console.log(chalk.green(`   Method ID: ${mintPattern.methodId}`));
      console.log(chalk.green(`   Precio promedio: ${mintPattern.avgPrice} MON`));
      console.log(chalk.green(`   Cantidad promedio: ${mintPattern.avgQty} NFTs`));
      console.log(chalk.green(`   Transacciones analizadas: ${results.length}\n`));

      return mintPattern;

    } catch (error) {
      console.log(chalk.red(`❌ Error analizando mints: ${error.message}`));
      return null;
    }
  }

  /**
   * Analiza una transacción individual
   */
  async analyzeTransaction(txHash, qty) {
    const tx = await this.provider.getTransaction(txHash);
    const receipt = await this.provider.getTransactionReceipt(txHash);

    if (!tx || !receipt) {
      throw new Error('Transacción no encontrada');
    }

    // Calcular precio por NFT
    const totalValue = tx.value;
    const pricePerNFT = qty > 0 ? totalValue / BigInt(qty) : totalValue;

    // Detectar método usado
    const methodId = tx.data.slice(0, 10);
    const functionInfo = this.detectFunction(methodId, tx.data);

    // Analizar parámetros adicionales
    const params = this.extractParameters(tx.data, functionInfo);

    return {
      txHash,
      blockNumber: tx.blockNumber,
      from: tx.from,
      qty,
      totalValue: ethers.formatEther(totalValue),
      pricePerNFT: ethers.formatEther(pricePerNFT),
      pricePerNFTWei: pricePerNFT,
      methodId,
      functionInfo,
      params,
      gasUsed: receipt.gasUsed.toString(),
      success: receipt.status === 1
    };
  }

  /**
   * Detecta la función usada según el Method ID
   */
  detectFunction(methodId, data) {
    const knownFunctions = {
      // Standard mints
      '0xa0712d68': {
        name: 'mint(uint256)',
        signature: 'mint(uint256)',
        type: 'standard',
        params: ['uint256']
      },
      '0x40c10f19': {
        name: 'mint(address,uint256)',
        signature: 'mint(address,uint256)',
        type: 'standard',
        params: ['address', 'uint256']
      },
      
      // Whitelist/Signature based
      '0xb971b4c4': {
        name: 'mint(uint32,uint32,bytes32[],uint256,bytes)',
        signature: 'mint(uint32,uint32,bytes32[],uint256,bytes)',
        type: 'whitelist_signature',
        params: ['uint32', 'uint32', 'bytes32[]', 'uint256', 'bytes']
      },
      '0x4a21a2df': {
        name: 'mint((bytes32,bytes32[]),uint256,address,bytes)',
        signature: 'mint((bytes32,bytes32[]),uint256,address,bytes)',
        type: 'merkle_whitelist',
        params: ['tuple', 'uint256', 'address', 'bytes']
      },

      // OpenSea Seaport
      '0x161ac21f': {
        name: 'mintPublic(address,address,address,uint256)',
        signature: 'mintPublic(address,address,address,uint256)',
        type: 'opensea_public',
        params: ['address', 'address', 'address', 'uint256']
      },
      '0x4b61cd6f': {
        name: 'mintSigned',
        signature: 'mintSigned(address,address,address,uint256,tuple,tuple,bytes)',
        type: 'opensea_signed',
        params: ['address', 'address', 'address', 'uint256', 'tuple', 'tuple', 'bytes']
      },

      // Magic Eden
      '0x1249c58b': {
        name: 'mint(uint256)',
        signature: 'mint(uint256)',
        type: 'magic_eden',
        params: ['uint256']
      },
      
      // Public mints
      '0x84bb1e42': {
        name: 'publicMint(uint256)',
        signature: 'publicMint(uint256)',
        type: 'public',
        params: ['uint256']
      },
      '0xb3ab15fb': {
        name: 'publicSaleMint(uint256)',
        signature: 'publicSaleMint(uint256)',
        type: 'public',
        params: ['uint256']
      }
    };

    const func = knownFunctions[methodId];
    
    if (!func) {
      // Intentar deducir del input data
      return this.deduceFunctionFromData(methodId, data);
    }

    return func;
  }

  /**
   * Intenta deducir la función si no está en la lista conocida
   */
  deduceFunctionFromData(methodId, data) {
    const dataLength = data.length;
    
    // Heurística simple basada en longitud
    if (dataLength <= 74) { // 10 (selector) + 64 (uint256)
      return {
        name: 'mint(uint256)',
        signature: 'mint(uint256)',
        type: 'standard',
        params: ['uint256'],
        methodId
      };
    } else if (dataLength <= 138) { // selector + address + uint256
      return {
        name: 'mint(address,uint256)',
        signature: 'mint(address,uint256)',
        type: 'standard',
        params: ['address', 'uint256'],
        methodId
      };
    }

    return {
      name: 'unknown',
      signature: 'unknown',
      type: 'unknown',
      params: [],
      methodId
    };
  }

  /**
   * Extrae parámetros de la transacción
   */
  extractParameters(data, functionInfo) {
    try {
      if (!functionInfo || functionInfo.type === 'unknown') {
        return {};
      }

      const iface = new ethers.Interface([`function ${functionInfo.signature}`]);
      const decoded = iface.decodeFunctionData(functionInfo.signature.split('(')[0], data);

      const params = {};
      functionInfo.params.forEach((param, index) => {
        params[param] = decoded[index];
      });

      return params;
    } catch (error) {
      return {};
    }
  }

  /**
   * Detecta el patrón más común de mint
   */
  detectMintPattern(results) {
    // Agrupar por método
    const methodGroups = {};
    
    for (const result of results) {
      const methodId = result.methodId;
      if (!methodGroups[methodId]) {
        methodGroups[methodId] = [];
      }
      methodGroups[methodId].push(result);
    }

    // Encontrar el método más usado
    let mostUsedMethod = null;
    let maxCount = 0;

    for (const methodId in methodGroups) {
      const count = methodGroups[methodId].length;
      if (count > maxCount) {
        maxCount = count;
        mostUsedMethod = methodId;
      }
    }

    const methodResults = methodGroups[mostUsedMethod];
    
    // Calcular promedios
    let totalPrice = BigInt(0);
    let totalQty = 0;

    for (const result of methodResults) {
      totalPrice += result.pricePerNFTWei;
      totalQty += result.qty;
    }

    const avgPrice = ethers.formatEther(totalPrice / BigInt(methodResults.length));
    const avgQty = Math.round(totalQty / methodResults.length);

    return {
      methodId: mostUsedMethod,
      functionName: methodResults[0].functionInfo.name,
      functionType: methodResults[0].functionInfo.type,
      signature: methodResults[0].functionInfo.signature,
      params: methodResults[0].functionInfo.params,
      avgPrice,
      avgPriceWei: totalPrice / BigInt(methodResults.length),
      avgQty,
      sampleCount: methodResults.length,
      isWhitelist: methodResults[0].functionInfo.type.includes('whitelist'),
      isPublic: methodResults[0].functionInfo.type === 'public' || 
                methodResults[0].functionInfo.type === 'standard',
      samples: methodResults.slice(0, 3) // Primeras 3 transacciones como muestra
    };
  }

  /**
   * Verifica si una wallet puede mintear (analiza restricciones)
   */
  async canWalletMint(contractAddress, walletAddress, mintPattern) {
    try {
      // Intentar obtener el límite por wallet si existe
      const contract = new ethers.Contract(
        contractAddress,
        [
          'function numberMinted(address) view returns (uint256)',
          'function maxPerWallet() view returns (uint256)',
          'function maxPerAddress() view returns (uint256)',
          'function mintedCount(address) view returns (uint256)'
        ],
        this.provider
      );

      let minted = BigInt(0);
      let maxPerWallet = BigInt(0);

      // Intentar diferentes funciones comunes
      try {
        minted = await contract.numberMinted(walletAddress);
      } catch (e) {
        try {
          minted = await contract.mintedCount(walletAddress);
        } catch (e2) {
          // No se pudo obtener
        }
      }

      try {
        maxPerWallet = await contract.maxPerWallet();
      } catch (e) {
        try {
          maxPerWallet = await contract.maxPerAddress();
        } catch (e2) {
          // No se pudo obtener
        }
      }

      if (maxPerWallet > 0 && minted >= maxPerWallet) {
        return {
          canMint: false,
          reason: `Límite alcanzado (${minted}/${maxPerWallet})`
        };
      }

      return {
        canMint: true,
        minted: minted.toString(),
        maxPerWallet: maxPerWallet > 0 ? maxPerWallet.toString() : 'ilimitado'
      };

    } catch (error) {
      // Si no podemos verificar, asumimos que puede mintear
      return {
        canMint: true,
        reason: 'No se pudo verificar restricciones'
      };
    }
  }

  /**
   * Obtiene el precio actual de mint del contrato
   */
  async getCurrentMintPrice(contractAddress) {
    const contract = new ethers.Contract(
      contractAddress,
      [
        'function mintPrice() view returns (uint256)',
        'function price() view returns (uint256)',
        'function cost() view returns (uint256)',
        'function publicPrice() view returns (uint256)'
      ],
      this.provider
    );

    const priceFunctions = ['mintPrice', 'price', 'cost', 'publicPrice'];

    for (const funcName of priceFunctions) {
      try {
        const price = await contract[funcName]();
        return price;
      } catch (e) {
        continue;
      }
    }

    return null;
  }
}

module.exports = MintAnalyzer;
