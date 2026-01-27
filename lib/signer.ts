/**
 * Shared Ed25519 Signer Utility
 * Supports domain separation for L1 (chainId=1) and L2 (chainId=2)
 */

import * as ed25519 from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha2.js'

// Configure ed25519 to use sha512 - required by @noble/ed25519
// @ts-ignore - sha512Sync exists but not in type definitions
ed25519.etc.sha512Sync = (...m: Uint8Array[]) => sha512(ed25519.etc.concatBytes(...m))

console.log('✅ Ed25519 sha512 configured')

export interface SignerOptions {
  chainId?: number
  operation?: string
}

/**
 * Create a signer function for test wallets with stored keys
 */
export function createTestWalletSigner(privateKeyHex: string, publicKeyHex: string) {
  return async (message: string, options?: SignerOptions): Promise<string> => {
    console.log('🔐 Test Wallet Signer Called')
    console.log('   Public Key:', publicKeyHex)
    console.log('   Options:', options)
    
    // Convert private key from hex (32 bytes)
    const privateKeyBytes = new Uint8Array(Buffer.from(privateKeyHex, 'hex'))
    
    let messageBytes = new Uint8Array(Buffer.from(message, 'utf8'))
    
    // Apply domain separation if chainId is provided
    if (options?.chainId) {
      const chainIdByte = new Uint8Array([options.chainId])
      const domainSeparated = new Uint8Array(chainIdByte.length + messageBytes.length)
      domainSeparated.set(chainIdByte, 0)
      domainSeparated.set(messageBytes, chainIdByte.length)
      messageBytes = domainSeparated
      
      console.log('🔐 Domain Separation Applied:')
      console.log('   Chain ID:', options.chainId)
      console.log('   Operation:', options.operation)
      console.log('   Domain separated (first 50 bytes):', Buffer.from(messageBytes).toString('hex').substring(0, 100))
    }
    
    // Sign with @noble/ed25519
    const signature = await ed25519.sign(messageBytes, privateKeyBytes)
    const signatureHex = Buffer.from(signature).toString('hex')
    
    console.log('✅ Signature created:', signatureHex.substring(0, 32) + '...')
    
    return signatureHex
  }
}
