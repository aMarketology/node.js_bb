/**
 * L2 Transaction Signer
 * Uses @noble/ed25519 to match L2 server expectations exactly
 */

import * as ed25519 from '@noble/ed25519'

export interface SignatureResult {
  signature: string
  message: string
  publicKey: string
  timestamp: number
  nonce: string
}

/**
 * Sign a withdrawal request with domain separation
 * Matches the exact format expected by the L2 server
 */
export async function signWithdrawal(
  amount: number,
  fromAddress: string,
  privateKeyHex: string,
  publicKeyHex: string
): Promise<SignatureResult> {
  // 1. Get timestamp in SECONDS (not milliseconds)
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = Date.now().toString()
  
  // 2. Format amount as float string (3.0 not 3)
  const amountStr = Number.isInteger(amount) ? `${amount}.0` : `${amount}`
  
  // 3. Build canonical message (alphabetically sorted keys)
  const message = `{"action":"WITHDRAW_REQUEST","nonce":"${nonce}","payload":{"amount":${amountStr},"from_address":"${fromAddress}"},"timestamp":${timestamp}}`
  
  console.log('📝 Message:', message)
  
  // 4. Add domain separation (prepend chain_id)
  const CHAIN_ID = 2
  const messageBytes = new TextEncoder().encode(message)
  const domainSeparatedMessage = new Uint8Array(messageBytes.length + 1)
  domainSeparatedMessage[0] = CHAIN_ID
  domainSeparatedMessage.set(messageBytes, 1)
  
  console.log('🔐 Domain separated (first 50 bytes):', 
    Array.from(domainSeparatedMessage.slice(0, 50))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  )
  // Should start with: 027b22616374696f6e...
  
  // 5. Sign with Ed25519
  const privateKeyBytes = hexToBytes(privateKeyHex)
  const signatureBytes = await ed25519.sign(domainSeparatedMessage, privateKeyBytes)
  const signature = bytesToHex(signatureBytes)
  
  console.log('✅ Signature:', signature)
  
  return {
    signature,
    message,
    publicKey: publicKeyHex,
    timestamp,
    nonce
  }
}

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}
