# Bridge Endpoints - Quick Reference

## Overview

This project implements two bridge endpoints for moving tokens between Layer 1 (L1) and Layer 2 (L2):

1. **Bridge L1 → L2 (Deposit)**: Lock tokens on L1, credit on L2
2. **Bridge L2 → L1 (Withdrawal)**: Burn tokens on L2, unlock on L1

Both endpoints use Ed25519 signatures with domain separation for security.

---

## 🔵 Bridge L1 → L2 (Deposit)

### Endpoint
```
POST http://localhost:3000/api/bridge/initiate
```

### Request Format
```json
{
  "payload": "{\"amount\":100,\"target_layer\":\"L2\"}",
  "public_key": "64_hex_chars",
  "wallet_address": "L1_YOUR_ADDRESS",
  "signature": "128_hex_chars",
  "nonce": "uuid",
  "timestamp": 1769313445,
  "chain_id": 1
}
```

### Message to Sign
```
[0x01] + "{\"amount\":100,\"target_layer\":\"L2\"}\n1769313445\nuuid"
```

### Quick Example
```javascript
const payload = JSON.stringify({ amount: 100, target_layer: "L2" })
const timestamp = Math.floor(Date.now() / 1000)
const nonce = crypto.randomUUID()
const message = `${payload}\n${timestamp}\n${nonce}`

const messageToSign = Buffer.concat([
  Buffer.from([1]),  // Chain ID for L1
  Buffer.from(message, 'utf-8')
])

const signature = nacl.sign.detached(messageToSign, secretKey)
```

### Success Response
```json
{
  "success": true,
  "lock_id": "lock_12345",
  "amount": 100,
  "message": "Tokens locked on L1. L2 credit will be processed automatically."
}
```

### Documentation
- [BRIDGE-L1-L2-ENDPOINT.md](BRIDGE-L1-L2-ENDPOINT.md) - Complete documentation
- [bridge-tests/example-usage.js](bridge-tests/example-usage.js) - Example code
- [bridge-tests/test-bridge-initiate.js](bridge-tests/test-bridge-initiate.js) - Test suite

---

## 🔴 Bridge L2 → L1 (Withdrawal)

### Endpoint
```
POST http://localhost:3000/api/bridge/withdraw
```

### Request Format
```json
{
  "from_address": "L2_YOUR_ADDRESS",
  "amount": 1000.0,
  "public_key": "64_hex_chars",
  "signature": "128_hex_chars",
  "timestamp": 1737724800,
  "nonce": "uuid"
}
```

### Message to Sign
```json
{
  "action": "WITHDRAW_REQUEST",
  "nonce": "uuid",
  "payload": {
    "amount": 1000.0,
    "from_address": "L2_YOUR_ADDRESS"
  },
  "timestamp": 1737724800
}
```

**Note**: Keys must be sorted alphabetically!

### Quick Example
```javascript
const signaturePayload = {
  action: 'WITHDRAW_REQUEST',
  nonce: crypto.randomUUID(),
  payload: {
    amount: 1000,
    from_address: 'L2_YOUR_ADDRESS'
  },
  timestamp: Math.floor(Date.now() / 1000)
}

// Sort keys alphabetically
const sortedPayload = sortKeysAlphabetically(signaturePayload)
const message = JSON.stringify(sortedPayload)

const messageToSign = Buffer.concat([
  Buffer.from([2]),  // Chain ID for L2
  Buffer.from(message, 'utf-8')
])

const signature = nacl.sign.detached(messageToSign, secretKey)
```

### Success Response
```json
{
  "success": true,
  "withdrawal_id": "withdraw_12345",
  "amount": 1000.0,
  "status": "pending",
  "message": "Withdrawal request submitted. L2 balance debited. Awaiting dealer completion."
}
```

### Documentation
- [BRIDGE-L2-L1-WITHDRAWAL.md](BRIDGE-L2-L1-WITHDRAWAL.md) - Complete documentation
- [bridge-tests/example-withdrawal.js](bridge-tests/example-withdrawal.js) - Example code
- [bridge-tests/test-withdrawal.js](bridge-tests/test-withdrawal.js) - Test suite

---

## 🔑 Key Differences

| Feature | L1 → L2 (Deposit) | L2 → L1 (Withdrawal) |
|---------|------------------|---------------------|
| **Chain ID** | 1 (0x01) | 2 (0x02) |
| **Address Prefix** | L1_ | L2_ |
| **Message Format** | `payload\ntimestamp\nnonce` | Action/payload structure (sorted JSON) |
| **JSON Sorting** | Not required for payload | **Required** (alphabetically) |
| **Backend** | L1 (port 8080) | L2 (port 1234) |
| **Process** | Single step (auto L2 credit) | Two steps (user + dealer) |
| **Result** | Immediate | Pending, requires dealer completion |

---

## 📋 Common Request Fields

Both endpoints require:

| Field | Type | Size | Description |
|-------|------|------|-------------|
| `public_key` | string | 64 hex chars | Ed25519 public key |
| `signature` | string | 128 hex chars | Ed25519 signature |
| `timestamp` | number | - | Unix timestamp (seconds) |
| `nonce` | string | - | Unique identifier (UUID) |
| `amount` | number | - | Positive number |

---

## 🔐 Security Features

### Domain Separation
- **L1**: Chain ID = 1 (0x01)
- **L2**: Chain ID = 2 (0x02)
- Prevents cross-chain replay attacks

### Timestamp Validation
- 5-minute window
- Prevents replay of old signatures

### Nonce Protection
- Unique per request
- Prevents duplicate submissions

### Ed25519 Signatures
- Cryptographically secure
- Proves ownership of private key

---

## 🧪 Testing

### Test Deposit (L1 → L2)
```bash
$env:TEST_PRIVATE_KEY = "your_key"
$env:TEST_WALLET_ADDRESS = "L1_YOUR_ADDRESS"
node bridge-tests/test-bridge-initiate.js
```

### Test Withdrawal (L2 → L1)
```bash
$env:TEST_PRIVATE_KEY = "your_key"
$env:TEST_WALLET_ADDRESS = "L2_YOUR_ADDRESS"
node bridge-tests/test-withdrawal.js
```

---

## 📊 Flow Comparison

### L1 → L2 (Deposit)
```
User → Next.js API → Validate → L1 Backend → Lock → Return lock_id → L2 Credit (auto)
```

### L2 → L1 (Withdrawal)
```
User → Next.js API → Validate → L2 Backend → Debit → Return withdrawal_id → Dealer → L1 Unlock
```

---

## ❌ Common Errors

| Status | Error | Common Causes |
|--------|-------|---------------|
| 400 | Missing fields | Incomplete request |
| 400 | Invalid chain_id | Wrong chain ID for operation |
| 400 | Timestamp expired | Request older than 5 minutes |
| 400 | Invalid hex length | Wrong public_key or signature size |
| 401 | Invalid signature | Signing error, wrong key, or message format |
| 500 | Backend error | Server connection or balance issues |

---

## 🔧 Helper Functions

### Alphabetical JSON Sorting (Required for Withdrawal)
```javascript
function sortKeysAlphabetically(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sortKeysAlphabetically)
  
  const sortedKeys = Object.keys(obj).sort()
  const result = {}
  for (const key of sortedKeys) {
    result[key] = sortKeysAlphabetically(obj[key])
  }
  return result
}
```

### Ed25519 Signing with Domain Separation
```javascript
function signMessage(privateKeyHex, message, chainId) {
  const chainIdByte = Buffer.from([chainId])
  const messageToSign = Buffer.concat([
    chainIdByte,
    Buffer.from(message, 'utf-8')
  ])
  
  const privateKey = Buffer.from(privateKeyHex, 'hex')
  const keypair = nacl.sign.keyPair.fromSeed(privateKey.slice(0, 32))
  const signature = nacl.sign.detached(messageToSign, keypair.secretKey)
  
  return Buffer.from(signature).toString('hex')
}
```

---

## 📚 Complete Documentation

### Deposit (L1 → L2)
- [BRIDGE-L1-L2-ENDPOINT.md](BRIDGE-L1-L2-ENDPOINT.md) - Complete API docs
- [BRIDGE-QUICK-REFERENCE.md](BRIDGE-QUICK-REFERENCE.md) - Quick reference
- [bridge-tests/example-usage.js](bridge-tests/example-usage.js) - Code example

### Withdrawal (L2 → L1)
- [BRIDGE-L2-L1-WITHDRAWAL.md](BRIDGE-L2-L1-WITHDRAWAL.md) - Complete API docs
- [bridge-tests/example-withdrawal.js](bridge-tests/example-withdrawal.js) - Code example

### General
- [BRIDGE-FLOW-DIAGRAM.md](BRIDGE-FLOW-DIAGRAM.md) - Visual diagrams
- [BRIDGE-IMPLEMENTATION-SUMMARY.md](BRIDGE-IMPLEMENTATION-SUMMARY.md) - Overview
- [bridge-tests/README.md](bridge-tests/README.md) - Testing guide

---

## 🆘 Quick Troubleshooting

### Deposit Issues
- Ensure L1 server is running (port 8080)
- Use `chain_id = 1`
- Address starts with "L1_"
- Message format: `payload\ntimestamp\nnonce`

### Withdrawal Issues
- Ensure L2 server is running (port 1234)
- Use `chain_id = 2`
- Address starts with "L2_"
- **Must sort JSON keys alphabetically**
- Message is entire JSON object

---

## 🚀 Quick Start

### 1. Start Servers
```bash
# Terminal 1: L1 Backend
cd l1-server && cargo run

# Terminal 2: L2 Backend
cd l2-server && cargo run

# Terminal 3: Next.js
npm run dev
```

### 2. Set Credentials
```bash
$env:PRIVATE_KEY = "your_64_char_hex_key"
$env:WALLET_ADDRESS = "L1_or_L2_address"
```

### 3. Test
```bash
# Deposit
node bridge-tests/example-usage.js

# Withdrawal
node bridge-tests/example-withdrawal.js
```

---

## ✅ Implementation Checklist

Both endpoints implement:
- [x] Ed25519 signature validation
- [x] Domain separation (chain ID)
- [x] Timestamp expiration check
- [x] Nonce protection
- [x] Input validation
- [x] Hex length verification
- [x] Error handling
- [x] Comprehensive tests
- [x] Documentation

---

**Need help?** Check the complete documentation files or run the test suites!
