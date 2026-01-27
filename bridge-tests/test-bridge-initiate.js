/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRIDGE L1 → L2 TEST SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests the bridge initiate endpoint with proper Ed25519 signing
 * 
 * Usage:
 *   node bridge-tests/test-bridge-initiate.js
 * 
 * Requirements:
 *   - L1 server running on http://localhost:8080
 *   - Next.js API running on http://localhost:3000
 *   - Valid test wallet with L1 balance
 */

import nacl from 'tweetnacl'
import crypto from 'crypto'

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const L1_API_URL = 'http://localhost:8080'
const NEXT_API_URL = 'http://localhost:3000'
const CHAIN_ID_L1 = 1

// Test wallet credentials (replace with actual test account)
const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000001'
const TEST_WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS || 'L1_TEST_ADDRESS'

// ═══════════════════════════════════════════════════════════════════════════
// CRYPTOGRAPHY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate Ed25519 keypair from private key hex
 */
function getKeypair(privateKeyHex) {
  const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex')
  return nacl.sign.keyPair.fromSeed(privateKeyBuffer.slice(0, 32))
}

/**
 * Sign a message with Ed25519 and domain separation
 */
function signMessage(privateKeyHex, message, chainId) {
  const keypair = getKeypair(privateKeyHex)
  
  // Domain separation: prepend chain ID byte
  const chainIdByte = Buffer.from([chainId])
  const messageBuffer = Buffer.from(message, 'utf-8')
  const domainSeparated = Buffer.concat([chainIdByte, messageBuffer])
  
  const signature = nacl.sign.detached(domainSeparated, keypair.secretKey)
  return Buffer.from(signature).toString('hex')
}

/**
 * Get public key from private key
 */
function getPublicKey(privateKeyHex) {
  const keypair = getKeypair(privateKeyHex)
  return Buffer.from(keypair.publicKey).toString('hex')
}

// ═══════════════════════════════════════════════════════════════════════════
// BRIDGE REQUEST BUILDER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a signed bridge request
 */
function createBridgeRequest(privateKeyHex, walletAddress, amount, targetLayer = 'L2') {
  // 1. Create payload
  const payload = {
    amount: amount,
    target_layer: targetLayer
  }
  const payloadStr = JSON.stringify(payload)
  
  // 2. Generate timestamp and nonce
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomUUID()
  
  // 3. Construct message to sign
  // Format: [chain_id_byte] + "{payload}\n{timestamp}\n{nonce}"
  const message = `${payloadStr}\n${timestamp}\n${nonce}`
  
  console.log('\n📝 Message to sign:')
  console.log('   Payload:', payloadStr)
  console.log('   Timestamp:', timestamp)
  console.log('   Nonce:', nonce)
  console.log('   Message:', message)
  
  // 4. Sign with Ed25519
  const signature = signMessage(privateKeyHex, message, CHAIN_ID_L1)
  const publicKey = getPublicKey(privateKeyHex)
  
  console.log('\n🔐 Signature:')
  console.log('   Public key:', publicKey)
  console.log('   Signature:', signature)
  
  // 5. Build signed request
  return {
    payload: payloadStr,
    public_key: publicKey,
    wallet_address: walletAddress,
    signature: signature,
    nonce: nonce,
    timestamp: timestamp,
    chain_id: CHAIN_ID_L1
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Test 1: Bridge via Next.js API (recommended)
 */
async function testBridgeViaNextAPI() {
  console.log('\n' + '═'.repeat(80))
  console.log('TEST 1: Bridge via Next.js API')
  console.log('═'.repeat(80))
  
  const amount = 100
  const signedRequest = createBridgeRequest(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS, amount)
  
  console.log('\n📤 Sending signed request to Next.js API...')
  console.log('   Endpoint:', `${NEXT_API_URL}/api/bridge/initiate`)
  console.log('   Request:', JSON.stringify(signedRequest, null, 2))
  
  try {
    const response = await fetch(`${NEXT_API_URL}/api/bridge/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedRequest)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('\n✅ Bridge request successful!')
      console.log('   Lock ID:', data.lock_id)
      console.log('   Amount:', data.amount)
      console.log('   Wallet:', data.wallet_address)
      console.log('   Target:', data.target_layer)
      console.log('   Full response:', JSON.stringify(data, null, 2))
      return { success: true, data }
    } else {
      console.error('\n❌ Bridge request failed!')
      console.error('   Status:', response.status)
      console.error('   Error:', data.error)
      console.error('   Details:', data.details)
      return { success: false, error: data }
    }
  } catch (error) {
    console.error('\n❌ Network error:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 2: Direct L1 API call (for comparison)
 */
async function testDirectL1API() {
  console.log('\n' + '═'.repeat(80))
  console.log('TEST 2: Direct L1 API Call')
  console.log('═'.repeat(80))
  
  const amount = 100
  const signedRequest = createBridgeRequest(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS, amount)
  
  console.log('\n📤 Sending signed request directly to L1...')
  console.log('   Endpoint:', `${L1_API_URL}/bridge/initiate`)
  
  try {
    const response = await fetch(`${L1_API_URL}/bridge/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedRequest)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('\n✅ Direct L1 request successful!')
      console.log('   Response:', JSON.stringify(data, null, 2))
      return { success: true, data }
    } else {
      console.error('\n❌ Direct L1 request failed!')
      console.error('   Status:', response.status)
      console.error('   Response:', JSON.stringify(data, null, 2))
      return { success: false, error: data }
    }
  } catch (error) {
    console.error('\n❌ Network error:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 3: Invalid signature (should fail)
 */
async function testInvalidSignature() {
  console.log('\n' + '═'.repeat(80))
  console.log('TEST 3: Invalid Signature (Should Fail)')
  console.log('═'.repeat(80))
  
  const amount = 100
  const signedRequest = createBridgeRequest(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS, amount)
  
  // Tamper with the signature
  signedRequest.signature = 'a'.repeat(128)
  
  console.log('\n📤 Sending request with invalid signature...')
  
  try {
    const response = await fetch(`${NEXT_API_URL}/api/bridge/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedRequest)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.error('\n❌ Test failed: Invalid signature was accepted!')
      return { success: false }
    } else if (response.status === 401) {
      console.log('\n✅ Test passed: Invalid signature was rejected (401)')
      console.log('   Error:', data.error)
      return { success: true }
    } else {
      console.error('\n❌ Unexpected response:', response.status, data)
      return { success: false }
    }
  } catch (error) {
    console.error('\n❌ Network error:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 4: Expired timestamp (should fail)
 */
async function testExpiredTimestamp() {
  console.log('\n' + '═'.repeat(80))
  console.log('TEST 4: Expired Timestamp (Should Fail)')
  console.log('═'.repeat(80))
  
  const amount = 100
  const signedRequest = createBridgeRequest(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS, amount)
  
  // Set timestamp to 10 minutes ago
  signedRequest.timestamp = Math.floor(Date.now() / 1000) - 600
  
  // Re-sign with old timestamp
  const payload = signedRequest.payload
  const message = `${payload}\n${signedRequest.timestamp}\n${signedRequest.nonce}`
  signedRequest.signature = signMessage(TEST_PRIVATE_KEY, message, CHAIN_ID_L1)
  
  console.log('\n📤 Sending request with expired timestamp...')
  
  try {
    const response = await fetch(`${NEXT_API_URL}/api/bridge/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedRequest)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.error('\n❌ Test failed: Expired timestamp was accepted!')
      return { success: false }
    } else if (response.status === 400 && data.error.includes('expired')) {
      console.log('\n✅ Test passed: Expired timestamp was rejected (400)')
      console.log('   Error:', data.error)
      return { success: true }
    } else {
      console.error('\n❌ Unexpected response:', response.status, data)
      return { success: false }
    }
  } catch (error) {
    console.error('\n❌ Network error:', error.message)
    return { success: false, error: error.message }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('\n' + '═'.repeat(80))
  console.log('BRIDGE L1 → L2 TEST SUITE')
  console.log('═'.repeat(80))
  console.log('\nTest Configuration:')
  console.log('   L1 API:', L1_API_URL)
  console.log('   Next.js API:', NEXT_API_URL)
  console.log('   Test Wallet:', TEST_WALLET_ADDRESS)
  console.log('   Chain ID:', CHAIN_ID_L1)
  
  const results = []
  
  // Test 1: Bridge via Next.js API
  results.push(await testBridgeViaNextAPI())
  
  // Test 2: Direct L1 API (optional)
  // Uncomment if you want to test direct L1 access
  // results.push(await testDirectL1API())
  
  // Test 3: Invalid signature
  results.push(await testInvalidSignature())
  
  // Test 4: Expired timestamp
  results.push(await testExpiredTimestamp())
  
  // Summary
  console.log('\n' + '═'.repeat(80))
  console.log('TEST SUMMARY')
  console.log('═'.repeat(80))
  
  const passed = results.filter(r => r.success).length
  const total = results.length
  
  console.log(`\n   Passed: ${passed}/${total}`)
  
  if (passed === total) {
    console.log('\n   ✅ All tests passed!')
  } else {
    console.log('\n   ❌ Some tests failed')
  }
  
  console.log('\n' + '═'.repeat(80))
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
