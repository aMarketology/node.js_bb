# BlackBook Prediction Market - Test Suite

A comprehensive test suite for the prediction market platform, organized by feature.

## 📁 Test Structure

```
tests/
├── config.js                    # Shared configuration & test accounts
├── utils.js                     # Test utilities & assertion helpers
├── run-all.js                   # Test runner script
│
├── 01-wallet-generate.test.js   # Wallet creation tests
├── 02-wallet-login.test.js      # Login/authentication tests
├── 03-send-tokens.test.js       # Token transfer (sending) tests
├── 04-receive-tokens.test.js    # Token transfer (receiving) tests
├── 05-place-bet.test.js         # Market betting tests
├── 06-payout-event.test.js      # Resolution & payout tests
└── 07-bridge-l1-l2.test.js      # L1↔L2 bridge tests
```

## 🚀 Running Tests

### Run All Tests
```bash
node tests/run-all.js
```

### Run Specific Feature Tests
```bash
# Wallet tests only
node tests/run-all.js wallet

# Betting tests only
node tests/run-all.js bet

# Bridge tests only
node tests/run-all.js bridge
```

### Quick Tests (skip slow integration tests)
```bash
node tests/run-all.js --quick
```

### Run Individual Test File
```bash
node tests/01-wallet-generate.test.js
node tests/05-place-bet.test.js
```

## 📋 Test Features

### 1. Wallet Generation (`01-wallet-generate.test.js`)
- ✅ Create random wallet
- ✅ Create multiple unique wallets
- ✅ Import wallet from seed
- ✅ Connect test accounts (Alice, Bob, Dealer)
- ✅ Disconnect wallet
- ✅ Get token info
- ✅ Event emission

### 2. Wallet Login (`02-wallet-login.test.js`)
- ✅ Server health check
- ✅ Login with credentials
- ✅ Fetch balance after login
- ✅ Switch between wallets
- ✅ Multiple SDK instances
- ✅ Session caching

### 3. Send Tokens (`03-send-tokens.test.js`)
- ✅ Send tokens to another address
- ✅ Transfer event emission
- ✅ Insufficient balance rejection
- ✅ Zero/negative amount validation
- ✅ Self-transfer handling
- ✅ Consecutive transfers

### 4. Receive Tokens (`04-receive-tokens.test.js`)
- ✅ Check current balance
- ✅ Receive from sender
- ✅ Balance update events
- ✅ Transaction history
- ✅ USD value calculation
- ✅ Polling balance detection

### 5. Place Bet (`05-place-bet.test.js`)
- ✅ Initialize Markets SDK
- ✅ Get available markets
- ✅ Get market details
- ✅ Get market prices
- ✅ Get bet quote
- ✅ Place bet on outcome
- ✅ Check position after bet
- ✅ CPMM price updates
- ✅ Sell shares
- ✅ Resolved market rejection

### 6. Payout Event (`06-payout-event.test.js`)
- ✅ Initialize Dealer SDK
- ✅ Get resolved markets
- ✅ Check winning outcome
- ✅ Dealer resolves market
- ✅ Winners receive payout
- ✅ Claim winnings
- ✅ Non-dealer resolution rejection
- ✅ Balance increases after claim

### 7. Bridge L1↔L2 (`07-bridge-l1-l2.test.js`)
- ✅ Initialize Bridge SDK
- ✅ Check L1 balance
- ✅ Check L2 balance
- ✅ Deposit L1 → L2
- ✅ Withdraw L2 → L1
- ✅ Open L2 session
- ✅ Get active sessions
- ✅ Settle L2 session
- ✅ Bridge transaction history
- ✅ Pending deposits/withdrawals

## ⚙️ Configuration

Test configuration is in `tests/config.js`:

```javascript
export const CONFIG = {
  L1_URL: 'http://localhost:3000',
  L2_URL: 'http://localhost:3001',
  TIMEOUT: 30000,
  DEFAULT_BET_AMOUNT: '10',
  // ...
}
```

### Test Accounts
Pre-configured test accounts with seeds:
- **Alice** - Standard user
- **Bob** - Second user for transfers
- **Charlie** - Third user for multi-user tests
- **Dealer** - Market operator/oracle

## 🧪 Test Utilities

The `utils.js` file provides:

### TestRunner Class
```javascript
const runner = new TestRunner('My Tests')
runner.test('test name', async () => { ... })
await runner.run()
```

### Assertions
```javascript
assert(condition, message)
assertEqual(actual, expected, message)
assertNotNull(value, message)
assertGreaterThan(a, b, message)
assertThrows(fn, message)
```

### Helpers
```javascript
sleep(ms)                    // Async delay
retry(fn, retries, delay)    // Retry with backoff
waitFor(fn, timeout)         // Wait for condition
generateUniqueId(prefix)     // Unique test IDs
```

## 📊 Output

Tests output results in a clear format:

```
╔════════════════════════════════════════════════════════════════════╗
║         BLACKBOOK PREDICTION MARKET TEST SUITE                     ║
╚════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════
  Running: 01-wallet-generate.test.js
═══════════════════════════════════════════════════════════════════════

✓ Create random wallet
✓ Create multiple unique wallets
✓ Import wallet from seed
...

═══════════════════════════════════════════════════════════════════════
                           TEST SUMMARY
═══════════════════════════════════════════════════════════════════════

  ✓ 01-wallet-generate
  ✓ 02-wallet-login
  ✓ 03-send-tokens
  ...

  Total:  7
  Passed: 7
  Failed: 0

  All tests passed! ✓
```

## 🔧 Adding New Tests

1. Create a new file following the naming convention: `XX-feature-name.test.js`
2. Import utilities from `./utils.js` and `./config.js`
3. Use the `TestRunner` class for organization
4. Add the file to `TEST_FILES` array in `run-all.js`

Example:
```javascript
import { TestRunner, assert, logInfo } from './utils.js'
import { CONFIG, TEST_SEEDS } from './config.js'

const runner = new TestRunner('My Feature Tests')

runner.test('My test case', async () => {
  // Test logic here
  assert(true, 'Should pass')
  logInfo('Test info message')
})

runner.run()
```

## 🛠️ Dependencies

- `tweetnacl` - Ed25519 signing for wallet authentication
- SDK files in `/sdk/` directory

## ⚠️ Notes

- Tests interact with local L1/L2 servers by default
- Some tests may be skipped if servers are unavailable
- Bridge tests may have delays due to confirmation times
- Use `--quick` flag for faster CI runs
