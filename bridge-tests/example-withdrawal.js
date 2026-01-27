/**
 * BRIDGE L2 → L1 WITHDRAWAL - QUICK USAGE EXAMPLE
 * 
 * Simple, copy-paste ready example for withdrawing tokens from L2 to L1
 */

import nacl from 'tweetnacl'
import crypto from 'crypto'

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const NEXT_API_URL = 'http://localhost:3000'  // Your Next.js frontend
const CHAIN_ID_L2 = 2

// Your wallet credentials
const YOUR_PRIVATE_KEY = process.env.PRIVATE_KEY  // 64 hex chars
const YOUR_WALLET_ADDRESS = process.env.WALLET_ADDRESS  // e.g., "L2_YOUR_ADDRESS"

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

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
// WITHDRAWAL FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function withdrawToL1(amount) {
  console.log(`🔄 Withdrawing ${amount} tokens from L2 → L1...`)
  
  // 1. Generate timestamp and nonce
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomUUID()
  
  // 2. Create signature payload (must match server format)
  const signaturePayload = {
    action: 'WITHDRAW_REQUEST',
    nonce: nonce,
    payload: {
      amount: amount,
      from_address: YOUR_WALLET_ADDRESS
    },
    timestamp: timestamp
  }
  
  // 3. Sort keys alphabetically for deterministic JSON
  const sortedPayload = sortKeysAlphabetically(signaturePayload)
  const message = JSON.stringify(sortedPayload)
  
  console.log('📝 Message to sign:', message)
  
  // 4. Sign with Ed25519 (with domain separation)
  const chainIdByte = Buffer.from([CHAIN_ID_L2])
  const messageToSign = Buffer.concat([
    chainIdByte,
    Buffer.from(message, 'utf-8')
  ])
  
  const privateKey = Buffer.from(YOUR_PRIVATE_KEY, 'hex')
  const keypair = nacl.sign.keyPair.fromSeed(privateKey.slice(0, 32))
  const signature = nacl.sign.detached(messageToSign, keypair.secretKey)
  
  // 5. Build withdrawal request
  const withdrawalRequest = {
    from_address: YOUR_WALLET_ADDRESS,
    amount: amount,
    public_key: Buffer.from(keypair.publicKey).toString('hex'),
    signature: Buffer.from(signature).toString('hex'),
    timestamp: timestamp,
    nonce: nonce
  }
  
  // 6. Send to API
  console.log('📤 Sending request to:', `${NEXT_API_URL}/api/bridge/withdraw`)
  
  const response = await fetch(`${NEXT_API_URL}/api/bridge/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(withdrawalRequest)
  })
  
  const result = await response.json()
  
  // 7. Handle response
  if (response.ok && result.success) {
    console.log('✅ Withdrawal request successful!')
    console.log('   Withdrawal ID:', result.withdrawal_id)
    console.log('   Amount:', result.amount)
    console.log('   Status:', result.status)
    console.log('   Message:', result.message)
    return result
  } else {
    console.error('❌ Withdrawal failed!')
    console.error('   Error:', result.error)
    console.error('   Details:', result.details)
    throw new Error(result.error || 'Withdrawal operation failed')
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE
// ═══════════════════════════════════════════════════════════════════════════

// Withdraw 100 tokens
withdrawToL1(100)
  .then(result => {
    console.log('\n🎉 Withdrawal request complete!')
    console.log('Full result:', JSON.stringify(result, null, 2))
    console.log('\n⏳ Withdrawal is pending. Dealer will complete the L1 transaction.')
  })
  .catch(error => {
    console.error('\n💥 Withdrawal error:', error.message)
    process.exit(1)
  })
