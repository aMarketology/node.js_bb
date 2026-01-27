# Bridge L1 → L2 - Quick Reference

## 🚀 Quick Start

```javascript
import nacl from 'tweetnacl'
import crypto from 'crypto'

// Your credentials
const PRIVATE_KEY = "your_64_hex_chars"
const WALLET_ADDRESS = "L1_YOUR_ADDRESS"

// Bridge function
async function bridge(amount) {
  const payload = JSON.stringify({ amount, target_layer: "L2" })
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomUUID()
  const message = `${payload}\n${timestamp}\n${nonce}`
  
  const messageToSign = Buffer.concat([
    Buffer.from([1]),  // Chain ID for L1
    Buffer.from(message, 'utf-8')
  ])
  
  const privateKey = Buffer.from(PRIVATE_KEY, 'hex')
  const keypair = nacl.sign.keyPair.fromSeed(privateKey.slice(0, 32))
  const signature = nacl.sign.detached(messageToSign, keypair.secretKey)
  
  const response = await fetch('http://localhost:3000/api/bridge/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload,
      public_key: Buffer.from(keypair.publicKey).toString('hex'),
      wallet_address: WALLET_ADDRESS,
      signature: Buffer.from(signature).toString('hex'),
      nonce,
      timestamp,
      chain_id: 1
    })
  })
  
  return await response.json()
}

// Usage
bridge(100).then(r => console.log('Lock ID:', r.lock_id))
```

## 📋 Request Format

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

## 🔐 Message to Sign

```
[0x01] + "{\"amount\":100,\"target_layer\":\"L2\"}\n1769313445\nuuid"
```

Format: `[chain_id_byte] + payload + \n + timestamp + \n + nonce`

## ✅ Response (Success)

```json
{
  "success": true,
  "lock_id": "lock_12345",
  "amount": 100,
  "wallet_address": "L1_YOUR_ADDRESS",
  "message": "Tokens locked on L1. L2 credit will be processed automatically."
}
```

## ❌ Common Errors

| Status | Error | Fix |
|--------|-------|-----|
| 400 | Missing fields | Include all required fields |
| 400 | Invalid chain_id | Use chain_id = 1 for L1 |
| 400 | Timestamp expired | Generate new timestamp |
| 400 | Invalid hex length | Check pk=64, sig=128 |
| 401 | Invalid signature | Verify signing process |
| 500 | L1 error | Check L1 server logs |

## 🔍 Validation Checklist

- [ ] All fields present
- [ ] `chain_id = 1`
- [ ] Timestamp within 5 minutes
- [ ] Public key = 64 hex chars
- [ ] Signature = 128 hex chars
- [ ] Payload is valid JSON
- [ ] Amount > 0
- [ ] target_layer = "L2"

## 🧪 Testing

```bash
# Set credentials
$env:TEST_PRIVATE_KEY = "your_key"
$env:TEST_WALLET_ADDRESS = "your_address"

# Run tests
node bridge-tests/test-bridge-initiate.js

# Or run example
node bridge-tests/example-usage.js
```

## 🔧 Required Dependencies

```json
{
  "tweetnacl": "^1.0.3",
  "crypto": "built-in"
}
```

## 📡 Endpoint

```
POST http://localhost:3000/api/bridge/initiate
```

## 🔒 Security Features

1. **Domain Separation**: Chain ID byte (0x01 for L1)
2. **Timestamp Check**: 5-minute window
3. **Nonce**: Unique UUID per request
4. **Ed25519**: Cryptographic signature
5. **Input Validation**: Amount, target, hex lengths

## 📦 Key Sizes

| Field | Size | Format |
|-------|------|--------|
| Private Key | 32 bytes | 64 hex chars |
| Public Key | 32 bytes | 64 hex chars |
| Signature | 64 bytes | 128 hex chars |
| Chain ID | 1 byte | 0x01 (L1), 0x02 (L2) |

## 🌉 Flow Summary

```
User → Sign Request → Next.js API → Validate → L1 Backend → Lock Tokens → Return lock_id
```

## 📚 Documentation Links

- [BRIDGE-L1-L2-ENDPOINT.md](BRIDGE-L1-L2-ENDPOINT.md) - Full API docs
- [bridge-tests/README.md](bridge-tests/README.md) - Testing guide
- [BRIDGE-FLOW-DIAGRAM.md](BRIDGE-FLOW-DIAGRAM.md) - Visual diagrams
- [BRIDGE-IMPLEMENTATION-SUMMARY.md](BRIDGE-IMPLEMENTATION-SUMMARY.md) - Overview

## 💡 Pro Tips

1. **Always use UTC timestamps** in seconds, not milliseconds
2. **Store private keys securely** - never commit to git
3. **Chain ID byte is prepended** to the message before signing
4. **Nonce should be unique** for each request
5. **Test signature verification** before sending real requests

## 🆘 Quick Troubleshooting

**"Invalid signature"**
→ Check message format: `payload\ntimestamp\nnonce`
→ Verify chain ID byte is prepended

**"Timestamp expired"**
→ Use `Math.floor(Date.now() / 1000)` for current time

**"L1 connection refused"**
→ Start L1 server: `cargo run` or `./l1_server`

**"Missing fields"**
→ Ensure all 7 fields present in request

## 📞 Support Files

- `bridge-tests/test-bridge-initiate.js` - Full test suite
- `bridge-tests/example-usage.js` - Simple example
- `app/api/bridge/initiate/route.ts` - API implementation

## 🎯 Typical Values

```javascript
amount: 100              // Number of tokens
target_layer: "L2"       // Always "L2" for bridge
chain_id: 1             // Always 1 for L1
timestamp: 1769313445   // Current Unix time (seconds)
nonce: "550e8400-..."   // crypto.randomUUID()
```

## ⚡ One-Liner Test

```bash
node -e "require('./bridge-tests/example-usage.js')"
```

---

**Need help?** Check the full documentation or run the test suite!
