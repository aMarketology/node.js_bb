/**
 * BRIDGE L1 → L2 - QUICK USAGE EXAMPLE
 * 
 * Simple, copy-paste ready example for bridging tokens from L1 to L2
 */

import nacl from 'tweetnacl'
import crypto from 'crypto'

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const NEXT_API_URL = 'http://localhost:3000'  // Your Next.js frontend
const CHAIN_ID_L1 = 1

// Your wallet credentials
const YOUR_PRIVATE_KEY = process.env.PRIVATE_KEY  // 64 hex chars
const YOUR_WALLET_ADDRESS = process.env.WALLET_ADDRESS  // e.g., "L1_YOUR_ADDRESS"

// ═══════════════════════════════════════════════════════════════════════════
// BRIDGE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function bridgeToL2(amount) {
  console.log(`🌉 Bridging ${amount} tokens from L1 → L2...`)
  
  // 1. Create payload
  const payload = JSON.stringify({
    amount: amount,
    target_layer: "L2"
  })
  
  // 2. Generate timestamp and nonce
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomUUID()
  
  // 3. Construct message to sign
  const message = `${payload}\n${timestamp}\n${nonce}`
  
  // 4. Sign with Ed25519 (with domain separation)
  const chainIdByte = Buffer.from([CHAIN_ID_L1])
  const messageToSign = Buffer.concat([
    chainIdByte,
    Buffer.from(message, 'utf-8')
  ])
  
  const privateKey = Buffer.from(YOUR_PRIVATE_KEY, 'hex')
  const keypair = nacl.sign.keyPair.fromSeed(privateKey.slice(0, 32))
  const signature = nacl.sign.detached(messageToSign, keypair.secretKey)
  
  // 5. Build signed request
  const signedRequest = {
    payload: payload,
    public_key: Buffer.from(keypair.publicKey).toString('hex'),
    wallet_address: YOUR_WALLET_ADDRESS,
    signature: Buffer.from(signature).toString('hex'),
    nonce: nonce,
    timestamp: timestamp,
    chain_id: CHAIN_ID_L1
  }
  
  // 6. Send to API
  console.log('📤 Sending request to:', `${NEXT_API_URL}/api/bridge/initiate`)
  
  const response = await fetch(`${NEXT_API_URL}/api/bridge/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(signedRequest)
  })
  
  const result = await response.json()
  
  // 7. Handle response
  if (response.ok && result.success) {
    console.log('✅ Bridge successful!')
    console.log('   Lock ID:', result.lock_id)
    console.log('   Amount:', result.amount)
    console.log('   Message:', result.message)
    return result
  } else {
    console.error('❌ Bridge failed!')
    console.error('   Error:', result.error)
    console.error('   Details:', result.details)
    throw new Error(result.error || 'Bridge operation failed')
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE
// ═══════════════════════════════════════════════════════════════════════════

// Bridge 100 tokens
bridgeToL2(100)
  .then(result => {
    console.log('\n🎉 Bridge complete!')
    console.log('Full result:', JSON.stringify(result, null, 2))
  })
  .catch(error => {
    console.error('\n💥 Bridge error:', error.message)
    process.exit(1)
  })
