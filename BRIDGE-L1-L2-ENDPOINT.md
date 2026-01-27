# Bridge L1 → L2 Endpoint Documentation

## Overview

The Bridge L1 → L2 endpoint allows users to lock tokens on Layer 1 and initiate a credit on Layer 2. This endpoint validates Ed25519 signatures and forwards requests to the L1 backend.

## Endpoint

```
POST http://localhost:3000/api/bridge/initiate
```

## Request Format

### SignedRequest Structure

```typescript
interface SignedRequest {
  payload: string           // JSON string containing amount and target_layer
  public_key: string        // 64 hex characters (32 bytes)
  wallet_address: string    // L1 wallet address (required)
  signature: string         // 128 hex characters (64 bytes, Ed25519)
  nonce: string            // UUID or unique string
  timestamp: number        // Unix timestamp in seconds
  chain_id: number         // Must be 1 for L1
}
```

### Example Request Body

```json
{
  "payload": "{\"amount\":100,\"target_layer\":\"L2\"}",
  "public_key": "a1b2c3d4e5f6...64_hex_chars",
  "wallet_address": "L1_YOUR_ADDRESS",
  "signature": "e5f6a7b8c9d0...128_hex_chars",
  "nonce": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1769313445,
  "chain_id": 1
}
```

## Creating a Signed Request

### Step 1: Create the Payload

```javascript
const payload = {
  amount: 100,
  target_layer: "L2"
}
const payloadStr = JSON.stringify(payload)
```

### Step 2: Generate Timestamp and Nonce

```javascript
const timestamp = Math.floor(Date.now() / 1000)  // Unix timestamp in seconds
const nonce = crypto.randomUUID()                 // Unique identifier
```

### Step 3: Construct Message to Sign

The message format is:

```
[chain_id_byte] + "{payload}\n{timestamp}\n{nonce}"
```

```javascript
import nacl from 'tweetnacl'

// Construct the message
const message = `${payloadStr}\n${timestamp}\n${nonce}`

// Add domain separation (chain ID byte)
const chainIdByte = Buffer.from([1])  // 0x01 for L1
const messageBuffer = Buffer.from(message, 'utf-8')
const messageToSign = Buffer.concat([chainIdByte, messageBuffer])
```

### Step 4: Sign with Ed25519

```javascript
// Assuming you have your private key as a 32-byte seed
const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex')
const keypair = nacl.sign.keyPair.fromSeed(privateKeyBuffer.slice(0, 32))

// Sign the message
const signature = nacl.sign.detached(messageToSign, keypair.secretKey)
const signatureHex = Buffer.from(signature).toString('hex')

// Get public key
const publicKeyHex = Buffer.from(keypair.publicKey).toString('hex')
```

### Step 5: Build the Request

```javascript
const signedRequest = {
  payload: payloadStr,
  public_key: publicKeyHex,
  wallet_address: "L1_YOUR_ADDRESS",
  signature: signatureHex,
  nonce: nonce,
  timestamp: timestamp,
  chain_id: 1
}

// Send the request
const response = await fetch('http://localhost:3000/api/bridge/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(signedRequest)
})

const result = await response.json()
```

## Complete Example

```javascript
import nacl from 'tweetnacl'
import crypto from 'crypto'

async function bridgeToL2(privateKeyHex, walletAddress, amount) {
  // 1. Create payload
  const payload = { amount, target_layer: "L2" }
  const payloadStr = JSON.stringify(payload)
  
  // 2. Generate metadata
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomUUID()
  
  // 3. Construct message
  const message = `${payloadStr}\n${timestamp}\n${nonce}`
  
  // 4. Sign with domain separation
  const chainIdByte = Buffer.from([1])  // L1
  const messageToSign = Buffer.concat([
    chainIdByte,
    Buffer.from(message, 'utf-8')
  ])
  
  const privateKey = Buffer.from(privateKeyHex, 'hex')
  const keypair = nacl.sign.keyPair.fromSeed(privateKey.slice(0, 32))
  const signature = nacl.sign.detached(messageToSign, keypair.secretKey)
  
  // 5. Build request
  const signedRequest = {
    payload: payloadStr,
    public_key: Buffer.from(keypair.publicKey).toString('hex'),
    wallet_address: walletAddress,
    signature: Buffer.from(signature).toString('hex'),
    nonce: nonce,
    timestamp: timestamp,
    chain_id: 1
  }
  
  // 6. Send request
  const response = await fetch('http://localhost:3000/api/bridge/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedRequest)
  })
  
  return await response.json()
}

// Usage
const result = await bridgeToL2(
  'your_private_key_hex',
  'L1_YOUR_ADDRESS',
  100
)

console.log('Lock ID:', result.lock_id)
console.log('Message:', result.message)
```

## Success Response

```json
{
  "success": true,
  "lock_id": "lock_12345",
  "amount": 100,
  "wallet_address": "L1_YOUR_ADDRESS",
  "target_layer": "L2",
  "timestamp": 1769313445,
  "message": "Tokens locked on L1. L2 credit will be processed automatically.",
  "l1_response": {
    "lock_id": "lock_12345",
    "status": "locked"
  }
}
```

## Error Responses

### 400 Bad Request

**Missing Fields:**
```json
{
  "error": "Missing required fields in signed request"
}
```

**Invalid Chain ID:**
```json
{
  "error": "Invalid chain_id: expected 1, got 2"
}
```

**Expired Timestamp:**
```json
{
  "error": "Request timestamp expired (max 5 minutes)"
}
```

**Invalid Payload:**
```json
{
  "error": "Invalid amount in payload: must be a positive number"
}
```

**Invalid Hex Length:**
```json
{
  "error": "Invalid signature length: expected 128 hex chars"
}
```

### 401 Unauthorized

**Invalid Signature:**
```json
{
  "error": "Invalid signature"
}
```

### 500 Internal Server Error

**L1 Backend Error:**
```json
{
  "error": "Bridge operation failed",
  "details": "Connection refused to L1 server"
}
```

## Validation Rules

The endpoint validates the following:

1. **Required Fields**: All fields in SignedRequest must be present
2. **Chain ID**: Must be 1 (L1)
3. **Timestamp**: Must be within 5 minutes of current time
4. **Public Key**: Must be exactly 64 hex characters
5. **Signature**: Must be exactly 128 hex characters
6. **Payload**: Must be valid JSON with `amount` (positive number) and `target_layer` ("L2")
7. **Signature Verification**: Ed25519 signature must be valid for the given message

## Security Features

### Domain Separation

The signature scheme uses domain separation by prepending a chain ID byte to the message:
- **L1**: Chain ID = 1 (0x01)
- **L2**: Chain ID = 2 (0x02)

This prevents replay attacks across chains.

### Timestamp Validation

Requests must be signed with a timestamp within 5 minutes of the current time. This prevents replay attacks with old signatures.

### Nonce Protection

Each request must include a unique nonce. The backend should track used nonces to prevent replay attacks.

## Message Format Details

The message to sign follows this exact format:

```
[chain_id_byte] + payload_json + "\n" + timestamp + "\n" + nonce
```

**Example:**

```
Chain ID byte: 0x01
Payload: {"amount":100,"target_layer":"L2"}
Timestamp: 1769313445
Nonce: 550e8400-e29b-41d4-a716-446655440000

Message to sign:
[0x01]{"amount":100,"target_layer":"L2"}
1769313445
550e8400-e29b-41d4-a716-446655440000
```

## Testing

Use the provided test script to validate the endpoint:

```bash
node bridge-tests/test-bridge-initiate.js
```

Set environment variables:

```bash
export TEST_PRIVATE_KEY="your_64_char_hex_private_key"
export TEST_WALLET_ADDRESS="L1_YOUR_ADDRESS"
```

## Integration with SDK

The endpoint is designed to work with the `UnifiedDealerSDK`:

```javascript
import { UnifiedDealerSDK } from './sdk/unified-dealer-sdk.js'

const sdk = new UnifiedDealerSDK({
  privateKey: 'your_private_key_hex',
  l1Url: 'http://localhost:8080',
  l2Url: 'http://localhost:1234'
})

// Bridge 100 tokens from L1 to L2
const result = await sdk.bridgeToL2(100)
console.log('Lock ID:', result.lock.lock_id)
```

## Flow Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Create signed request
       │    (payload + signature)
       │
       ▼
┌─────────────────────┐
│   Next.js API       │
│  /api/bridge/       │
│    initiate         │
└──────┬──────────────┘
       │
       │ 2. Validate signature
       │    Verify timestamp
       │    Check payload
       │
       ▼
┌─────────────────────┐
│   L1 Backend        │
│  localhost:8080     │
│  /bridge/initiate   │
└──────┬──────────────┘
       │
       │ 3. Lock tokens
       │    Record lock_id
       │
       ▼
┌─────────────────────┐
│   L2 Backend        │
│  localhost:1234     │
│  /bridge/credit     │
└─────────────────────┘
       │
       │ 4. Credit tokens
       │    (automatic)
       │
       ▼
    Success
```

## Troubleshooting

### "Invalid signature" Error

1. **Check message format**: Ensure payload, timestamp, and nonce are formatted correctly with `\n` separators
2. **Domain separation**: Verify chain ID byte (0x01) is prepended to the message
3. **Key derivation**: Ensure you're using the correct private key seed (first 32 bytes)
4. **Hex encoding**: Verify signature is 128 hex characters

### "Request timestamp expired" Error

1. **Clock sync**: Ensure your system clock is accurate
2. **Timezone**: Use UTC timestamps, not local time
3. **Units**: Timestamp must be in seconds, not milliseconds

### L1 Connection Errors

1. **L1 server running**: Verify L1 backend is running on port 8080
2. **CORS**: Next.js API acts as a proxy to handle CORS issues
3. **Network**: Check firewall and network connectivity

## Related Endpoints

- **GET /api/bridge/status/:lockId** - Check bridge lock status
- **POST /api/bridge/withdraw** - Bridge L2 → L1 (withdrawal)
- **GET /api/bridge/locks/:address** - Get all locks for an address

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_L1_API_URL=http://localhost:8080
NEXT_PUBLIC_L2_API_URL=http://localhost:1234
```

## Support

For issues or questions:
1. Check test script output for detailed errors
2. Review console logs in Next.js API route
3. Verify L1 backend logs for bridge operations
4. Ensure all required dependencies are installed (`tweetnacl`)
