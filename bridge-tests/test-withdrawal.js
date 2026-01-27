/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRIDGE L2 → L1 WITHDRAWAL TEST SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests the withdrawal endpoint with proper Ed25519 signing
 * 
 * Usage:
 *   node bridge-tests/test-withdrawal.js
 * 
 * Requirements:
 *   - L2 server running on http://localhost:1234
 *   - Next.js API running on http://localhost:3000
 *   - Valid test wallet with L2 balance
 */

import nacl from 'tweetnacl'
import crypto from 'crypto'

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const L2_API_URL = 'http://localhost:1234'
const NEXT_API_URL = 'http://localhost:3000'
const CHAIN_ID_L2 = 2

// Test wallet credentials (replace with actual test account)
const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000001'
const TEST_WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS || 'L2_TEST_ADDRESS'

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

/**
 * Sort object keys alphabetically (recursively)
 */
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

// ═══════════════════════════════════════════════════════════════════════════
// WITHDRAWAL REQUEST BUILDER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a signed withdrawal request
 */
function createWithdrawalRequest(privateKeyHex, fromAddress, amount) {
  // 1. Generate timestamp and nonce
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomUUID()
  
  // 2. Create signature payload (must match L2 server format)
  const signaturePayload = {
    action: 'WITHDRAW_REQUEST',
    nonce: nonce,
    payload: {
      amount: amount,
      from_address: fromAddress
    },
    timestamp: timestamp
  }
  
  // 3. Sort keys alphabetically for deterministic JSON
  const sortedPayload = sortKeysAlphabetically(signaturePayload)
  const message = JSON.stringify(sortedPayload)
  
  console.log('\n📝 Signature payload:')
  console.log('   Action:', signaturePayload.action)
  console.log('   Amount:', amount)
  console.log('   From:', fromAddress)
  console.log('   Timestamp:', timestamp)
  console.log('   Nonce:', nonce)
  console.log('   Message:', message)
  
  // 4. Sign with Ed25519
  const signature = signMessage(privateKeyHex, message, CHAIN_ID_L2)
  const publicKey = getPublicKey(privateKeyHex)
  
  console.log('\n🔐 Signature:')
  console.log('   Public key:', publicKey)
  console.log('   Signature:', signature)
  
  // 5. Build withdrawal request
  return {
    from_address: fromAddress,
    amount: amount,
    public_key: publicKey,
    signature: signature,
    timestamp: timestamp,
    nonce: nonce
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Test 1: Withdrawal via Next.js API (recommended)
 */
async function testWithdrawalViaNextAPI() {
  console.log('\n' + '═'.repeat(80))
  console.log('TEST 1: Withdrawal via Next.js API')
  console.log('═'.repeat(80))
  
  const amount = 100
  const withdrawalRequest = createWithdrawalRequest(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS, amount)
  
  console.log('\n📤 Sending withdrawal request to Next.js API...')
  console.log('   Endpoint:', `${NEXT_API_URL}/api/bridge/withdraw`)
  console.log('   Request:', JSON.stringify(withdrawalRequest, null, 2))
  
  try {
    const response = await fetch(`${NEXT_API_URL}/api/bridge/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(withdrawalRequest)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('\n✅ Withdrawal request successful!')
      console.log('   Withdrawal ID:', data.withdrawal_id)
      console.log('   Amount:', data.amount)
      console.log('   From:', data.from_address)
      console.log('   Status:', data.status)
      console.log('   Message:', data.message)
      console.log('   Full response:', JSON.stringify(data, null, 2))
      return { success: true, data }
    } else {
      console.error('\n❌ Withdrawal request failed!')
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
 * Test 2: Direct L2 API call (for comparison)
 */
async function testDirectL2API() {
  console.log('\n' + '═'.repeat(80))
  console.log('TEST 2: Direct L2 API Call')
  console.log('═'.repeat(80))
  
  const amount = 100
  const withdrawalRequest = createWithdrawalRequest(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS, amount)
  
  console.log('\n📤 Sending withdrawal request directly to L2...')
  console.log('   Endpoint:', `${L2_API_URL}/withdraw`)
  
  try {
    const response = await fetch(`${L2_API_URL}/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(withdrawalRequest)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('\n✅ Direct L2 request successful!')
      console.log('   Response:', JSON.stringify(data, null, 2))
      return { success: true, data }
    } else {
      console.error('\n❌ Direct L2 request failed!')
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
  const withdrawalRequest = createWithdrawalRequest(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS, amount)
  
  // Tamper with the signature
  withdrawalRequest.signature = 'a'.repeat(128)
  
  console.log('\n📤 Sending request with invalid signature...')
  
  try {
    const response = await fetch(`${NEXT_API_URL}/api/bridge/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(withdrawalRequest)
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
  const fromAddress = TEST_WALLET_ADDRESS
  
  // Set timestamp to 10 minutes ago
  const timestamp = Math.floor(Date.now() / 1000) - 600
  const nonce = crypto.randomUUID()
  
  const signaturePayload = {
    action: 'WITHDRAW_REQUEST',
    nonce: nonce,
    payload: {
      amount: amount,
      from_address: fromAddress
    },
    timestamp: timestamp
  }
  
  const sortedPayload = sortKeysAlphabetically(signaturePayload)
  const message = JSON.stringify(sortedPayload)
  const signature = signMessage(TEST_PRIVATE_KEY, message, CHAIN_ID_L2)
  const publicKey = getPublicKey(TEST_PRIVATE_KEY)
  
  const withdrawalRequest = {
    from_address: fromAddress,
    amount: amount,
    public_key: publicKey,
    signature: signature,
    timestamp: timestamp,
    nonce: nonce
  }
  
  console.log('\n📤 Sending request with expired timestamp...')
  
  try {
    const response = await fetch(`${NEXT_API_URL}/api/bridge/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(withdrawalRequest)
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

/**
 * Test 5: Invalid amount (should fail)
 */
async function testInvalidAmount() {
  console.log('\n' + '═'.repeat(80))
  console.log('TEST 5: Invalid Amount (Should Fail)')
  console.log('═'.repeat(80))
  
  const amount = -100  // Negative amount
  const withdrawalRequest = createWithdrawalRequest(TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS, amount)
  
  console.log('\n📤 Sending request with invalid amount...')
  
  try {
    const response = await fetch(`${NEXT_API_URL}/api/bridge/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(withdrawalRequest)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.error('\n❌ Test failed: Invalid amount was accepted!')
      return { success: false }
    } else if (response.status === 400 && data.error.includes('amount')) {
      console.log('\n✅ Test passed: Invalid amount was rejected (400)')
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
  console.log('BRIDGE L2 → L1 WITHDRAWAL TEST SUITE')
  console.log('═'.repeat(80))
  console.log('\nTest Configuration:')
  console.log('   L2 API:', L2_API_URL)
  console.log('   Next.js API:', NEXT_API_URL)
  console.log('   Test Wallet:', TEST_WALLET_ADDRESS)
  console.log('   Chain ID:', CHAIN_ID_L2)
  
  const results = []
  
  // Test 1: Withdrawal via Next.js API
  results.push(await testWithdrawalViaNextAPI())
  
  // Test 2: Direct L2 API (optional)
  // Uncomment if you want to test direct L2 access
  // results.push(await testDirectL2API())
  
  // Test 3: Invalid signature
  results.push(await testInvalidSignature())
  
  // Test 4: Expired timestamp
  results.push(await testExpiredTimestamp())
  
  // Test 5: Invalid amount
  results.push(await testInvalidAmount())
  
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
