# 🚀 INSTRUCCIONES RÁPIDAS DE INSTALACIÓN

## Pasos para empezar (5 minutos)

### 1. Descomprimir
```bash
unzip monad-nft-sniper.zip
cd monad-nft-sniper
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar wallets
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus private keys
nano .env
# O usa tu editor favorito: code .env, vim .env, etc.
```

**IMPORTANTE**: En el archivo `.env`, reemplaza:
```
PRIVATE_KEY_1=0xTU_PRIVATE_KEY_1
PRIVATE_KEY_2=0xTU_PRIVATE_KEY_2
```

Con tus private keys reales:
```
PRIVATE_KEY_1=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
PRIVATE_KEY_2=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

**⚠️ NUNCA compartas tu archivo .env con nadie**

### 4. Ejecutar
```bash
npm start
```

---

## 📋 Checklist Pre-Mint

Antes de hacer mint, verifica:

- [ ] ✅ Todas las wallets tienen suficiente balance de MON
- [ ] ✅ El RPC está funcionando (prueba con `npm start`)
- [ ] ✅ Tienes la dirección correcta del contrato NFT
- [ ] ✅ Conoces el precio del mint (el bot lo detecta automáticamente)
- [ ] ✅ Sabes cuántos NFTs quieres por wallet
- [ ] ✅ Has verificado que el mint está abierto

---

## 🔥 Consejos para FCFS

### Para máxima velocidad:

1. **RPC Premium**: Usa Alchemy o Infura en lugar del RPC público
   ```env
   MONAD_RPC=https://monad-mainnet.g.alchemy.com/v2/TU_KEY
   ```

2. **Gas agresivo**: Aumenta el priority fee
   ```env
   MAX_PRIORITY_FEE=5  # En lugar de 2
   ```

3. **Más wallets**: Cuantas más wallets, más probabilidades
   ```env
   PRIVATE_KEY_1=...
   PRIVATE_KEY_2=...
   PRIVATE_KEY_3=...
   # ... añade hasta 10 o más
   ```

4. **Internet rápido**: Usa conexión por cable, no WiFi

5. **Cerca del servidor**: Si puedes, ejecuta desde un VPS cerca de los servidores de Monad

---

## 🎯 Ejemplos de Uso

### Mint instantáneo (FCFS abierto)
```
npm start
? ¿Qué modo? ⚡ Mint Instantáneo
? Dirección: 0x1234567890abcdef1234567890abcdef12345678
? ¿Cuántos? 2
```

### Mint programado (horario específico)
```
npm start
? ¿Qué modo? ⏰ Mint Programado
? Dirección: 0x1234567890abcdef1234567890abcdef12345678
? ¿Cuántos? 1
? Timestamp: 1735555200
```

**Cómo obtener timestamp:**
- Visita: https://www.unixtimestamp.com/
- Ingresa fecha y hora del drop
- Copia el timestamp

### Usando URL de Magic Eden
```
npm start
? ¿Qué modo? ⚡ Mint Instantáneo
? Dirección: https://magiceden.io/launchpad/monad/sealuminati
? ¿Cuántos? 1
```

---

## ⚠️ Problemas Comunes

### "Insufficient funds"
**Solución**: Añade más MON a tus wallets. Necesitas: (precio_mint * cantidad) + gas

### "Transacción revertida"
**Solución**: El mint puede estar cerrado, o has alcanzado el límite por wallet

### "No se encontraron private keys"
**Solución**: Verifica que copiaste `.env.example` a `.env` y añadiste tus keys

### "Network error"
**Solución**: Verifica tu RPC. Prueba con un RPC diferente

### "Gas insuficiente"
**Solución**: Aumenta `GAS_LIMIT_MAX` en `.env` a 400000 o más

---

## 🔐 Seguridad

### ✅ HACER:
- Usar wallets dedicadas para bots
- Mantener `.env` privado
- Verificar contratos antes de mintear
- Probar con cantidades pequeñas primero

### ❌ NO HACER:
- Compartir tu `.env`
- Usar wallets con muchos fondos
- Mintear sin verificar el contrato
- Subir el proyecto a GitHub con `.env`

---

## 📞 Soporte

Si tienes problemas:
1. Lee el README.md completo
2. Verifica la sección de Troubleshooting
3. Revisa los logs en la carpeta `logs/`
4. Verifica que todas las dependencias se instalaron: `npm list`

---

## 🎉 ¡Listo para Mintear!

```bash
npm start
```

**¡Buena suerte con tus mints!** 🚀
