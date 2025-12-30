# 🚀 INICIO RÁPIDO - Bot v2.0 con Modo Adaptativo

## ⚡ Instalación en 3 Pasos (2 minutos)

### 1️⃣ Descomprimir e Instalar
```bash
unzip monad-nft-sniper-v2.zip
cd monad-nft-sniper
npm install
```

### 2️⃣ Configurar Wallets
```bash
cp .env.example .env
nano .env  # O usa: code .env, vim .env
```

**Edita tu `.env`:**
```env
# Añade tus private keys
PRIVATE_KEY_1=0xtu_private_key_aqui
PRIVATE_KEY_2=0xotra_private_key_aqui
# ... añade más si quieres
```

### 3️⃣ Ejecutar
```bash
npm start
```

---

## 🆕 NUEVO: Modo Adaptativo

El bot ahora **analiza automáticamente** transacciones recientes para:
- ✅ Detectar qué función de mint usar
- ✅ Calcular el precio correcto
- ✅ Identificar tipo de mint (público/whitelist/OpenSea/etc.)
- ✅ Construir el payload perfecto

**Recomendado para el 90% de los casos** 🎯

---

## 🎮 Flujo de Uso

```
npm start

? ¿Cómo analizar? 🧠 Modo Adaptativo (recomendado)
                  🔧 Modo Manual

? ¿Modo de mint?  ⚡ Instantáneo (FCFS)
                  ⏰ Programado (timestamp)
                  🔗 Por Bloque

? Dirección:      0x1234... o https://magiceden.io/...

? ¿Cuántos?       1 (o más por wallet)

✅ ¡El bot hace todo lo demás!
```

---

## 📋 Checklist Pre-Mint

- [ ] ✅ Todas las wallets tienen suficiente MON
- [ ] ✅ RPC funciona (prueba con `npm start`)
- [ ] ✅ Dirección del contrato correcta
- [ ] ✅ Conoces el timestamp si es programado
- [ ] ✅ Has verificado que el mint está/estará abierto

---

## 🔥 Ejemplos Rápidos

### Ejemplo 1: Magic Eden FCFS
```
npm start
? Análisis: 🧠 Adaptativo
? Modo: ⚡ Instantáneo
? Dirección: https://magiceden.io/launchpad/monad/sealuminati
? Cantidad: 1

🔍 Analizando transacciones...
📊 Función detectada: mint(uint256)
💰 Precio: 0.001 MON
🚀 Minteando desde 5 wallets...
✅ 5 mints exitosos!
```

### Ejemplo 2: Mint Programado
```
npm start
? Análisis: 🧠 Adaptativo
? Modo: ⏰ Programado
? Dirección: 0x1234567890abcdef...
? Cantidad: 2
? Timestamp: 1735555200

📊 Patrón detectado
⏰ Esperando hasta: 30/12/2024 15:00:00
⏱  00:15:30 restantes...
🚀 ¡MINT INICIADO!
✅ 10 NFTs minteados
```

### Ejemplo 3: OpenSea Drop
```
npm start
? Análisis: 🧠 Adaptativo
? Dirección: 0xOPENSEA_CONTRACT

📊 Patrón detectado:
   Tipo: opensea_public
   Función: mintPublic(...)
   
🚀 Minteando...
✅ Compatible con OpenSea Seaport
```

---

## 🧠 Modo Adaptativo vs Manual

### 🧠 **Adaptativo** (Recomendado)
**Cuándo usar:**
- ✅ Hay mints recientes del contrato
- ✅ El mint ya está abierto o en testeo
- ✅ No sabes qué función usar
- ✅ Quieres máxima precisión

**Qué hace:**
- Escanea últimos 50 bloques
- Detecta función automáticamente
- Calcula precio real
- Verifica restricciones

### 🔧 **Manual** (Clásico)
**Cuándo usar:**
- ❌ No hay mints recientes
- ❌ Es el primer mint del contrato
- ❌ El adaptativo falla

**Qué hace:**
- Detección estándar de ABIs
- Intenta funciones comunes
- Requiere que el contrato tenga funciones públicas

---

## 💡 Tips Profesionales

### 🏆 Para FCFS Ultra-Competitivos

1. **RPC Premium**
```env
MONAD_RPC=https://monad-mainnet.g.alchemy.com/v2/TU_KEY
```

2. **Gas Agresivo**
```env
MAX_PRIORITY_FEE=5    # O más alto
GAS_LIMIT_MAX=400000
```

3. **Más Wallets**
```env
PRIVATE_KEY_1=0x...
PRIVATE_KEY_2=0x...
PRIVATE_KEY_3=0x...
# Hasta 10-20 wallets
```

4. **Pre-análisis**
```bash
# Analiza ANTES del drop
node examples.js  # Usa example8_AnalysisOnly
```

### 🎯 Para Whitelist

1. **Obtén tu Merkle Proof** del proyecto
2. **Modifica el código** para pasar el proof:
```javascript
// Ver examples.js → example3_WhitelistMerkle
```

### 🔐 Para OpenSea Signed

1. **Intercepta** la request del sitio oficial (DevTools → Network)
2. **Copia** `dropStage`, `validationParams`, `signature`
3. **Usa** el ejemplo 4:
```bash
# Ver examples.js → example4_OpenSeaSigned
```

---

## ⚠️ Problemas Comunes

### "No se pudo detectar patrón"
**Solución**: Usa modo manual o espera a que haya más mints

### "Insufficient funds"
**Solución**: Añade más MON. Necesitas: (precio × qty × wallets) + gas

### "Transacción revertida"
**Posibles causas**:
- Mint cerrado/pausado
- Supply agotado
- Límite por wallet alcanzado
- Whitelist requerida

**Solución**: Verifica logs en `logs/` para error específico

### "Este mint requiere whitelist"
**Solución**: 
1. Verifica si estás en whitelist
2. Obtén tu Merkle proof
3. Usa override manual (ver examples.js)

---

## 📊 Análisis sin Mintear

Para **solo analizar** sin ejecutar mint:

```bash
node -e "require('./examples').example8_AnalysisOnly()"
```

Mostrará:
- Función detectada
- Tipo de mint
- Precio promedio
- Si es público o whitelist
- Ejemplos de transacciones

---

## 🔍 Ver Ejemplos Avanzados

El archivo `examples.js` tiene 10 ejemplos:

1. Mint adaptativo básico
2. Override de precio
3. Whitelist con Merkle
4. OpenSea Signed
5. Mint programado
6. Verificar elegibilidad
7. Mint solo elegibles
8. **Análisis detallado** 👈 Úsalo primero
9. Múltiples contratos
10. Gas ultra-agresivo

```bash
# Ver el archivo
cat examples.js

# Ejecutar un ejemplo (edita primero para añadir direcciones)
node examples.js
```

---

## 📁 Estructura del Proyecto

```
monad-nft-sniper/
├── index.js              ← PRINCIPAL: Ejecuta el bot
├── examples.js           ← Ejemplos de uso avanzado
├── .env                  ← TU CONFIGURACIÓN
├── README.md             ← Documentación completa
├── QUICK_START.md        ← Este archivo
│
├── config/
│   ├── networks.js       ← Monad, Ethereum, testnets
│   ├── abis.js           ← ABIs de contratos NFT
│   └── constants.js      ← Constantes
│
└── src/
    ├── wallets/
    │   └── manager.js    ← Gestión multi-wallet
    ├── mint/
    │   ├── analyzer.js   ← 🧠 NUEVO: Análisis adaptativo
    │   ├── payload.js    ← 🧠 NUEVO: Constructor inteligente
    │   ├── adaptive-executor.js  ← 🧠 NUEVO: Executor adaptativo
    │   ├── detector.js   ← Detección estándar
    │   ├── executor.js   ← Executor estándar
    │   └── scheduler.js  ← Mints programados
    └── utils/
        ├── logger.js     ← Sistema de logs
        └── helpers.js    ← Utilidades
```

---

## 🎓 Flujo Recomendado

### Primera Vez:
1. ✅ Instala y configura
2. ✅ Ejecuta `npm start` en modo adaptativo
3. ✅ Prueba con un mint público conocido
4. ✅ Verifica logs en `logs/`

### Para Cada Drop:
1. 🔍 **Analiza primero** (example8_AnalysisOnly)
2. 📋 **Verifica elegibilidad** (example6_CheckEligibility)
3. ⚙️ **Configura** precio/gas según necesites
4. 🚀 **Ejecuta** con `npm start`
5. 📊 **Revisa** logs y resultados

---

## 🔧 Configuración .env Completa

```env
# === RPC ===
MONAD_RPC=https://rpc.monad.xyz
MONAD_CHAIN_ID=41454

# === WALLETS (añade todas las que quieras) ===
PRIVATE_KEY_1=0xtu_pk_aqui
PRIVATE_KEY_2=0x...
PRIVATE_KEY_3=0x...

# === GAS (ajusta según competitividad) ===
MAX_GAS_PRICE=100
MAX_PRIORITY_FEE=2        # Bajo=2, Medio=5, Alto=10+
GAS_LIMIT_MIN=180000
GAS_LIMIT_MAX=300000      # Aumenta si falla por gas

# === MINT ===
MAX_CONCURRENT_MINTS=10
RETRY_ATTEMPTS=3          # Más=5 para FCFS competitivo
RETRY_DELAY=500           # Menos=200 para más velocidad

# === DETECCIÓN ===
AUTO_DETECT_MINT_FUNCTION=true
```

---

## 🎉 ¡Listo para Mintear!

```bash
npm start
```

### Preguntas Frecuentes:

**P: ¿Cuál modo usar?**  
R: 🧠 Adaptativo en el 90% de casos

**P: ¿Funciona con todos los launchpads?**  
R: Sí - Magic Eden, OpenSea, y cualquier EVM

**P: ¿Necesito whitelist?**  
R: Solo si el mint lo requiere (el bot te avisa)

**P: ¿Cuántas wallets usar?**  
R: Mínimo 5, recomendado 10-20 para FCFS

**P: ¿Es seguro?**  
R: Sí, pero NUNCA compartas tu .env

---

**Bot creado para la comunidad Monad** 🟣  
**¡Buen minteo!** 🚀

---

## 🆘 Ayuda Rápida

- 📖 **Documentación completa**: `README.md`
- 💻 **Ejemplos de código**: `examples.js`
- 📝 **Logs**: `logs/mint-*.log`
- ⚙️ **Configuración**: `.env`

**Si tienes problemas, revisa los logs primero** 👆
