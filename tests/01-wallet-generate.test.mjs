/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FEATURE TEST: WALLET GENERATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests for creating new wallets with the BlackBook SDK
 * 
 * Features tested:
 * - Create random wallet
 * - Import wallet from secret key
 * - Import wallet from seed
 * - Connect test accounts (alice, bob, dealer)
 * - Wallet address format validation
 * - Public key format validation
 */

import { BlackBookSDK } from '../sdk/blackbook-frontend-sdk.js'
import { CONFIG, TEST_SEEDS, TEST_ADDRESSES } from './config.js'
import { 
  TestRunner, 
  assert, 
  assertEqual, 
  assertNotNull,
  logInfo 
} from './utils.js'

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

const runner = new TestRunner('Wallet Generation Tests')

// ---------------------------------------------------------------------------
// Test: Create Random Wallet
// ---------------------------------------------------------------------------
runner.test('Create a new random wallet', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  const wallet = await sdk.createWallet()
  
  assertNotNull(wallet.address, 'Wallet should have an address')
  assertNotNull(wallet.publicKey, 'Wallet should have a public key')
  
  // Validate address format (L1_<40 hex chars>)
  assert(wallet.address.startsWith('L1_'), 'Address should start with L1_')
  assert(wallet.address.length === 43, 'Address should be 43 characters (L1_ + 40 hex)')
  
  // Validate public key format (64 hex chars)
  assert(wallet.publicKey.length === 64, 'Public key should be 64 hex characters')
  assert(/^[0-9a-f]+$/i.test(wallet.publicKey), 'Public key should be valid hex')
  
  logInfo(`Created wallet: ${wallet.address}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Create Multiple Unique Wallets
// ---------------------------------------------------------------------------
runner.test('Create multiple unique wallets', async () => {
  const sdk1 = new BlackBookSDK({ url: CONFIG.L1_URL })
  const sdk2 = new BlackBookSDK({ url: CONFIG.L1_URL })
  const sdk3 = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  const wallet1 = await sdk1.createWallet()
  const wallet2 = await sdk2.createWallet()
  const wallet3 = await sdk3.createWallet()
  
  // All wallets should be unique
  assert(wallet1.address !== wallet2.address, 'Wallet 1 and 2 should be different')
  assert(wallet2.address !== wallet3.address, 'Wallet 2 and 3 should be different')
  assert(wallet1.address !== wallet3.address, 'Wallet 1 and 3 should be different')
  
  logInfo('All 3 wallets are unique')
  
  sdk1.disconnect()
  sdk2.disconnect()
  sdk3.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Import from Seed (Deterministic)
// ---------------------------------------------------------------------------
runner.test('Import wallet from seed (deterministic)', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  // Convert hex seed to bytes
  const seedHex = TEST_SEEDS.alice
  const seed = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    seed[i] = parseInt(seedHex.substr(i * 2, 2), 16)
  }
  
  const wallet = sdk.importFromSeed(seed)
  
  assertEqual(wallet.address, TEST_ADDRESSES.alice, 'Address should match expected Alice address')
  
  logInfo(`Imported Alice wallet: ${wallet.address}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Connect Test Account - Alice
// ---------------------------------------------------------------------------
runner.test('Connect test account: Alice', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  const wallet = sdk.connectTestAccount('alice')
  
  assertEqual(wallet.address, TEST_ADDRESSES.alice, 'Should connect to Alice address')
  assert(sdk.isConnected, 'SDK should be connected')
  assertEqual(sdk.getAddress(), TEST_ADDRESSES.alice, 'getAddress() should return Alice address')
  
  logInfo(`Connected to Alice: ${wallet.address}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Connect Test Account - Bob
// ---------------------------------------------------------------------------
runner.test('Connect test account: Bob', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  const wallet = sdk.connectTestAccount('bob')
  
  assertEqual(wallet.address, TEST_ADDRESSES.bob, 'Should connect to Bob address')
  assert(sdk.isConnected, 'SDK should be connected')
  
  logInfo(`Connected to Bob: ${wallet.address}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Connect Test Account - Dealer
// ---------------------------------------------------------------------------
runner.test('Connect test account: Dealer', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  const wallet = sdk.connectTestAccount('dealer')
  
  assertEqual(wallet.address, TEST_ADDRESSES.dealer, 'Should connect to Dealer address')
  assert(sdk.isConnected, 'SDK should be connected')
  
  logInfo(`Connected to Dealer: ${wallet.address}`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Invalid Test Account
// ---------------------------------------------------------------------------
runner.test('Reject invalid test account name', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  let errorThrown = false
  try {
    sdk.connectTestAccount('invalid_account')
  } catch (error) {
    errorThrown = true
    assert(error.message.includes('Unknown test account'), 'Should throw unknown account error')
  }
  
  assert(errorThrown, 'Should throw error for invalid account')
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: Wallet Disconnect
// ---------------------------------------------------------------------------
runner.test('Wallet disconnects properly', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  assert(sdk.isConnected, 'Should be connected after connect')
  assertNotNull(sdk.getAddress(), 'Should have address after connect')
  
  sdk.disconnect()
  
  assert(!sdk.isConnected, 'Should not be connected after disconnect')
  assertEqual(sdk.getAddress(), null, 'Address should be null after disconnect')
  
  logInfo('Wallet disconnected successfully')
})

// ---------------------------------------------------------------------------
// Test: Get Token Info
// ---------------------------------------------------------------------------
runner.test('Get token info', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  const tokenInfo = sdk.getTokenInfo()
  
  assertEqual(tokenInfo.symbol, 'BB', 'Token symbol should be BB')
  assertEqual(tokenInfo.decimals, 2, 'Token should have 2 decimals')
  assertEqual(tokenInfo.usdPeg, 1.0, 'Token should be pegged 1:1 to USD')
  assertNotNull(tokenInfo.name, 'Token should have a name')
  
  logInfo(`Token: ${tokenInfo.name} (${tokenInfo.symbol})`)
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: SDK Events - Wallet Connected
// ---------------------------------------------------------------------------
runner.test('SDK emits wallet connected event', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  let eventReceived = false
  let eventAddress = null
  
  sdk.on('wallet:connected', (data) => {
    eventReceived = true
    eventAddress = data.address
  })
  
  sdk.connectTestAccount('alice')
  
  assert(eventReceived, 'Should receive wallet:connected event')
  assertEqual(eventAddress, TEST_ADDRESSES.alice, 'Event should contain correct address')
  
  sdk.disconnect()
})

// ---------------------------------------------------------------------------
// Test: SDK Events - Wallet Disconnected
// ---------------------------------------------------------------------------
runner.test('SDK emits wallet disconnected event', async () => {
  const sdk = new BlackBookSDK({ url: CONFIG.L1_URL })
  
  sdk.connectTestAccount('alice')
  
  let eventReceived = false
  sdk.on('wallet:disconnected', () => {
    eventReceived = true
  })
  
  sdk.disconnect()
  
  assert(eventReceived, 'Should receive wallet:disconnected event')
})

// ═══════════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════════

runner.run().then(results => {
  process.exit(results.failed > 0 ? 1 : 0)
})
