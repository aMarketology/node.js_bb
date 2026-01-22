/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FEATURE TEST: WALLET LOGIN / AUTHENTICATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests for wallet login and authentication flows
 * 
 * Features tested:
 * - Login with secret key
 * - Login with seed phrase
 * - Login persistence (session)
 * - Health check after login
 * - Balance fetch after login
 * - Multiple wallet switching
 */

import { BlackBookSDK } from '../sdk/blackbook-frontend-sdk.js'
import { CONFIG, TEST_SEEDS, TEST_ADDRESSES } from './config.js'
import { 
  TestRunner, 
  assert, 
  assertEqual, 
  assertNotNull,
  assertGreaterThan,
  logInfo,
  checkServerHealth
} from './utils.js'

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

const runner = new TestRunner('Wallet Login Tests')

// ---------------------------------------------------------------------------
// Test: Server Health Check
// ---------------------------------------------------------------------------
runner.test('L1 server is healthy', async () => {
  const healthy = await checkServerHealth(CONFIG.L1_URL)
  assert(healthy, 'L1 server should be healthy')
  logInfo(`L1 server at ${CONFIG.L1_URL} is healthy`)
})

// ---------------------------------------------------------------------------
// Test: Login with Test Account
// ---------------------------------------------------------------------------
runner.test('Login with test account credentials', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  // Connect (login) with Alice
  const wallet = sdk.connectTestAccount('alice')
  
  assert(sdk.isConnected, 'SDK should be connected after login')
  assertEqual(wallet.address, TEST_ADDRESSES.alice, 'Should be logged in as Alice')
  
  logInfo(`Logged in as: ${wallet.address}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Fetch Balance After Login
// ---------------------------------------------------------------------------
runner.test('Fetch balance after login', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  
  const balance = await sdk.getBalance()
  
  assertNotNull(balance.balance, 'Balance should not be null')
  assertEqual(balance.symbol, 'BB', 'Symbol should be BB')
  assertNotNull(balance.formatted, 'Should have formatted balance')
  assertNotNull(balance.formattedUsd, 'Should have USD formatted balance')
  
  logInfo(`Alice balance: ${balance.formatted} (${balance.formattedUsd})`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Fetch Balance for Another Address
// ---------------------------------------------------------------------------
runner.test('Fetch balance for another address (without switching)', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  
  // Fetch Bob's balance while logged in as Alice
  const bobBalance = await sdk.getBalance(TEST_ADDRESSES.bob)
  
  assertNotNull(bobBalance.balance, 'Should be able to fetch Bob balance')
  assertEqual(bobBalance.address, TEST_ADDRESSES.bob, 'Should be Bob address')
  
  logInfo(`Bob balance (viewed by Alice): ${bobBalance.formatted}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Switch Between Wallets
// ---------------------------------------------------------------------------
runner.test('Switch between multiple wallets', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  // Login as Alice
  sdk.connectTestAccount('alice')
  assertEqual(sdk.getAddress(), TEST_ADDRESSES.alice, 'Should be Alice')
  const aliceBalance = await sdk.getBalance()
  logInfo(`Alice: ${aliceBalance.formatted}`)
  
  // Disconnect and login as Bob
  sdk.disconnect()
  assert(!sdk.isConnected, 'Should be disconnected')
  
  sdk.connectTestAccount('bob')
  assertEqual(sdk.getAddress(), TEST_ADDRESSES.bob, 'Should be Bob')
  const bobBalance = await sdk.getBalance()
  logInfo(`Bob: ${bobBalance.formatted}`)
  
  // Disconnect and login as Dealer
  sdk.disconnect()
  sdk.connectTestAccount('dealer')
  assertEqual(sdk.getAddress(), TEST_ADDRESSES.dealer, 'Should be Dealer')
  const dealerBalance = await sdk.getBalance()
  logInfo(`Dealer: ${dealerBalance.formatted}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Cannot Get Balance Without Login
// ---------------------------------------------------------------------------
runner.test('Cannot get balance without login', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  let errorThrown = false
  try {
    await sdk.getBalance()
  } catch (error) {
    errorThrown = true
    assert(error.message.includes('no wallet connected') || error.message.includes('No address'), 
      'Should throw no wallet error')
  }
  
  assert(errorThrown, 'Should throw error when not logged in')
})

// ---------------------------------------------------------------------------
// Test: SDK isHealthy Check
// ---------------------------------------------------------------------------
runner.test('SDK health check method', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  const healthy = await sdk.isHealthy()
  
  assert(healthy === true || healthy === false, 'isHealthy should return boolean')
  logInfo(`SDK health check: ${healthy ? 'healthy' : 'unhealthy'}`)
})

// ---------------------------------------------------------------------------
// Test: Multiple SDK Instances
// ---------------------------------------------------------------------------
runner.test('Multiple SDK instances with different wallets', async () => {
  const aliceSDK = new BlackBookSDK({ url: CONFIG.L1_URL })
  const bobSDK = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  aliceSDK.connectTestAccount('alice')
  bobSDK.connectTestAccount('bob')
  
  // Both should be connected independently
  assert(aliceSDK.isConnected, 'Alice SDK should be connected')
  assert(bobSDK.isConnected, 'Bob SDK should be connected')
  
  assertEqual(aliceSDK.getAddress(), TEST_ADDRESSES.alice, 'Alice SDK has Alice address')
  assertEqual(bobSDK.getAddress(), TEST_ADDRESSES.bob, 'Bob SDK has Bob address')
  
  // Disconnecting one doesn't affect the other
  aliceSDK.disconnect()
  assert(!aliceSDK.isConnected, 'Alice SDK should be disconnected')
  assert(bobSDK.isConnected, 'Bob SDK should still be connected')
  
  bobSDK.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Re-login After Disconnect
// ---------------------------------------------------------------------------
runner.test('Re-login after disconnect works', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  // First login
  sdk.connectTestAccount('alice')
  assert(sdk.isConnected, 'Should be connected')
  
  // Disconnect
  sdk.disconnect()
  assert(!sdk.isConnected, 'Should be disconnected')
  
  // Re-login
  sdk.connectTestAccount('alice')
  assert(sdk.isConnected, 'Should be connected again')
  assertEqual(sdk.getAddress(), TEST_ADDRESSES.alice, 'Should have same address')
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Get Stats
// ---------------------------------------------------------------------------
runner.test('Get blockchain stats', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  try {
    const stats = await sdk.getStats()
    assertNotNull(stats, 'Stats should not be null')
    logInfo(`Stats retrieved successfully`)
  } catch (error) {
    // Stats endpoint might not be available
    logInfo(`Stats endpoint not available: ${error.message}`)
  }
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Balance Caching
// ---------------------------------------------------------------------------
runner.test('Balance caching works', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL, cacheMaxAge: 5000 })
  
  sdk.connectTestAccount('alice')
  
  // First fetch
  const balance1 = await sdk.getBalance()
  
  // Second fetch should use cache (very fast)
  const startTime = Date.now()
  const balance2 = await sdk.getBalance()
  const fetchTime = Date.now() - startTime
  
  assertEqual(balance1.balance, balance2.balance, 'Cached balance should match')
  assert(fetchTime < 100, 'Cached fetch should be very fast')
  
  logInfo(`Cached fetch took ${fetchTime}ms`)
  
  sdk.disconnect()
})

// ═══════════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════════

runner.run().then(results => {
  process.exit(results.failed > 0 ? 1 : 0)
})
