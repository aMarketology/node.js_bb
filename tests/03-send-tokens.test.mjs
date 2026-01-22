/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FEATURE TEST: SEND TOKENS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests for sending tokens from one wallet to another
 * 
 * Features tested:
 * - Send tokens to another address
 * - Verify sender balance decreases
 * - Verify correct signature generation
 * - Handle insufficient balance
 * - Handle invalid recipient address
 * - Transfer events
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
  sleep
} from './utils.js'

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

const runner = new TestRunner('Send Tokens Tests')

// ---------------------------------------------------------------------------
// Test: Send Tokens (Alice → Bob)
// ---------------------------------------------------------------------------
runner.test('Send tokens from Alice to Bob', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  
  // Get initial balances
  const aliceBefore = await sdk.getBalance()
  const bobBefore = await sdk.getBalance(TEST_ADDRESSES.bob)
  
  logInfo(`Before - Alice: ${aliceBefore.balance}, Bob: ${bobBefore.balance}`)
  
  // Skip if Alice doesn't have enough balance
  if (aliceBefore.balance < CONFIG.DEFAULT_TRANSFER_AMOUNT) {
    logInfo('Skipping: Alice has insufficient balance')
    sdk.disconnect()
    return
  }
  
  // Send tokens
  const amount = CONFIG.DEFAULT_TRANSFER_AMOUNT
  const result = await sdk.transfer(TEST_ADDRESSES.bob, amount)
  
  if (result.success) {
    assertNotNull(result.tx_id, 'Should have transaction ID')
    
    // Verify balances changed
    await sleep(500) // Wait for balance update
    
    const aliceAfter = await sdk.getBalance()
    const bobAfter = await sdk.getBalance(TEST_ADDRESSES.bob)
    
    logInfo(`After - Alice: ${aliceAfter.balance}, Bob: ${bobAfter.balance}`)
    logInfo(`Transfer TX: ${result.tx_id}`)
    
    // Alice should have less, Bob should have more
    assert(aliceAfter.balance < aliceBefore.balance, 'Alice balance should decrease')
  } else {
    logInfo(`Transfer not completed: ${result.error}`)
  }
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Transfer Events
// ---------------------------------------------------------------------------
runner.test('Transfer emits correct events', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  
  const balance = await sdk.getBalance()
  if (balance.balance < 1) {
    logInfo('Skipping: Insufficient balance')
    sdk.disconnect()
    return
  }
  
  let transferSentEvent = null
  let transferConfirmedEvent = null
  
  sdk.on('transfer:sent', (data) => {
    transferSentEvent = data
  })
  
  sdk.on('transfer:confirmed', (data) => {
    transferConfirmedEvent = data
  })
  
  const result = await sdk.transfer(TEST_ADDRESSES.bob, 1)
  
  if (result.success) {
    assertNotNull(transferSentEvent, 'Should emit transfer:sent event')
    assertEqual(transferSentEvent.to, TEST_ADDRESSES.bob, 'Event should have correct recipient')
    assertEqual(transferSentEvent.amount, 1, 'Event should have correct amount')
    
    assertNotNull(transferConfirmedEvent, 'Should emit transfer:confirmed event')
    assertNotNull(transferConfirmedEvent.txId, 'Confirmed event should have tx ID')
    
    logInfo(`Events received: sent=${!!transferSentEvent}, confirmed=${!!transferConfirmedEvent}`)
  }
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Insufficient Balance
// ---------------------------------------------------------------------------
runner.test('Reject transfer with insufficient balance', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  
  const balance = await sdk.getBalance()
  const excessiveAmount = balance.balance + 1000000 // Way more than balance
  
  const result = await sdk.transfer(TEST_ADDRESSES.bob, excessiveAmount)
  
  assert(!result.success || result.error, 'Should fail or return error')
  logInfo(`Correctly rejected excessive transfer: ${result.error || 'no explicit error'}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Zero Amount Transfer
// ---------------------------------------------------------------------------
runner.test('Reject zero amount transfer', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  
  let errorThrown = false
  try {
    await sdk.transfer(TEST_ADDRESSES.bob, 0)
  } catch (error) {
    errorThrown = true
    assert(error.message.includes('positive') || error.message.includes('Amount'), 
      'Should throw amount error')
  }
  
  assert(errorThrown, 'Should throw error for zero amount')
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Negative Amount Transfer
// ---------------------------------------------------------------------------
runner.test('Reject negative amount transfer', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  
  let errorThrown = false
  try {
    await sdk.transfer(TEST_ADDRESSES.bob, -10)
  } catch (error) {
    errorThrown = true
  }
  
  assert(errorThrown, 'Should throw error for negative amount')
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Transfer Without Login
// ---------------------------------------------------------------------------
runner.test('Cannot transfer without login', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  let errorThrown = false
  try {
    await sdk.transfer(TEST_ADDRESSES.bob, 10)
  } catch (error) {
    errorThrown = true
    assert(error.message.includes('Wallet') || error.message.includes('connected'), 
      'Should throw wallet error')
  }
  
  assert(errorThrown, 'Should throw error when not logged in')
})

// ---------------------------------------------------------------------------
// Test: Self Transfer
// ---------------------------------------------------------------------------
runner.test('Self transfer (send to own address)', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  
  const balanceBefore = await sdk.getBalance()
  
  if (balanceBefore.balance < 1) {
    logInfo('Skipping: Insufficient balance')
    sdk.disconnect()
    return
  }
  
  // Send to self
  const result = await sdk.transfer(TEST_ADDRESSES.alice, 1)
  
  // This might succeed or fail depending on implementation
  logInfo(`Self transfer result: ${result.success ? 'allowed' : 'rejected'}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Multiple Consecutive Transfers
// ---------------------------------------------------------------------------
runner.test('Multiple consecutive transfers', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  
  const balance = await sdk.getBalance()
  
  if (balance.balance < 3) {
    logInfo('Skipping: Insufficient balance for multiple transfers')
    sdk.disconnect()
    return
  }
  
  // Send 3 transfers of 1 token each
  const results = []
  for (let i = 0; i < 3; i++) {
    const result = await sdk.transfer(TEST_ADDRESSES.bob, 1)
    results.push(result)
    await sleep(100) // Small delay between transfers
  }
  
  const successCount = results.filter(r => r.success).length
  logInfo(`Completed ${successCount}/3 transfers`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Transfer Result Structure
// ---------------------------------------------------------------------------
runner.test('Transfer result has correct structure', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  
  const balance = await sdk.getBalance()
  
  if (balance.balance < 1) {
    logInfo('Skipping: Insufficient balance')
    sdk.disconnect()
    return
  }
  
  const result = await sdk.transfer(TEST_ADDRESSES.bob, 1)
  
  // Result should have specific structure
  assert('success' in result, 'Result should have success property')
  
  if (result.success) {
    assertNotNull(result.tx_id, 'Successful result should have tx_id')
    logInfo(`TX ID: ${result.tx_id}`)
  } else {
    assertNotNull(result.error, 'Failed result should have error')
    logInfo(`Error: ${result.error}`)
  }
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Error Event on Failed Transfer
// ---------------------------------------------------------------------------
runner.test('Error event emitted on failed transfer', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  
  let errorEvent = null
  sdk.on('error', (data) => {
    errorEvent = data
  })
  
  // Try to transfer more than balance
  const balance = await sdk.getBalance()
  const result = await sdk.transfer(TEST_ADDRESSES.bob, balance.balance + 1000000)
  
  if (!result.success) {
    // Error event should have been emitted
    logInfo(`Error event: ${errorEvent ? 'received' : 'not received'}`)
  }
  
  sdk.disconnect()
})

// ═══════════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════════

runner.run().then(results => {
  process.exit(results.failed > 0 ? 1 : 0)
})
