# 🚀 MONAD NFT SNIPER BOT v2.0 - MODO ADAPTATIVO

Bot profesional de minteo multi-wallet para Monad Mainnet con **detección automática adaptativa** de patrones de mint.

## ✨ Características Principales

### 🧠 **NUEVO: Modo Adaptativo Inteligente**
- ✅ **Análisis automático de transacciones** - Escanea mints recientes y detecta patrones
- ✅ **Detección de función de mint** - Identifica automáticamente qué función usar
- ✅ **Cálculo automático de precio** - Obtiene el precio real del mint
- ✅ **Soporte para múltiples tipos de mint**:
  - Standard mints (`mint(uint256)`)
  - Whitelist con firma (`mint(qty, limit, proof, timestamp, signature)`)
  - Merkle whitelist (`mint((key, proof), qty, to, signature)`)
  - OpenSea Public (`mintPublic(...)`)
  - OpenSea Signed FCFS (`mintSigned(...)`)
  - Magic Eden
  - Y más...

### 💪 Características Existentes
- ✅ Multi-wallet support (ilimitadas wallets simultáneas)
- ✅ Monad Mainnet compatible
- ✅ Magic Eden & OpenSea compatible
- ✅ FCFS optimizado para máxima velocidad
- ✅ Public & Scheduled mint
- ✅ Auto gas optimization
- ✅ Retry logic con backoff
- ✅ Interfaz interactiva profesional

---

## 🆕 Cómo Funciona el Modo Adaptativo

### 1️⃣ **Escaneo Inteligente**
El bot escanea los últimos 50 bloques buscando eventos `Transfer(from=0x0)` que indican mints reales.

### 2️⃣ **Análisis de Patrones**
Agrupa las transacciones por `txHash` y calcula:
- **Cantidad** de NFTs minteados
- **Precio** por NFT (msg.value / qty)
- **Función** usada (via Method ID)
- **Parámetros** necesarios

### 3️⃣ **Construcción Adaptativa**
Construye automáticamente el payload correcto según el tipo de mint detectado:
```
Method ID → Tipo de Mint → Payload Correcto
0xb971b4c4 → Whitelist Signature → mint(qty, limit, proof[], timestamp, sig)
0x4a21a2df → Merkle Whitelist → mint((key, proof[]), qty, to, sig)
0x161ac21f → OpenSea Public → mintPublic(minter, fee, nft, qty)
0x4b61cd6f → OpenSea Signed → mintSigned(...)
0xa0712d68 → Standard → mint(qty)
```

### 4️⃣ **Verificación de Mint**
Confirma que el mint fue exitoso verificando eventos `Transfer` en el receipt.

---

## 📦 Instalación

```bash
# Descomprimir
unzip monad-nft-sniper-v2.zip
cd monad-nft-sniper

# Instalar dependencias
npm install

# Configurar
cp .env.example .env
nano .env  # Añade tus private keys
```

---

## 🚀 Uso

### **Inicio Rápido**
```bash
npm start
```

### **Flujo de Uso**

1. **Selecciona modo de análisis**:
   - 🧠 **Adaptativo** (Recomendado): Analiza transacciones y detecta automáticamente
   - 🔧 **Manual**: Usa detección estándar

2. **Selecciona modo de mint**:
   - ⚡ Instantáneo (FCFS)
   - ⏰ Programado (Timestamp)
   - 🔗 Por Bloque

3. **Ingresa datos**:
   - Dirección del contrato (o URL de Magic Eden)
   - Cantidad de NFTs por wallet

4. **¡El bot hace el resto!**

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Magic Eden con Análisis Adaptativo
```bash
npm start

? ¿Cómo quieres analizar? 🧠 Modo Adaptativo
? ¿Qué modo de mint? ⚡ Mint Instantáneo
? Dirección: https://magiceden.io/launchpad/monad/sealuminati
? ¿Cuántos? 2

🔍 Analizando últimas transacciones...
✓ Encontrados 15 eventos de mint

📊 Patrón detectado:
   Función: mint(uint256)
   Method ID: 0x1249c58b
   Precio promedio: 0.001 MON
   Cantidad promedio: 1 NFTs

🔥 Iniciando mint adaptativo desde 5 wallets...
```

### Ejemplo 2: Whitelist con Override Manual
```bash
npm start

? ¿Cómo quieres analizar? 🧠 Modo Adaptativo
? ¿Qué modo de mint? ⚡ Mint Instantáneo
? Dirección: 0x1234...5678
? ¿Cuántos? 1

📊 Patrón detectado:
   Función: mint(uint32,uint32,bytes32[],uint256,bytes)
   Tipo: whitelist_signature
   
⚠️ ADVERTENCIAS:
⚠️ Este mint requiere whitelist (Merkle proof)

# El bot intentará con proof vacío (mint público)
# O puedes proporcionar proof válido via código
```

### Ejemplo 3: OpenSea Signed Drop (FCFS)
```bash
npm start

? ¿Cómo quieres analizar? 🧠 Modo Adaptativo

📊 Patrón detectado:
   Función: mintSigned
   Tipo: opensea_signed
   
⚠️ Este mint requiere firma válida

# Para OpenSea Signed necesitas:
# - dropStage
# - validationParams  
# - signature
# (Se pueden obtener interceptando la request del sitio)
```

---

## 🔧 Configuración Avanzada

### **Override Manual de Parámetros**

Si el modo adaptativo detecta mal, puedes hacer override manual en el código:

```javascript
// En tu script personalizado
const AdaptiveMintExecutor = require('./src/mint/adaptive-executor');

const executor = new AdaptiveMintExecutor(provider, contractAddress, {
  overrides: {
    price: '0.01',              // Precio manual
    function: 'mint(uint256)',  // Función manual
    proof: ['0x123...', '0x456...'], // Merkle proof
    limit: 2,                   // Límite whitelist
    signature: '0xabc...'       // Firma válida
  }
});

await executor.analyze();
await executor.executeBatchMint(wallets, 1);
```

### **Configuración en .env**

```env
# Análisis adaptativo
ADAPTIVE_BLOCKS_TO_SCAN=50    # Bloques a escanear (default: 50)
ADAPTIVE_MIN_SAMPLES=3        # Muestras mínimas para confiar (default: 3)

# Gas para diferentes tipos
GAS_LIMIT_STANDARD=250000     # Mint estándar
GAS_LIMIT_WHITELIST=350000    # Mint con whitelist
GAS_LIMIT_OPENSEA=400000      # Mint OpenSea Seaport
```

---

## 📊 Comparación v1 vs v2

| Característica | v1.0 | v2.0 Adaptativo |
|----------------|------|-----------------|
| Detección de función | Manual | ✅ Automática |
| Cálculo de precio | Manual | ✅ Automático |
| Soporte Whitelist | ❌ | ✅ |
| Soporte OpenSea | ❌ | ✅ |
| Soporte Magic Eden | Básico | ✅ Completo |
| Verificación de mint | ❌ | ✅ Por eventos |
| Análisis de patrones | ❌ | ✅ |
| Límites por wallet | ❌ | ✅ Detecta automático |

---

## 🛠️ Tipos de Mint Soportados

### ✅ **Standard Mints**
```solidity
mint(uint256 qty)
mint(address to, uint256 qty)
publicMint(uint256 qty)
```

### ✅ **Whitelist con Firma**
```solidity
mint(uint32 qty, uint32 limit, bytes32[] proof, uint256 timestamp, bytes signature)
```
- Si `proof[]` vacío y `limit = 0` → Público
- Si `proof[]` con datos → Whitelist Merkle

### ✅ **Merkle Whitelist**
```solidity
mint((bytes32 key, bytes32[] proof), uint256 qty, address to, bytes signature)
```

### ✅ **OpenSea Seaport Public**
```solidity
mintPublic(address minter, address feeRecipient, address nftContract, uint256 qty)
```

### ✅ **OpenSea Seaport Signed (FCFS)**
```solidity
mintSigned(
  address minter,
  address feeRecipient, 
  address nftContract,
  uint256 qty,
  DropStage dropStage,
  ValidationParams validationParams,
  bytes signature
)
```
**Nota**: Requiere `dropStage` y `signature` válidos obtenidos del sitio.

### ✅ **Magic Eden**
```solidity
mint(uint256 qty)
```
Con detección específica de contratos Magic Eden.

---

## 🔍 Debugging y Logs

El bot guarda logs detallados en `logs/`:

```bash
logs/
└── mint-1735555200123.log

# Ver logs en tiempo real
tail -f logs/mint-*.log
```

Los logs incluyen:
- Análisis de transacciones
- Patrones detectados
- Intentos de mint
- Errores detallados
- Gas usado
- Verificación de eventos

---

## 💡 Consejos Pro

### Para FCFS Ultra-Competitivos:

1. **Usa Modo Adaptativo** - Más preciso que manual
2. **RPC Premium** - Alchemy/Infura dan ventaja
3. **Múltiples Wallets** - 10-20 wallets aumentan probabilidades
4. **Gas Agresivo** - `MAX_PRIORITY_FEE=5` o más
5. **Pre-análisis** - Ejecuta analyze() antes del drop
6. **Escalonado Mínimo** - Reduce delay entre wallets a 50ms

```env
# Configuración ultra-agresiva
MAX_PRIORITY_FEE=10
GAS_LIMIT_MAX=500000
RETRY_ATTEMPTS=5
RETRY_DELAY=100
```

### Para Whitelist:

1. **Obtén tu Merkle Proof** antes del mint
2. **Verifica tu elegibilidad** en el sitio del proyecto
3. **Usa overrides** para pasar el proof:
```javascript
executor.setOverrides({
  proof: ['0x123...', '0x456...'],
  limit: 2
});
```

### Para OpenSea Signed:

1. **Intercepta la request** del sitio oficial
2. **Extrae** `dropStage`, `validationParams`, `signature`
3. **Pásalos como extras**:
```javascript
await executor.executeMint(wallet, 1, {
  dropStage: {...},
  validationParams: {...},
  signature: '0x...'
});
```

---

## ⚠️ Limitaciones y Advertencias

### ❌ **El bot NO puede:**
- Obtener automáticamente Merkle proofs de whitelist
- Generar firmas válidas para OpenSea Signed
- Bypasear requisitos de whitelist
- Garantizar mint exitoso en drops ultra-competitivos

### ⚠️ **Requiere intervención manual:**
- **Whitelist Merkle**: Necesitas tu proof válido
- **OpenSea Signed**: Necesitas signature del sitio oficial
- **Captchas**: No soportado
- **Requisitos KYC**: No soportado

### ✅ **El bot SÍ puede:**
- Detectar automáticamente el tipo de mint
- Adaptarse a diferentes launchpads
- Ejecutar mints públicos ultra-rápido
- Gestionar múltiples wallets simultáneamente
- Verificar límites y restricciones
- Reintentar automáticamente en fallos

---

## 🐛 Troubleshooting

### "No se pudo detectar patrón automáticamente"
**Causa**: No hay suficientes mints recientes para analizar  
**Solución**: Usa modo manual o espera a que haya más actividad

### "Este mint requiere whitelist"
**Causa**: El mint usa Merkle proof para whitelist  
**Solución**: Obtén tu proof del proyecto y pásalo via overrides

### "Este mint requiere firma válida"
**Causa**: OpenSea Seaport Signed  
**Solución**: Intercepta la firma del sitio oficial o usa el mint público

### "Función de mint desconocida"
**Causa**: El contrato usa una función personalizada  
**Solución**: Usa override manual: `--function "mintCustom(uint256)"`

### Transacciones revirtiend
**Causa**: Múltiples posibles  
**Solución**: 
1. Verifica que el mint está abierto
2. Aumenta gas limit
3. Verifica restricciones (max per wallet, whitelist, etc.)
4. Revisa los logs para error específico

---

## 📞 Soporte

1. Lee la documentación completa
2. Revisa ejemplos en `QUICK_START.md`
3. Consulta logs en `logs/`
4. Verifica troubleshooting arriba

---

## 📄 Licencia

MIT License - Uso libre bajo tu propio riesgo.

---

## 🎉 ¡Buen Minteo!

```bash
npm start
```

**El bot más inteligente para Monad NFTs** 🚀🧠

---

## Changelog v2.0

### ✨ Nuevas Características
- 🧠 Modo adaptativo con análisis de transacciones
- 🔍 Detección automática de 10+ tipos de mint
- 📊 Verificación de mint exitoso por eventos
- 🎯 Soporte completo para OpenSea Seaport
- 🔐 Soporte para whitelist Merkle
- 💰 Cálculo automático de precio desde blockchain
- 🚦 Detección de límites por wallet
- 📝 Sistema de logs mejorado

### 🔧 Mejoras
- Constructor de payloads inteligente
- Mejor manejo de errores
- Parsing de errores detallado
- Validación de parámetros pre-mint
- Interfaz más informativa

### 🐛 Fixes
- Mejor compatibilidad con diferentes ABIs
- Gas optimization mejorado
- Timeout handling mejorado
