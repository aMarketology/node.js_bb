# Bridge L2 → L1 Withdrawal Endpoint Documentation

## Overview

The Bridge L2 → L1 withdrawal endpoint allows users to burn tokens on Layer 2 and request an unlock on Layer 1. This is a two-step process where the user first requests the withdrawal, and then a dealer completes the L1 transaction.

## Two-Step Process

### Step 1: User Requests Withdrawal (This Endpoint)
- User signs withdrawal request
- L2 debits user's balance immediately
- Creates pending withdrawal record
- Returns withdrawal ID

### Step 2: Dealer Completes Withdrawal (Separate Process)
- Dealer processes L1 transaction
- Unlocks funds on L1
- Updates withdrawal status to "completed"

This documentation covers **Step 1: Request Withdrawal**.

## Endpoint

```
POST http://localhost:3000/api/bridge/withdraw
```

## Request Format

### WithdrawalRequest Structure

```typescript
interface WithdrawalRequest {
  from_address: string      // L2 wallet address (starts with "L2_")
  amount: number           // Amount to withdraw (positive number)
  public_key: string       // 64 hex characters (32 bytes)
  signature: string        // 128 hex characters (64 bytes, Ed25519)
  timestamp: number        // Unix timestamp in seconds
  nonce: string           // Unique string (UUID)
}
```

### Example Request Body

```json
{
  "from_address": "L2_52882D768C0F3E7932AAD1813CF8B19058D507A8",
  "amount": 1000.0,
  "public_key": "a1b2c3d4e5f6...64_hex_chars",
  "signature": "e5f6a7b8c9d0...128_hex_chars",
  "timestamp": 1737724800,
  "nonce": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Creating a Signed Withdrawal Request

### Step 1: Generate Metadata

```javascript
const timestamp = Math.floor(Date.now() / 1000)  // Unix timestamp in seconds
const nonce = crypto.randomUUID()                 // Unique identifier
```

### Step 2: Create Signature Payload

The signature payload follows this specific structure:

```javascript
const signaturePayload = {
  action: 'WITHDRAW_REQUEST',
  nonce: nonce,
  payload: {
    amount: 1000.0,
    from_address: 'L2_52882D768C0F3E7932AAD1813CF8B19058D507A8'
  },
  timestamp: timestamp
}
```

### Step 3: Sort Keys Alphabetically

**Important**: The L2 server uses Rust serde_json which sorts keys alphabetically. You must match this:

```javascript
function sortKeysAlphabetically(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortKeysAlphabetically)
  }
  
  const sortedKeys = Object.keys(obj).sort()
  const result = {}
  for (const key of sortedKeys) {
    result[key] = sortKeysAlphabetically(obj[key])
  }
  return result
}

const sortedPayload = sortKeysAlphabetically(signaturePayload)
const message = JSON.stringify(sortedPayload)
```

**Result** (alphabetically sorted):
```json
{
  "action": "WITHDRAW_REQUEST",
  "nonce": "550e8400-e29b-41d4-a716-446655440000",
  "payload": {
    "amount": 1000.0,
    "from_address": "L2_52882D768C0F3E7932AAD1813CF8B19058D507A8"
  },
  "timestamp": 1737724800
}
```

### Step 4: Sign with Ed25519

```javascript
import nacl from 'tweetnacl'

// Add domain separation (chain ID byte for L2)
const chainIdByte = Buffer.from([2])  // 0x02 for L2
const messageToSign = Buffer.concat([
  chainIdByte,
  Buffer.from(message, 'utf-8')
])

// Sign the message
const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex')
const keypair = nacl.sign.keyPair.fromSeed(privateKeyBuffer.slice(0, 32))
const signature = nacl.sign.detached(messageToSign, keypair.secretKey)

const signatureHex = Buffer.from(signature).toString('hex')
const publicKeyHex = Buffer.from(keypair.publicKey).toString('hex')
```

### Step 5: Build the Request

```javascript
const withdrawalRequest = {
  from_address: 'L2_52882D768C0F3E7932AAD1813CF8B19058D507A8',
  amount: 1000.0,
  public_key: publicKeyHex,
  signature: signatureHex,
  timestamp: timestamp,
  nonce: nonce
}

// Send the request
const response = await fetch('http://localhost:3000/api/bridge/withdraw', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(withdrawalRequest)
})

const result = await response.json()
```

## Complete Example

```javascript
import nacl from 'tweetnacl'
import crypto from 'crypto'

// Helper: Sort keys alphabetically
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

async function withdrawFromL2(privateKeyHex, fromAddress, amount) {
  // 1. Generate metadata
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomUUID()
  
  // 2. Create signature payload
  const signaturePayload = {
    action: 'WITHDRAW_REQUEST',
    nonce: nonce,
    payload: {
      amount: amount,
      from_address: fromAddress
    },
    timestamp: timestamp
  }
  
  // 3. Sort and stringify
  const sortedPayload = sortKeysAlphabetically(signaturePayload)
  const message = JSON.stringify(sortedPayload)
  
  // 4. Sign with domain separation
  const chainIdByte = Buffer.from([2])  // L2
  const messageToSign = Buffer.concat([
    chainIdByte,
    Buffer.from(message, 'utf-8')
  ])
  
  const privateKey = Buffer.from(privateKeyHex, 'hex')
  const keypair = nacl.sign.keyPair.fromSeed(privateKey.slice(0, 32))
  const signature = nacl.sign.detached(messageToSign, keypair.secretKey)
  
  // 5. Build request
  const withdrawalRequest = {
    from_address: fromAddress,
    amount: amount,
    public_key: Buffer.from(keypair.publicKey).toString('hex'),
    signature: Buffer.from(signature).toString('hex'),
    timestamp: timestamp,
    nonce: nonce
  }
  
  // 6. Send request
  const response = await fetch('http://localhost:3000/api/bridge/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(withdrawalRequest)
  })
  
  return await response.json()
}

// Usage
const result = await withdrawFromL2(
  'your_private_key_hex',
  'L2_YOUR_ADDRESS',
  1000
)

console.log('Withdrawal ID:', result.withdrawal_id)
console.log('Status:', result.status)
console.log('Message:', result.message)
```

## Success Response

```json
{
  "success": true,
  "withdrawal_id": "withdraw_12345",
  "amount": 1000.0,
  "from_address": "L2_52882D768C0F3E7932AAD1813CF8B19058D507A8",
  "status": "pending",
  "timestamp": 1737724800,
  "message": "Withdrawal request submitted. L2 balance debited. Awaiting dealer completion.",
  "l2_response": {
    "withdrawal_id": "withdraw_12345",
    "status": "pending"
  }
}
```

## Error Responses

### 400 Bad Request

**Missing Fields:**
```json
{
  "error": "Missing required fields in withdrawal request"
}
```

**Invalid Amount:**
```json
{
  "error": "Invalid amount: must be a positive number"
}
```

**Expired Timestamp:**
```json
{
  "error": "Request timestamp expired (max 5 minutes)"
}
```

**Invalid Hex Length:**
```json
{
  "error": "Invalid signature length: expected 128 hex chars"
}
```

**Invalid Address Format:**
```json
{
  "error": "Invalid from_address: must start with \"L2_\""
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

**L2 Backend Error:**
```json
{
  "error": "L2 withdrawal operation failed",
  "details": "Insufficient balance on L2"
}
```

## Validation Rules

The endpoint validates the following:

1. **Required Fields**: All fields must be present
2. **Amount**: Must be a positive number
3. **Timestamp**: Must be within 5 minutes of current time
4. **Public Key**: Must be exactly 64 hex characters
5. **Signature**: Must be exactly 128 hex characters
6. **Address Format**: Must start with "L2_"
7. **Signature Verification**: Ed25519 signature must be valid

## Security Features

### Domain Separation

The signature scheme uses domain separation by prepending a chain ID byte:
- **L1**: Chain ID = 1 (0x01)
- **L2**: Chain ID = 2 (0x02)

This prevents replay attacks across chains.

### Timestamp Validation

Requests must be signed with a timestamp within 5 minutes of the current time.

### Nonce Protection

Each request must include a unique nonce to prevent duplicate submissions.

### Alphabetical JSON Sorting

Keys are sorted alphabetically to ensure deterministic JSON serialization, matching the L2 Rust server's behavior.

## Message Format Details

The signature payload follows this exact structure:

```json
{
  "action": "WITHDRAW_REQUEST",
  "nonce": "550e8400-e29b-41d4-a716-446655440000",
  "payload": {
    "amount": 1000.0,
    "from_address": "L2_52882D768C0F3E7932AAD1813CF8B19058D507A8"
  },
  "timestamp": 1737724800
}
```

**Message to sign:**
```
[0x02] + JSON.stringify(sortedPayload)
```

Where `[0x02]` is the chain ID byte for L2.

## Testing

Use the provided test script to validate the endpoint:

```bash
node bridge-tests/test-withdrawal.js
```

Set environment variables:

```bash
# Windows PowerShell
$env:TEST_PRIVATE_KEY = "your_64_char_hex_private_key"
$env:TEST_WALLET_ADDRESS = "L2_YOUR_ADDRESS"

# Linux/Mac
export TEST_PRIVATE_KEY="your_64_char_hex_private_key"
export TEST_WALLET_ADDRESS="L2_YOUR_ADDRESS"
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

// Withdraw 1000 tokens from L2 to L1
const result = await sdk.withdrawToL1(1000)
console.log('Withdrawal ID:', result.withdrawal_id)
console.log('Status:', result.status)
```

## Flow Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Create signed withdrawal request
       │    (sorted JSON + signature)
       │
       ▼
┌─────────────────────┐
│   Next.js API       │
│  /api/bridge/       │
│    withdraw         │
└──────┬──────────────┘
       │
       │ 2. Validate signature
       │    Verify timestamp
       │    Check payload
       │
       ▼
┌─────────────────────┐
│   L2 Backend        │
│  localhost:1234     │
│  /withdraw          │
└──────┬──────────────┘
       │
       │ 3. Debit L2 balance
       │    Create pending withdrawal
       │    Return withdrawal_id
       │
       ▼
┌─────────────────────┐
│   Pending State     │
│  (awaiting dealer)  │
└──────┬──────────────┘
       │
       │ 4. Dealer processes
       │    (separate operation)
       │
       ▼
┌─────────────────────┐
│   L1 Backend        │
│  Unlocks funds      │
└─────────────────────┘
       │
       │ 5. Withdrawal complete
       │
       ▼
    Success
```

## Key Differences from Deposit (L1→L2)

| Feature | Deposit (L1→L2) | Withdrawal (L2→L1) |
|---------|----------------|-------------------|
| Chain ID | 1 (0x01) | 2 (0x02) |
| Address prefix | L1_ | L2_ |
| Message format | Simple payload + timestamp + nonce | Action/payload structure |
| JSON sorting | Required | Required |
| Backend | L1 (port 8080) | L2 (port 1234) |
| Process | Single step (auto L2 credit) | Two steps (user + dealer) |

## Troubleshooting

### "Invalid signature" Error

1. **Check JSON sorting**: Keys must be alphabetically sorted
2. **Domain separation**: Verify chain ID byte (0x02) is prepended
3. **Message structure**: Must follow action/nonce/payload/timestamp format
4. **Key derivation**: Ensure correct private key seed (first 32 bytes)

### "Request timestamp expired" Error

1. **Clock sync**: Ensure system clock is accurate
2. **Timezone**: Use UTC timestamps
3. **Units**: Timestamp must be in seconds, not milliseconds

### L2 Connection Errors

1. **L2 server running**: Verify L2 backend is running on port 1234
2. **Balance check**: Ensure sufficient L2 balance
3. **Network**: Check firewall and connectivity

## Related Endpoints

- **POST /api/bridge/initiate** - Bridge L1 → L2 (deposit)
- **POST /withdraw/complete** - Complete withdrawal (dealer only)
- **GET /withdraw/status/:id** - Check withdrawal status
- **GET /withdraw/pending/:address** - Get pending withdrawals

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_L2_API_URL=http://localhost:1234
NEXT_PUBLIC_L1_API_URL=http://localhost:8080
```

## Withdrawal Status Flow

```
┌──────────────┐
│   pending    │  ← Initial state after user request
└──────┬───────┘
       │
       │ Dealer processes
       │
       ▼
┌──────────────┐
│  processing  │  ← Dealer initiated L1 transaction
└──────┬───────┘
       │
       │ L1 transaction complete
       │
       ▼
┌──────────────┐
│  completed   │  ← Funds unlocked on L1
└──────────────┘
```

## Support

For issues or questions:
1. Check test script output for detailed errors
2. Review console logs in Next.js API route
3. Verify L2 backend logs
4. Ensure correct signature format and JSON sorting
5. Validate all dependencies are installed (`tweetnacl`)
