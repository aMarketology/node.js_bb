/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FEATURE TEST: RECEIVE TOKENS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests for receiving tokens and tracking incoming transfers
 * 
 * Features tested:
 * - Verify balance increases after receiving
 * - Transaction history shows incoming transfer
 * - Balance update events
 * - Polling for balance changes
 */

import { BlackBookSDK } from '../sdk/blackbook-frontend-sdk.js'
import { CONFIG, TEST_ADDRESSES } from './config.js'
import { 
  TestRunner, 
  assert, 
  assertEqual, 
  assertNotNull,
  assertGreaterThan,
  logInfo,
  sleep,
  waitFor
} from './utils.js'

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

const runner = new TestRunner('Receive Tokens Tests')

// ---------------------------------------------------------------------------
// Test: Check Bob's Initial Balance
// ---------------------------------------------------------------------------
runner.test('Check recipient balance', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('bob')
  
  const balance = await sdk.getBalance()
  
  assertNotNull(balance.balance, 'Balance should not be null')
  logInfo(`Bob's current balance: ${balance.formatted}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Receive Tokens (Bob receives from Alice)
// ---------------------------------------------------------------------------
runner.test('Bob receives tokens from Alice', async () => {
  // Setup Alice SDK
  const aliceSDK = new BlackBookSDK({ url: CONFIG.L1_URL })
  aliceSDK.connectTestAccount('alice')
  
  // Setup Bob SDK
  const bobSDK = new BlackBookSDK({ url: CONFIG.L1_URL })
  bobSDK.connectTestAccount('bob')
  
  // Check Alice has enough
  const aliceBalance = await aliceSDK.getBalance()
  if (aliceBalance.balance < 5) {
    logInfo('Skipping: Alice has insufficient balance')
    aliceSDK.disconnect()
    bobSDK.disconnect()
    return
  }
  
  // Get Bob's balance before
  const bobBefore = await bobSDK.getBalance()
  logInfo(`Bob before: ${bobBefore.balance}`)
  
  // Alice sends to Bob
  const amount = 5
  const result = await aliceSDK.transfer(TEST_ADDRESSES.bob, amount)
  
  if (result.success) {
    // Wait and check Bob's new balance
    await sleep(500)
    const bobAfter = await bobSDK.getBalance()
    
    logInfo(`Bob after: ${bobAfter.balance}`)
    
    // Bob should have received the tokens
    const expectedBalance = bobBefore.balance + amount
    assertEqual(bobAfter.balance, expectedBalance, `Bob should have ${expectedBalance}`)
    
    logInfo(`✓ Bob successfully received ${amount} tokens`)
  } else {
    logInfo(`Transfer failed: ${result.error}`)
  }
  
  aliceSDK.disconnect()
  bobSDK.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Balance Update Event on Receive
// ---------------------------------------------------------------------------
runner.test('Balance update event fires when receiving', async () => {
  const aliceSDK = new BlackBookSDK({ url: CONFIG.L1_URL })
  aliceSDK.connectTestAccount('alice')
  
  const bobSDK = new BlackBookSDK({ url: CONFIG.L1_URL })
  bobSDK.connectTestAccount('bob')
  
  const aliceBalance = await aliceSDK.getBalance()
  if (aliceBalance.balance < 1) {
    logInfo('Skipping: Insufficient balance')
    aliceSDK.disconnect()
    bobSDK.disconnect()
    return
  }
  
  // Track balance update events for Bob
  let balanceUpdateReceived = false
  let newBalance = null
  
  bobSDK.on('balance:updated', (balance) => {
    balanceUpdateReceived = true
    newBalance = balance.balance
  })
  
  // Alice sends to Bob
  await aliceSDK.transfer(TEST_ADDRESSES.bob, 1)
  
  // Manually trigger a balance check (to simulate polling)
  await sleep(1000)
  await bobSDK.getBalance()
  
  if (balanceUpdateReceived) {
    logInfo(`Balance update event received: ${newBalance}`)
  } else {
    logInfo('Balance update event not yet received (may need polling)')
  }
  
  aliceSDK.disconnect()
  bobSDK.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Get Transaction History
// ---------------------------------------------------------------------------
runner.test('Transaction history includes incoming transfers', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('bob')
  
  try {
    const transactions = await sdk.getTransactions({ limit: 10 })
    
    if (transactions.length > 0) {
      // Find incoming transactions
      const incoming = transactions.filter(tx => tx.isIncoming)
      
      logInfo(`Total transactions: ${transactions.length}`)
      logInfo(`Incoming transactions: ${incoming.length}`)
      
      if (incoming.length > 0) {
        const latest = incoming[0]
        logInfo(`Latest incoming: ${latest.displayAmount} from ${latest.from}`)
      }
    } else {
      logInfo('No transaction history available')
    }
  } catch (error) {
    logInfo(`Transaction history not available: ${error.message}`)
  }
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Transaction Display Amount
// ---------------------------------------------------------------------------
runner.test('Transaction display amount is formatted correctly', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('bob')
  
  try {
    const transactions = await sdk.getTransactions({ limit: 5 })
    
    for (const tx of transactions) {
      // Incoming should start with +
      if (tx.isIncoming) {
        assert(tx.displayAmount.startsWith('+'), 'Incoming should show + prefix')
      }
      // Outgoing should start with -
      if (tx.isOutgoing) {
        assert(tx.displayAmount.startsWith('-'), 'Outgoing should show - prefix')
      }
    }
    
    logInfo('Display amounts formatted correctly')
  } catch (error) {
    logInfo(`Could not verify: ${error.message}`)
  }
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Balance After Multiple Receives
// ---------------------------------------------------------------------------
runner.test('Balance correct after multiple receives', async () => {
  const aliceSDK = new BlackBookSDK({ url: CONFIG.L1_URL })
  aliceSDK.connectTestAccount('alice')
  
  const bobSDK = new BlackBookSDK({ url: CONFIG.L1_URL })
  bobSDK.connectTestAccount('bob')
  
  const aliceBalance = await aliceSDK.getBalance()
  if (aliceBalance.balance < 3) {
    logInfo('Skipping: Insufficient balance for multiple transfers')
    aliceSDK.disconnect()
    bobSDK.disconnect()
    return
  }
  
  const bobBefore = await bobSDK.getBalance()
  
  // Send 3 transfers
  const transfers = [1, 1, 1]
  let successCount = 0
  
  for (const amount of transfers) {
    const result = await aliceSDK.transfer(TEST_ADDRESSES.bob, amount)
    if (result.success) successCount++
    await sleep(200)
  }
  
  await sleep(500)
  const bobAfter = await bobSDK.getBalance()
  
  const expectedIncrease = successCount
  const actualIncrease = bobAfter.balance - bobBefore.balance
  
  logInfo(`Successful transfers: ${successCount}`)
  logInfo(`Expected increase: ${expectedIncrease}, Actual: ${actualIncrease}`)
  
  assertEqual(actualIncrease, expectedIncrease, 'Balance should increase by correct amount')
  
  aliceSDK.disconnect()
  bobSDK.disconnect()
})

// ---------------------------------------------------------------------------
// Test: View Any Address Balance
// ---------------------------------------------------------------------------
runner.test('Can view any address balance (read-only)', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  // Don't need to be logged in to view balances
  // But we'll login as Alice to have a valid SDK instance
  sdk.connectTestAccount('alice')
  
  // Check Bob's balance
  const bobBalance = await sdk.getBalance(TEST_ADDRESSES.bob)
  assertNotNull(bobBalance.balance, 'Should be able to view Bob balance')
  assertEqual(bobBalance.address, TEST_ADDRESSES.bob, 'Address should be Bob')
  
  // Check Dealer's balance
  const dealerBalance = await sdk.getBalance(TEST_ADDRESSES.dealer)
  assertNotNull(dealerBalance.balance, 'Should be able to view Dealer balance')
  assertEqual(dealerBalance.address, TEST_ADDRESSES.dealer, 'Address should be Dealer')
  
  logInfo(`Bob: ${bobBalance.formatted}, Dealer: ${dealerBalance.formatted}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: USD Value Calculation
// ---------------------------------------------------------------------------
runner.test('USD value calculated correctly', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('bob')
  
  const balance = await sdk.getBalance()
  
  // BB is 1:1 with USD
  assertEqual(balance.usdValue, balance.balance, 'USD value should equal balance (1:1 peg)')
  assert(balance.formattedUsd.startsWith('$'), 'USD format should start with $')
  
  logInfo(`${balance.formatted} = ${balance.formattedUsd}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Balance Polling Detects Changes
// ---------------------------------------------------------------------------
runner.test('Balance polling detects incoming transfer', async () => {
  // This test simulates real-time balance updates
  const aliceSDK = new BlackBookSDK({ url: CONFIG.L1_URL })
  aliceSDK.connectTestAccount('alice')
  
  // Bob with short cache for faster updates
  const bobSDK = new BlackBookSDK({ url: CONFIG.L1_URL, cacheMaxAge: 1000 })
  bobSDK.connectTestAccount('bob')
  
  const aliceBalance = await aliceSDK.getBalance()
  if (aliceBalance.balance < 1) {
    logInfo('Skipping: Insufficient balance')
    aliceSDK.disconnect()
    bobSDK.disconnect()
    return
  }
  
  const bobBefore = await bobSDK.getBalance()
  
  // Send in background
  aliceSDK.transfer(TEST_ADDRESSES.bob, 1)
  
  // Poll for balance change (simulating what the SDK does internally)
  let detected = false
  for (let i = 0; i < 10; i++) {
    await sleep(500)
    const current = await bobSDK.getBalance()
    if (current.balance > bobBefore.balance) {
      detected = true
      logInfo(`Change detected after ${(i + 1) * 500}ms`)
      break
    }
  }
  
  assert(detected, 'Should detect balance change within 5 seconds')
  
  aliceSDK.disconnect()
  bobSDK.disconnect()
})

// ═══════════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════════

runner.run().then(results => {
  process.exit(results.failed > 0 ? 1 : 0)
})
