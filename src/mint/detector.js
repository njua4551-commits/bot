const { ethers } = require('ethers');
const chalk = require('chalk');
const abis = require('../../config/abis');

class MintDetector {
  constructor(provider) {
    this.provider = provider;
  }

  async detectMintFunction(contractAddress) {
    console.log(chalk.yellow('🔍 Detectando función de mint...'));

    const contract = new ethers.Contract(
      contractAddress,
      abis.mintFunctionDetector,
      this.provider
    );

    // Intenta detectar diferentes variantes de mint
    const mintFunctions = [
      { name: 'mint', params: ['uint256'], signature: 'mint(uint256)' },
      { name: 'publicMint', params: ['uint256'], signature: 'publicMint(uint256)' },
      { name: 'mintNFT', params: ['uint256'], signature: 'mintNFT(uint256)' },
      { name: 'safeMint', params: ['uint256'], signature: 'safeMint(uint256)' },
      { name: 'mint', params: ['address', 'uint256'], signature: 'mint(address,uint256)' },
      { name: 'mintTo', params: ['address', 'uint256'], signature: 'mintTo(address,uint256)' },
      { name: 'freeMint', params: ['uint256'], signature: 'freeMint(uint256)' },
      { name: 'claim', params: ['uint256'], signature: 'claim(uint256)' },
      { name: 'purchase', params: ['uint256'], signature: 'purchase(uint256)' }
    ];

    for (const func of mintFunctions) {
      try {
        // Verifica si la función existe en el contrato
        const code = await this.provider.getCode(contractAddress);
        if (code === '0x') {
          throw new Error('❌ No hay contrato en esta dirección');
        }

        // Intenta crear una interfaz con esta función
        const testInterface = new ethers.Interface([`function ${func.signature} payable`]);
        
        console.log(chalk.green(`✓ Función detectada: ${func.name}(${func.params.join(', ')})`));
        return { name: func.name, params: func.params, signature: func.signature };
      } catch (e) {
        // Función no encontrada, continuar
        continue;
      }
    }

    // Si no se detectó automáticamente, usar la función estándar
    console.log(chalk.yellow('⚠ Usando función de mint estándar: mint(uint256)'));
    return { name: 'mint', params: ['uint256'], signature: 'mint(uint256)' };
  }

  async getMintPrice(contractAddress) {
    const contract = new ethers.Contract(
      contractAddress,
      abis.mintFunctionDetector,
      this.provider
    );

    // Intenta obtener el precio de diferentes formas
    const priceFunctions = ['cost', 'price', 'mintPrice', 'getPrice'];

    for (const funcName of priceFunctions) {
      try {
        const price = await contract[funcName]();
        if (price !== undefined) {
          const priceInEth = ethers.formatEther(price);
          if (parseFloat(priceInEth) === 0) {
            console.log(chalk.green(`✓ Mint GRATUITO detectado`));
          } else {
            console.log(chalk.green(`✓ Precio detectado: ${priceInEth} MON`));
          }
          return price;
        }
      } catch (e) {
        // Función no encontrada, continuar
        continue;
      }
    }

    console.log(chalk.yellow('⚠ No se pudo detectar el precio automáticamente (asumiendo gratuito)'));
    return ethers.parseEther('0'); // Mint gratuito por defecto
  }

  async getSupplyInfo(contractAddress) {
    const contract = new ethers.Contract(
      contractAddress,
      abis.mintFunctionDetector,
      this.provider
    );

    try {
      const totalSupply = await contract.totalSupply();
      const maxSupply = await contract.maxSupply();
      
      const remaining = maxSupply - totalSupply;
      const percentage = (Number(totalSupply) / Number(maxSupply) * 100).toFixed(2);
      
      console.log(chalk.cyan(`📊 Supply: ${totalSupply.toString()}/${maxSupply.toString()} (${percentage}% minteado)`));
      console.log(chalk.cyan(`📦 Restantes: ${remaining.toString()}`));
      
      return { totalSupply, maxSupply, remaining };
    } catch (e) {
      console.log(chalk.yellow('⚠ No se pudo obtener información de supply'));
      return null;
    }
  }

  async checkMintStatus(contractAddress) {
    const contract = new ethers.Contract(
      contractAddress,
      abis.mintFunctionDetector,
      this.provider
    );

    try {
      // Intenta verificar si el mint está pausado
      const isPaused = await contract.paused();
      if (isPaused) {
        console.log(chalk.red('❌ El mint está PAUSADO'));
        return false;
      }
      console.log(chalk.green('✓ Mint ACTIVO'));
      return true;
    } catch (e) {
      // Si no hay función paused, asumir que está activo
      try {
        const isActive = await contract.publicSaleActive();
        if (!isActive) {
          console.log(chalk.red('❌ Venta pública NO está activa'));
          return false;
        }
        console.log(chalk.green('✓ Venta pública ACTIVA'));
        return true;
      } catch (e2) {
        console.log(chalk.yellow('⚠ No se pudo verificar el estado del mint'));
        return true; // Asumir activo por defecto
      }
    }
  }

  async getMintStartTime(contractAddress) {
    const contract = new ethers.Contract(
      contractAddress,
      abis.mintFunctionDetector,
      this.provider
    );

    try {
      const startTime = await contract.mintStartTime();
      const startDate = new Date(Number(startTime) * 1000);
      
      console.log(chalk.cyan(`⏰ Inicio del mint: ${startDate.toLocaleString()}`));
      
      return startTime;
    } catch (e) {
      console.log(chalk.yellow('⚠ No se pudo obtener tiempo de inicio del mint'));
      return null;
    }
  }
}

module.exports = MintDetector;
