# Bridge Tests

This directory contains test scripts and examples for both Bridge endpoints:
- **L1 → L2 (Deposit)**: Lock tokens on L1, credit on L2
- **L2 → L1 (Withdrawal)**: Burn tokens on L2, unlock on L1

## Files

### Deposit (L1 → L2)

#### `test-bridge-initiate.js`
Comprehensive test suite that validates:
- ✅ Successful bridge requests via Next.js API
- ✅ Invalid signature rejection
- ✅ Expired timestamp rejection
- ✅ Direct L1 API access (optional)

#### `example-usage.js`
Simple, copy-paste ready example showing how to bridge tokens from L1 to L2.

### Withdrawal (L2 → L1)

#### `test-withdrawal.js`
Comprehensive test suite that validates:
- ✅ Successful withdrawal requests via Next.js API
- ✅ Invalid signature rejection
- ✅ Expired timestamp rejection
- ✅ Invalid amount rejection
- ✅ Direct L2 API access (optional)

#### `example-withdrawal.js`
Simple, copy-paste ready example showing how to withdraw tokens from L2 to L1.

## Prerequisites

1. **L1 Server Running** (for deposits)
   ```bash
   # L1 backend must be running on port 8080
   # Verify with:
   curl http://localhost:8080/health
   ```

2. **L2 Server Running** (for withdrawals)
   ```bash
   # L2 backend must be running on port 1234
   # Verify with:
   curl http://localhost:1234/health
   ```

3. **Next.js Development Server**
   ```bash
   npm run dev
   # Should be running on http://localhost:3000
   ```

4. **Test Wallet**
   - For deposits: Test wallet with L1 balance (address starts with "L1_")
   - For withdrawals: Test wallet with L2 balance (address starts with "L2_")
   - Get test accounts from `TEST_ACCOUNTS.txt`
  # or L2_YOUR_ADDRESS for withdrawals

# Linux/Mac
export TEST_PRIVATE_KEY="your_64_char_hex_private_key"
export TEST_WALLET_ADDRESS="L1_YOUR_ADDRESS"  # or L2_YOUR_ADDRESS for withdrawals
```

### Run Deposit Test Suite

```bash
node bridge-tests/test-bridge-initiate.js
```

### Run Withdrawal Test Suite

```bash
$env:TEST_WALLET_ADDRESS = "L2_YOUR_ADDRESS"  # Must be L2 address
node bridge-tests/test-withdrawal
export TEST_PRIVATE_KEY="your_64_char_hex_private_key"
export TEST_WALLET_ADDRESS="L1_YOUR_ADDRESS"
```

### Run Full Test Suite

```bash
node bridge-tests/test-bridge-initiate.js
```

Expected output:
```
═══════════════════════════════════════════════════════════════════════════════
BRIDGE L1 → L2 TEST SUITE
═══════════════════════════════════════════════════════════════════════════════

TEST 1: Bridge via Next.js API
───────────────────────────────
✅ Bridge request successful!
   Lock ID: lock_12345
   Amount: 100
   ...

TEST 3: Invalid Signature (Should Fail)
────────────────────────────────────────
✅ Test passed: Invalid signature was rejected (401)
   ...
Deposit Example

```bash
# Set your credentials
$env:PRIVATE_KEY = "your_private_key_hex"
$env:WALLET_ADDRESS = "L1_YOUR_ADDRESS"

# Run deposit example
node bridge-tests/example-usage.js
```

### Run Withdrawal Example

```bash
# Set your credentials
$env:PRIVATE_KEY = "your_private_key_hex"
$env:WALLET_ADDRESS = "L2_YOUR_ADDRESS"

# Run withdrawal example
node bridge-tests/example-withdrawal
```bash
# Set your credentials
$env:PRIVATE_KEY = "your_private_key_hex"
$env:WALLET_ADDRESS = "L1_YOUR_ADDRESS"

# Run the example
node bridge-tests/example-usage.js
```

## Quick Start Example

```javascript
import nacl from 'tweetnacl'
import crypto from 'crypto'

async function bridgeToL2(privateKeyHex, walletAddress, amount) {
  // 1. Create payload
  const payload = JSON.stringify({ amount, target_layer: "L2" })
  
  // 2. Generate metadata
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomUUID()
  
  // 3. Construct and sign message
  const message = `${payload}\n${timestamp}\n${nonce}`
  const chainIdByte = Buffer.from([1])  // L1
  const messageToSign = Buffer.concat([
    chainIdByte,
    Buffer.from(message, 'utf-8')
  ])
  
  const privateKey = Buffer.from(privateKeyHex, 'hex')
  const keypair = nacl.sign.keyPair.fromSeed(privateKey.slice(0, 32))
  const signature = nacl.sign.detached(messageToSign, keypair.secretKey)
  
  // 4. Send request
  const response = await fetch('http://localhost:3000/api/bridge/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload,
      public_key: Buffer.from(keypair.publicKey).toString('hex'),
      wallet_address: walletAddress,
      signature: Buffer.from(signature).toString('hex'),
      nonce,
      timestamp,
      chain_id: 1
    })
  })
  
  return await response.json()
}

// Usage
const result = await bridgeToL2('your_private_key', 'L1_ADDRESS', 100)
console.log('Lock ID:', result.lock_id)
```

## Test Scenarios

### 1. Valid Bridge Request
- Creates properly signed request
- Should return 200 with lock_id
- Tokens locked on L1
- L2 credit pending

### 2. Invalid Signature
- Tampers with signature
- Should return 401 Unauthorized
- Request rejected

### 3. Expired Timestamp
- Uses old timestamp (> 5 minutes)
- Should return 400 Bad Request
- Request rejected

### 4. Missing Fields
- Omits required fields
- Should return 400 Bad Request
- Request rejected

## Troubleshooting

### "Connection refused" Error

**Problem**: L1 server not running

**Solution**:
```bash
# Start L1 server
cd path/to/l1/server
cargo run --release
# or
./l1_server
```

### "Invalid signature" Error

**Problem**: Signature verification failed

**Common causes**:
1. Wrong private key
2. Incorrect message format
3. Missing domain separation (chain ID byte)
4. Wrong key derivation

**Debug steps**:
```javascript
// Verify your message format
console.log('Message:', `${payload}\n${timestamp}\n${nonce}`)

// Check chain ID byte
console.log('Chain ID byte:', Buffer.from([1]))

// Verify key pair
const keypair = nacl.sign.keyPair.fromSeed(privateKey.slice(0, 32))
console.log('Public key:', Buffer.from(keypair.publicKey).toString('hex'))
```

### "Timestamp expired" Error

**Problem**: Request timestamp too old

**Solution**:
- Check system clock is accurate
- Use `Math.floor(Date.now() / 1000)` for current timestamp
- Ensure timestamp is in seconds, not milliseconds

### L1 Balance Insufficient

**Problem**: Not enough tokens on L1

**Solution**:
1. Check L1 balance:
   ```bash
   curl http://localhost:8080/balance/YOUR_ADDRESS
   ```

2. Get test tokens (if available):
   ```bash
   curl -X POST http://localhost:8080/faucet \
     -H "Content-Type: application/json" \
     -d '{"address":"YOUR_ADDRESS","amount":1000}'
   ```

## API Response Examples

### Success Response
```json
{
  "success": true,
  "lock_id": "lock_12345",
  "amount": 100,
  "wallet_address": "L1_YOUR_ADDRESS",
  "target_layer": "L2",
  "timestamp": 1769313445,
  "message": "Tokens locked on L1. L2 credit will be processed automatically."
}
```

### Error Responses

**Invalid Signature (401)**:
```json
{
  "error": "Invalid signature"
}
```

**Expired Timestamp (400)**:
```json
{
  "error": "Request timestamp expired (max 5 minutes)"
}
```

**Missing Fields (400)**:
```json
{
  "error": "Missing required fields in signed request"
}
```

**L1 Server Error (500)**:
```json
{
  "error": "L1 bridge operation failed",
  "details": "Insufficient balance"
}
```

## Integration with Frontend

### Using the Unified SDK

```javascript
import { UnifiedDealerSDK } from '../sdk/unified-dealer-sdk.js'

const sdk = new UnifiedDealerSDK({
  privateKey: userPrivateKey,
  address: userAddress,
  l1Url: 'http://localhost:8080',
  l2Url: 'http://localhost:1234'
})

// Bridge tokens
const result = await sdk.bridgeToL2(100)
console.log('Lock ID:', result.lock.lock_id)
```

### Using React Context

```javascript
import { useCreditPrediction } from '../contexts/CreditPredictionContext'

function BridgeComponent() {
  const { bridge, getL1Balance, balance } = useCreditPrediction()
  
  const handleBridge = async () => {
    try {
      const result = await bridge(100)
      console.log('Bridge successful:', result.lockId)
    } catch (error) {
      console.error('Bridge failed:', error)
    }
  }
  
  return <button onClick={handleBridge}>Bridge 100 Tokens</button>
}
```

## Security Notes

1. **Never commit private keys** to version control
2. **Use environment variables** for sensitive data
3. **Validate all inputs** on both client and server
4. **Implement rate limiting** to prevent abuse
5. **Monitor for replay attacks** using nonce tracking
6. **Use HTTPS** in production

## Further Documentation

- [BRIDGE-L1-L2-ENDPOINT.md](../BRIDGE-L1-L2-ENDPOINT.md) - Complete API documentation
- [next-steps-integration-guide.md](../next-steps-integration-guide.md) - Integration guide
- [TEST_ACCOUNTS.txt](../TEST_ACCOUNTS.txt) - Test account credentials

## Support

For issues or questions:
1. Check test output for detailed error messages
2. Review Next.js API logs: `npm run dev`
3. Check L1 server logs
4. Verify all dependencies are installed
5. Ensure correct environment variables are set
