const { ethers } = require('ethers');
const chalk = require('chalk');

/**
 * Constructor de payloads adaptativo
 * Construye la transacción correcta según el tipo de mint detectado
 */
class PayloadBuilder {
  constructor(provider) {
    this.provider = provider;
  }

  /**
   * Construye el payload correcto según el patrón detectado
   */
  buildPayload(contract, mintPattern, qty, wallet, extras = {}) {
    console.log(chalk.yellow(`\n🔧 Construyendo payload para ${mintPattern.functionType}...`));

    switch (mintPattern.functionType) {
      case 'standard':
        return this.buildStandardMint(contract, mintPattern, qty, wallet, extras);
      
      case 'whitelist_signature':
        return this.buildWhitelistSignatureMint(contract, mintPattern, qty, wallet, extras);
      
      case 'merkle_whitelist':
        return this.buildMerkleWhitelistMint(contract, mintPattern, qty, wallet, extras);
      
      case 'opensea_public':
        return this.buildOpenSeaPublicMint(contract, mintPattern, qty, wallet, extras);
      
      case 'opensea_signed':
        return this.buildOpenSeaSignedMint(contract, mintPattern, qty, wallet, extras);
      
      case 'magic_eden':
        return this.buildMagicEdenMint(contract, mintPattern, qty, wallet, extras);
      
      case 'public':
        return this.buildPublicMint(contract, mintPattern, qty, wallet, extras);
      
      default:
        console.log(chalk.yellow('⚠ Tipo de mint desconocido, intentando mint estándar'));
        return this.buildStandardMint(contract, mintPattern, qty, wallet, extras);
    }
  }

  /**
   * Mint estándar: mint(uint256) o mint(address, uint256)
   */
  buildStandardMint(contract, mintPattern, qty, wallet, extras) {
    const value = mintPattern.avgPriceWei * BigInt(qty);
    
    const txConfig = {
      value,
      gasLimit: extras.gasLimit || 300000,
      maxPriorityFeePerGas: extras.maxPriorityFee || ethers.parseUnits('2', 'gwei')
    };

    if (extras.maxFeePerGas) {
      txConfig.maxFeePerGas = extras.maxFeePerGas;
    }

    console.log(chalk.green(`✓ Mint estándar: ${mintPattern.signature}`));
    console.log(chalk.gray(`   Cantidad: ${qty}`));
    console.log(chalk.gray(`   Valor: ${ethers.formatEther(value)} MON\n`));

    // Determinar si es mint(uint256) o mint(address, uint256)
    if (mintPattern.params.includes('address')) {
      return {
        method: 'mint',
        args: [wallet.address, qty],
        config: txConfig,
        signature: mintPattern.signature
      };
    } else {
      return {
        method: 'mint',
        args: [qty],
        config: txConfig,
        signature: mintPattern.signature
      };
    }
  }

  /**
   * Whitelist con firma: mint(uint32 qty, uint32 limit, bytes32[] proof, uint256 timestamp, bytes signature)
   */
  buildWhitelistSignatureMint(contract, mintPattern, qty, wallet, extras) {
    const value = mintPattern.avgPriceWei * BigInt(qty);
    
    // Extraer parámetros de una transacción exitosa anterior
    const sampleParams = mintPattern.samples[0]?.params || {};
    
    const limit = extras.limit || sampleParams.uint32 || 0;
    const proof = extras.proof || sampleParams['bytes32[]'] || [];
    const timestamp = extras.timestamp || sampleParams.uint256 || 0;
    const signature = extras.signature || sampleParams.bytes || '0x';

    const txConfig = {
      value,
      gasLimit: extras.gasLimit || 350000,
      maxPriorityFeePerGas: extras.maxPriorityFee || ethers.parseUnits('2', 'gwei')
    };

    if (extras.maxFeePerGas) {
      txConfig.maxFeePerGas = extras.maxFeePerGas;
    }

    const isPublic = proof.length === 0 && limit === 0;
    
    console.log(chalk.green(`✓ Mint con firma (${isPublic ? 'público' : 'whitelist'})`));
    console.log(chalk.gray(`   Cantidad: ${qty}`));
    console.log(chalk.gray(`   Límite: ${limit}`));
    console.log(chalk.gray(`   Pruebas Merkle: ${proof.length}`));
    console.log(chalk.gray(`   Valor: ${ethers.formatEther(value)} MON\n`));

    return {
      method: 'mint',
      args: [qty, limit, proof, timestamp, signature],
      config: txConfig,
      signature: mintPattern.signature,
      needsWhitelist: !isPublic
    };
  }

  /**
   * Merkle whitelist: mint((bytes32 key, bytes32[] proof), uint256 qty, address to, bytes signature)
   */
  buildMerkleWhitelistMint(contract, mintPattern, qty, wallet, extras) {
    const value = mintPattern.avgPriceWei * BigInt(qty);
    
    const sampleParams = mintPattern.samples[0]?.params || {};
    
    const merkleData = extras.merkleData || {
      key: sampleParams.tuple?.[0] || ethers.ZeroHash,
      proof: sampleParams.tuple?.[1] || []
    };
    
    const to = extras.to || wallet.address;
    const signature = extras.signature || sampleParams.bytes || '0x';

    const txConfig = {
      value,
      gasLimit: extras.gasLimit || 350000,
      maxPriorityFeePerGas: extras.maxPriorityFee || ethers.parseUnits('2', 'gwei')
    };

    if (extras.maxFeePerGas) {
      txConfig.maxFeePerGas = extras.maxFeePerGas;
    }

    console.log(chalk.green(`✓ Mint Merkle whitelist`));
    console.log(chalk.gray(`   Cantidad: ${qty}`));
    console.log(chalk.gray(`   Destinatario: ${to}`));
    console.log(chalk.gray(`   Pruebas: ${merkleData.proof.length}`));
    console.log(chalk.gray(`   Valor: ${ethers.formatEther(value)} MON\n`));

    return {
      method: 'mint',
      args: [merkleData, qty, to, signature],
      config: txConfig,
      signature: mintPattern.signature,
      needsWhitelist: true
    };
  }

  /**
   * OpenSea público: mintPublic(address minter, address feeRecipient, address nftContract, uint256 qty)
   */
  buildOpenSeaPublicMint(contract, mintPattern, qty, wallet, extras) {
    const value = mintPattern.avgPriceWei * BigInt(qty);
    
    const sampleParams = mintPattern.samples[0]?.params || {};
    
    const minter = wallet.address;
    const feeRecipient = extras.feeRecipient || sampleParams.address || ethers.ZeroAddress;
    const nftContract = contract.target;

    const txConfig = {
      value,
      gasLimit: extras.gasLimit || 300000,
      maxPriorityFeePerGas: extras.maxPriorityFee || ethers.parseUnits('2', 'gwei')
    };

    if (extras.maxFeePerGas) {
      txConfig.maxFeePerGas = extras.maxFeePerGas;
    }

    console.log(chalk.green(`✓ Mint público OpenSea`));
    console.log(chalk.gray(`   Minter: ${minter}`));
    console.log(chalk.gray(`   Cantidad: ${qty}`));
    console.log(chalk.gray(`   Valor: ${ethers.formatEther(value)} MON\n`));

    return {
      method: 'mintPublic',
      args: [minter, feeRecipient, nftContract, qty],
      config: txConfig,
      signature: mintPattern.signature
    };
  }

  /**
   * OpenSea firmado: mintSigned(address, address, address, uint256, DropStage, ValidationParams, bytes)
   */
  buildOpenSeaSignedMint(contract, mintPattern, qty, wallet, extras) {
    const value = mintPattern.avgPriceWei * BigInt(qty);
    
    const sampleParams = mintPattern.samples[0]?.params || {};
    
    if (!extras.dropStage || !extras.signature) {
      throw new Error('OpenSea mintSigned requiere dropStage y signature válidos');
    }

    const minter = wallet.address;
    const feeRecipient = extras.feeRecipient || ethers.ZeroAddress;
    const nftContract = contract.target;

    const txConfig = {
      value,
      gasLimit: extras.gasLimit || 400000,
      maxPriorityFeePerGas: extras.maxPriorityFee || ethers.parseUnits('2', 'gwei')
    };

    if (extras.maxFeePerGas) {
      txConfig.maxFeePerGas = extras.maxFeePerGas;
    }

    console.log(chalk.green(`✓ Mint firmado OpenSea (FCFS)`));
    console.log(chalk.gray(`   Minter: ${minter}`));
    console.log(chalk.gray(`   Cantidad: ${qty}`));
    console.log(chalk.gray(`   Valor: ${ethers.formatEther(value)} MON\n`));

    return {
      method: 'mintSigned',
      args: [
        minter,
        feeRecipient,
        nftContract,
        qty,
        extras.dropStage,
        extras.validationParams,
        extras.signature
      ],
      config: txConfig,
      signature: mintPattern.signature,
      needsSignature: true
    };
  }

  /**
   * Magic Eden: mint(uint256)
   */
  buildMagicEdenMint(contract, mintPattern, qty, wallet, extras) {
    const value = mintPattern.avgPriceWei * BigInt(qty);
    
    const txConfig = {
      value,
      gasLimit: extras.gasLimit || 280000,
      maxPriorityFeePerGas: extras.maxPriorityFee || ethers.parseUnits('2', 'gwei')
    };

    if (extras.maxFeePerGas) {
      txConfig.maxFeePerGas = extras.maxFeePerGas;
    }

    console.log(chalk.green(`✓ Mint Magic Eden`));
    console.log(chalk.gray(`   Cantidad: ${qty}`));
    console.log(chalk.gray(`   Valor: ${ethers.formatEther(value)} MON\n`));

    return {
      method: 'mint',
      args: [qty],
      config: txConfig,
      signature: mintPattern.signature
    };
  }

  /**
   * Mint público genérico: publicMint(uint256) o publicSaleMint(uint256)
   */
  buildPublicMint(contract, mintPattern, qty, wallet, extras) {
    const value = mintPattern.avgPriceWei * BigInt(qty);
    
    const txConfig = {
      value,
      gasLimit: extras.gasLimit || 300000,
      maxPriorityFeePerGas: extras.maxPriorityFee || ethers.parseUnits('2', 'gwei')
    };

    if (extras.maxFeePerGas) {
      txConfig.maxFeePerGas = extras.maxFeePerGas;
    }

    const methodName = mintPattern.signature.split('(')[0];

    console.log(chalk.green(`✓ Mint público: ${methodName}`));
    console.log(chalk.gray(`   Cantidad: ${qty}`));
    console.log(chalk.gray(`   Valor: ${ethers.formatEther(value)} MON\n`));

    return {
      method: methodName,
      args: [qty],
      config: txConfig,
      signature: mintPattern.signature
    };
  }

  /**
   * Construye un contrato con la función correcta
   */
  buildContract(contractAddress, mintPattern, wallet) {
    const iface = new ethers.Interface([`function ${mintPattern.signature} payable`]);
    
    return new ethers.Contract(contractAddress, iface, wallet);
  }

  /**
   * Valida que tenemos todos los parámetros necesarios
   */
  validatePayload(payload, mintPattern) {
    const warnings = [];

    if (payload.needsWhitelist && (!payload.args[2] || payload.args[2].length === 0)) {
      warnings.push('⚠️ Este mint requiere whitelist (Merkle proof). Es posible que falle sin proof válido.');
    }

    if (payload.needsSignature && (!payload.args[6] || payload.args[6] === '0x')) {
      warnings.push('⚠️ Este mint requiere firma válida. Es posible que falle sin signature.');
    }

    if (warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️ ADVERTENCIAS:'));
      warnings.forEach(w => console.log(chalk.yellow(w)));
      console.log('');
    }

    return warnings.length === 0;
  }
}

module.exports = PayloadBuilder;
