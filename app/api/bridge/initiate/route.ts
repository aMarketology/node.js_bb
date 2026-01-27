// Bridge L1 → L2 Initiate Endpoint
// Handles signed requests to lock tokens on L1 and initiate L2 credit

import { NextRequest, NextResponse } from 'next/server'
import * as nacl from 'tweetnacl'

const L1_API_URL = process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080'
const CHAIN_ID_L1 = 1

interface SignedRequest {
  payload: string           // JSON string
  public_key: string        // 64 hex chars
  wallet_address: string    // L1 address (required)
  signature: string         // 128 hex chars (Ed25519)
  nonce: string            // UUID or unique string
  timestamp: number        // Unix timestamp in seconds
  chain_id: number         // 1 = L1
}

/**
 * Verify Ed25519 signature with domain separation
 */
function verifySignature(
  publicKeyHex: string,
  message: string,
  signatureHex: string,
  chainId: number
): boolean {
  try {
    // Domain separation: prepend chain ID byte
    const chainIdByte = Buffer.from([chainId])
    const messageBuffer = Buffer.from(message, 'utf-8')
    const domainSeparated = Buffer.concat([chainIdByte, messageBuffer])
    
    const publicKey = new Uint8Array(Buffer.from(publicKeyHex, 'hex'))
    const signature = new Uint8Array(Buffer.from(signatureHex, 'hex'))
    
    return nacl.sign.detached.verify(domainSeparated, signature, publicKey)
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * Validate timestamp (within 5 minutes)
 */
function validateTimestamp(timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  const diff = Math.abs(now - timestamp)
  return diff < 300 // 5 minutes
}

export async function POST(request: NextRequest) {
  try {
    const signedRequest: SignedRequest = await request.json()
    
    console.log('🌉 Bridge initiate request received')
    console.log('📦 Request:', JSON.stringify(signedRequest, null, 2))
    
    // Validate required fields
    if (!signedRequest.payload || !signedRequest.public_key || 
        !signedRequest.wallet_address || !signedRequest.signature || 
        !signedRequest.nonce || !signedRequest.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields in signed request' },
        { status: 400 }
      )
    }
    
    // Validate chain ID
    if (signedRequest.chain_id !== CHAIN_ID_L1) {
      return NextResponse.json(
        { error: `Invalid chain_id: expected ${CHAIN_ID_L1}, got ${signedRequest.chain_id}` },
        { status: 400 }
      )
    }
    
    // Validate timestamp
    if (!validateTimestamp(signedRequest.timestamp)) {
      return NextResponse.json(
        { error: 'Request timestamp expired (max 5 minutes)' },
        { status: 400 }
      )
    }
    
    // Validate hex field lengths
    if (signedRequest.public_key.length !== 64) {
      return NextResponse.json(
        { error: 'Invalid public_key length: expected 64 hex chars' },
        { status: 400 }
      )
    }
    
    if (signedRequest.signature.length !== 128) {
      return NextResponse.json(
        { error: 'Invalid signature length: expected 128 hex chars' },
        { status: 400 }
      )
    }
    
    // Parse and validate payload
    let payload: any
    try {
      payload = JSON.parse(signedRequest.payload)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in payload field' },
        { status: 400 }
      )
    }
    
    // Validate payload structure
    if (typeof payload.amount !== 'number' || payload.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount in payload: must be a positive number' },
        { status: 400 }
      )
    }
    
    if (payload.target_layer !== 'L2') {
      return NextResponse.json(
        { error: 'Invalid target_layer in payload: must be "L2"' },
        { status: 400 }
      )
    }
    
    // Reconstruct message for signature verification
    // Format: [chain_id_byte] + "{payload}\n{timestamp}\n{nonce}"
    const message = `${signedRequest.payload}\n${signedRequest.timestamp}\n${signedRequest.nonce}`
    
    console.log('🔐 Verifying signature...')
    console.log('   Message:', message.substring(0, 100) + '...')
    console.log('   Public key:', signedRequest.public_key)
    console.log('   Signature:', signedRequest.signature)
    
    // Verify signature
    const isValid = verifySignature(
      signedRequest.public_key,
      message,
      signedRequest.signature,
      signedRequest.chain_id
    )
    
    if (!isValid) {
      console.error('❌ Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    console.log('✅ Signature verified')
    
    // Forward to L1 backend to lock tokens
    const l1Url = `${L1_API_URL}/bridge/initiate`
    console.log('📡 Forwarding to L1:', l1Url)
    
    const l1Response = await fetch(l1Url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: signedRequest.wallet_address,
        amount: payload.amount,
        target_layer: payload.target_layer,
        public_key: signedRequest.public_key,
        nonce: signedRequest.nonce,
        timestamp: signedRequest.timestamp,
        signature: signedRequest.signature,
      }),
    })
    
    if (!l1Response.ok) {
      const errorText = await l1Response.text()
      console.error('❌ L1 bridge error:', errorText)
      return NextResponse.json(
        { 
          error: 'L1 bridge operation failed', 
          status: l1Response.status, 
          details: errorText 
        },
        { status: l1Response.status }
      )
    }
    
    const l1Data = await l1Response.json()
    console.log('✅ L1 lock successful:', l1Data)
    
    // Return success response
    return NextResponse.json({
      success: true,
      lock_id: l1Data.lock_id || l1Data.lockId,
      amount: payload.amount,
      wallet_address: signedRequest.wallet_address,
      target_layer: payload.target_layer,
      timestamp: signedRequest.timestamp,
      message: 'Tokens locked on L1. L2 credit will be processed automatically.',
      l1_response: l1Data,
    })
    
  } catch (error: any) {
    console.error('❌ Bridge initiate error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Bridge operation failed', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
