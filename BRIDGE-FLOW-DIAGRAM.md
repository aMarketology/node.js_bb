# Bridge L1 → L2 Flow Diagram

## Complete Bridge Operation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER / CLIENT BROWSER                           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ 1. Generate Signed Request
                             │    • Create payload: {amount, target_layer}
                             │    • Generate timestamp & nonce
                             │    • Sign with Ed25519 + chain ID byte
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   NEXT.JS API: /api/bridge/initiate                     │
│                      (localhost:3000)                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  2. Validate Request                                                    │
│     ✓ Check all required fields                                        │
│     ✓ Validate chain_id = 1                                            │
│     ✓ Check timestamp (within 5 min)                                   │
│     ✓ Verify hex lengths (pk=64, sig=128)                              │
│     ✓ Parse payload JSON                                               │
│     ✓ Validate amount > 0 & target="L2"                                │
│                                                                          │
│  3. Verify Ed25519 Signature                                           │
│     • Reconstruct message: payload\ntimestamp\nnonce                   │
│     • Prepend chain ID byte: [0x01]                                    │
│     • Verify with tweetnacl                                            │
│                                                                          │
│     ❌ Invalid? → Return 401                                            │
│     ✓ Valid? → Continue                                                │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ 4. Forward to L1 Backend
                             │    POST /bridge/initiate
                             │    {wallet_address, amount, ...}
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    L1 BACKEND SERVER (Rust/Go?)                         │
│                      (localhost:8080)                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  5. Lock Tokens on L1                                                  │
│     • Check user L1 balance                                            │
│     • Lock specified amount                                            │
│     • Generate lock_id                                                 │
│     • Record lock in database                                          │
│     • Emit BridgeLock event                                            │
│                                                                          │
│  6. Return lock_id                                                     │
│     {                                                                   │
│       "lock_id": "lock_12345",                                         │
│       "status": "locked",                                              │
│       "amount": 100                                                    │
│     }                                                                   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ 7. L1→L2 Communication
                             │    (Automatic / Oracle / Bridge Service)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    L2 BACKEND SERVER (Rust)                             │
│                      (localhost:1234)                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  8. Credit Tokens on L2                                                │
│     • Verify lock_id from L1                                           │
│     • Credit user L2 balance                                           │
│     • Record credit in ledger                                          │
│     • Update user session (if active)                                  │
│                                                                          │
│  9. User can now bet on L2                                             │
│     • Place bets                                                       │
│     • Buy/sell positions                                               │
│     • Use L2 balance                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Signature Generation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  INPUT                                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  • Private Key (32 bytes / 64 hex chars)                               │
│  • Amount: 100                                                         │
│  • Target: "L2"                                                        │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Create Payload                                                │
├─────────────────────────────────────────────────────────────────────────┤
│  payload = JSON.stringify({ amount: 100, target_layer: "L2" })        │
│  → {"amount":100,"target_layer":"L2"}                                 │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Generate Metadata                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  timestamp = Math.floor(Date.now() / 1000)  → 1769313445              │
│  nonce = crypto.randomUUID()                → "550e8400-..."           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Construct Message                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  message = `${payload}\n${timestamp}\n${nonce}`                        │
│                                                                          │
│  → {"amount":100,"target_layer":"L2"}                                 │
│     1769313445                                                          │
│     550e8400-e29b-41d4-a716-446655440000                                │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Domain Separation                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  chainIdByte = Buffer.from([1])  → 0x01                                │
│  messageBuffer = Buffer.from(message, 'utf-8')                         │
│  messageToSign = Buffer.concat([chainIdByte, messageBuffer])           │
│                                                                          │
│  → [0x01] + message bytes                                              │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Ed25519 Signing                                               │
├─────────────────────────────────────────────────────────────────────────┤
│  privateKey = Buffer.from(privateKeyHex, 'hex')                        │
│  keypair = nacl.sign.keyPair.fromSeed(privateKey.slice(0, 32))        │
│  signature = nacl.sign.detached(messageToSign, keypair.secretKey)      │
│                                                                          │
│  → 64 bytes / 128 hex chars                                            │
│     "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4..."                      │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  OUTPUT: SignedRequest                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  {                                                                      │
│    payload: "{\"amount\":100,\"target_layer\":\"L2\"}",              │
│    public_key: "a1b2c3d4e5f6..." (64 hex),                            │
│    wallet_address: "L1_YOUR_ADDRESS",                                  │
│    signature: "e5f6a7b8c9d0..." (128 hex),                            │
│    nonce: "550e8400-e29b-41d4-a716-446655440000",                      │
│    timestamp: 1769313445,                                              │
│    chain_id: 1                                                         │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Validation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Signed Request Received                                               │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ All fields     │ NO  ──→  400 Bad Request
                    │ present?       │           "Missing required fields"
                    └────────┬───────┘
                             │ YES
                             ▼
                    ┌────────────────┐
                    │ chain_id = 1?  │ NO  ──→  400 Bad Request
                    │                │           "Invalid chain_id"
                    └────────┬───────┘
                             │ YES
                             ▼
                    ┌────────────────┐
                    │ Timestamp      │ NO  ──→  400 Bad Request
                    │ within 5 min?  │           "Timestamp expired"
                    └────────┬───────┘
                             │ YES
                             ▼
                    ┌────────────────┐
                    │ public_key     │ NO  ──→  400 Bad Request
                    │ length = 64?   │           "Invalid public_key length"
                    └────────┬───────┘
                             │ YES
                             ▼
                    ┌────────────────┐
                    │ signature      │ NO  ──→  400 Bad Request
                    │ length = 128?  │           "Invalid signature length"
                    └────────┬───────┘
                             │ YES
                             ▼
                    ┌────────────────┐
                    │ Valid JSON     │ NO  ──→  400 Bad Request
                    │ payload?       │           "Invalid JSON"
                    └────────┬───────┘
                             │ YES
                             ▼
                    ┌────────────────┐
                    │ amount > 0?    │ NO  ──→  400 Bad Request
                    │                │           "Invalid amount"
                    └────────┬───────┘
                             │ YES
                             ▼
                    ┌────────────────┐
                    │ target = "L2"? │ NO  ──→  400 Bad Request
                    │                │           "Invalid target_layer"
                    └────────┬───────┘
                             │ YES
                             ▼
                    ┌────────────────┐
                    │ Valid Ed25519  │ NO  ──→  401 Unauthorized
                    │ signature?     │           "Invalid signature"
                    └────────┬───────┘
                             │ YES
                             ▼
                    ┌────────────────┐
                    │ Forward to L1  │
                    │ Backend        │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ L1 Success?    │ NO  ──→  500 Internal Error
                    │                │           "L1 operation failed"
                    └────────┬───────┘
                             │ YES
                             ▼
                    ┌────────────────┐
                    │ 200 Success    │
                    │ {lock_id, ...} │
                    └────────────────┘
```

## Error Handling Flow

```
┌────────────┬─────────────┬──────────────────────────────────────────────┐
│   Status   │    Error    │               Description                    │
├────────────┼─────────────┼──────────────────────────────────────────────┤
│    400     │ Missing     │ One or more required fields not provided     │
│            │ fields      │                                              │
├────────────┼─────────────┼──────────────────────────────────────────────┤
│    400     │ Invalid     │ chain_id must be 1 for L1                   │
│            │ chain_id    │                                              │
├────────────┼─────────────┼──────────────────────────────────────────────┤
│    400     │ Timestamp   │ Request older than 5 minutes                 │
│            │ expired     │                                              │
├────────────┼─────────────┼──────────────────────────────────────────────┤
│    400     │ Invalid hex │ public_key or signature wrong length         │
│            │ length      │                                              │
├────────────┼─────────────┼──────────────────────────────────────────────┤
│    400     │ Invalid     │ Payload is not valid JSON                    │
│            │ JSON        │                                              │
├────────────┼─────────────┼──────────────────────────────────────────────┤
│    400     │ Invalid     │ Amount must be positive number               │
│            │ amount      │                                              │
├────────────┼─────────────┼──────────────────────────────────────────────┤
│    400     │ Invalid     │ target_layer must be "L2"                    │
│            │ target      │                                              │
├────────────┼─────────────┼──────────────────────────────────────────────┤
│    401     │ Invalid     │ Ed25519 signature verification failed        │
│            │ signature   │                                              │
├────────────┼─────────────┼──────────────────────────────────────────────┤
│    500     │ L1 error    │ L1 backend returned error                    │
│            │             │ (insufficient balance, connection, etc.)     │
├────────────┼─────────────┼──────────────────────────────────────────────┤
│    500     │ Internal    │ Unexpected server error                      │
│            │ error       │                                              │
└────────────┴─────────────┴──────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Transport Security                                           │
│  • HTTPS in production                                                 │
│  • Encrypted network traffic                                           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: Domain Separation                                            │
│  • Chain ID byte prevents cross-chain replay                           │
│  • L1 (0x01) ≠ L2 (0x02)                                              │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: Timestamp Validation                                         │
│  • 5-minute window                                                     │
│  • Prevents replay of old signatures                                   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: Nonce Protection                                             │
│  • Unique identifier (UUID)                                            │
│  • Should be tracked to prevent duplicates                             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 5: Cryptographic Signature                                      │
│  • Ed25519 signature verification                                      │
│  • Proves ownership of private key                                     │
│  • Cannot be forged                                                    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 6: Input Validation                                             │
│  • Amount checks                                                       │
│  • Target validation                                                   │
│  • Hex length verification                                             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 7: L1 Balance Verification                                      │
│  • L1 backend checks actual balance                                    │
│  • Prevents overdraft                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Timeline Example

```
T=0s    User clicks "Bridge 100 tokens"
        ↓
T=0.1s  Generate timestamp, nonce, sign request
        ↓
T=0.2s  POST /api/bridge/initiate
        ↓
T=0.3s  Next.js validates signature
        ↓
T=0.4s  Forward to L1 backend
        ↓
T=0.5s  L1 locks tokens, returns lock_id
        ↓
T=0.6s  Response sent back to user
        ↓
T=0.7s  UI updates: "Tokens locked on L1"
        ↓
T=1.0s  L2 backend detects new lock
        ↓
T=1.5s  L2 credits user balance
        ↓
T=2.0s  UI refreshes, shows new L2 balance
        ↓
        ✓ Bridge complete!
```

## Data Flow

```
┌─────────────┐
│   Private   │
│     Key     │ (stays in browser/client)
└──────┬──────┘
       │
       │ Signs message
       │
       ▼
┌─────────────┐        ┌─────────────┐
│  Signature  │ ────→  │   Public    │
│ (128 hex)   │        │     Key     │
└──────┬──────┘        │  (64 hex)   │
       │               └──────┬──────┘
       │                      │
       │  Both sent           │
       └──────────┬───────────┘
                  │
                  ▼
          ┌──────────────┐
          │  Next.js API │
          └──────┬───────┘
                 │
                 │ Verifies signature
                 │ using public key
                 │
                 ▼
          ┌──────────────┐
          │  L1 Backend  │
          └──────┬───────┘
                 │
                 │ Locks tokens
                 │
                 ▼
          ┌──────────────┐
          │   lock_id    │
          │   returned   │
          └──────────────┘
```
