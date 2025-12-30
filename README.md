# 🚀 Monad NFT Sniper Bot

Bot profesional de minteo multi-wallet para Monad Mainnet con soporte para Magic Eden, OpenSea y cualquier launchpad.

## ✨ Características

- ✅ **Multi-wallet support** - Mintea desde múltiples wallets simultáneamente
- ✅ **Monad Mainnet compatible** - Funciona en Monad blockchain
- ✅ **Magic Eden & OpenSea** - Compatible con cualquier launchpad
- ✅ **FCFS optimizado** - Máxima velocidad de minteo
- ✅ **Public & Scheduled mint** - Soporta ambos modos
- ✅ **Auto gas optimization** - Ajusta gas dinámicamente
- ✅ **Smart contract detection** - Detecta función de mint automáticamente
- ✅ **Retry logic** - Reintentos automáticos en caso de fallo

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus private keys y configuración
nano .env
```

## 🔧 Configuración

Edita el archivo `.env` y configura:

1. **RPC de Monad**: Usa el público o uno privado de Alchemy/Infura
2. **Private Keys**: Añade todas las wallets que necesites (PRIVATE_KEY_1, PRIVATE_KEY_2, etc.)
3. **Gas Settings**: Ajusta según tu preferencia de velocidad/costo
4. **Retry Settings**: Configura reintentos automáticos

## 🚀 Uso

```bash
npm start
```

El bot te hará preguntas interactivas:
1. ¿Modo de mint? (Instantáneo/Programado/Por Bloque)
2. Dirección del contrato NFT
3. Cantidad de NFTs por wallet

### Modos de Mint

#### ⚡ Mint Instantáneo (FCFS)
Para drops con mint abierto. Ejecuta inmediatamente desde todas las wallets.

#### ⏰ Mint Programado (Timestamp)
Para drops con hora exacta. Espera hasta el timestamp y ejecuta automáticamente.

#### 🔗 Mint por Bloque
Para drops coordinados por número de bloque. Monitorea la blockchain y ejecuta cuando se alcanza el bloque target.

## 📊 Ejemplo de Uso

```
🚀 MONAD NFT SNIPER BOT 🚀

✓ Conectado a Monad Mainnet
  Chain ID: 41454

📱 Total de wallets cargadas: 5

💰 Verificando balances...

Wallet 1: 0x742d...35Ce - 10.5 MON
Wallet 2: 0x8f4a...91Db - 8.3 MON
Wallet 3: 0x1c2e...47Fa - 12.1 MON
Wallet 4: 0x9d3b...82Ac - 9.7 MON
Wallet 5: 0x5e6f...63Bd - 11.2 MON

? ¿Qué modo de mint quieres usar? ⚡ Mint Instantáneo (FCFS)
? Dirección del contrato NFT: 0x1234567890abcdef1234567890abcdef12345678
? ¿Cuántos NFTs por wallet? 2

🔍 Detectando función de mint...
✓ Función detectada: mint(uint256)
✓ Precio detectado: 0.001 MON
📊 Supply: 1234/10000

🔥 Iniciando mint desde 5 wallets...

🚀 Wallet 0x742d... minteando 2 NFT(s)...
⏳ TX enviada: 0xabc123...
✅ Mint exitoso! Block: 1234567

🚀 Wallet 0x8f4a... minteando 2 NFT(s)...
⏳ TX enviada: 0xdef456...
✅ Mint exitoso! Block: 1234568

[...]

==================================================
✅ Mints exitosos: 5
❌ Mints fallidos: 0
==================================================

✅ Proceso completado!
```

## 🛡️ Seguridad

- ⚠️ **NUNCA** compartas tu archivo `.env`
- ⚠️ Mantén tus private keys seguras
- ⚠️ Usa wallets dedicadas para bots
- ⚠️ Verifica siempre el contrato antes de mintear
- ⚠️ Prueba en testnet primero

## 📝 Notas Importantes

1. **Gas**: Asegúrate de tener suficiente MON en todas las wallets para gas + mint price
2. **RPC**: Un RPC premium (Alchemy/Infura) dará mejor rendimiento que el público
3. **Timing**: En FCFS altamente competitivos, microsegundos importan
4. **Limits**: Algunos contratos tienen límites por wallet o transacción
5. **Testing**: SIEMPRE prueba primero con cantidades pequeñas

## 🐛 Troubleshooting

### Error: "No se encontraron private keys"
- Verifica que el archivo `.env` existe
- Verifica que las private keys están en formato correcto (0x...)

### Error: "Insufficient funds"
- Verifica que todas las wallets tienen suficiente MON
- El costo total es: (mint_price * quantity) + gas

### Error: "No se pudo detectar la función de mint"
- El contrato puede tener una función personalizada
- Contacta al desarrollador del proyecto para detalles

### Transacciones fallando
- Aumenta `GAS_LIMIT_MAX` en `.env`
- Aumenta `MAX_PRIORITY_FEE` para mayor prioridad
- Verifica que el mint está abierto

## 📄 Licencia

MIT License - Úsalo libremente bajo tu propio riesgo.


