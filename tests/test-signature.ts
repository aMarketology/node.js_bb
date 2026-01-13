// Test signature format for debugging
import {
  signTransfer,
  createKeyPair,
  mnemonicToSeed,
  generateMnemonic,
  deriveL1Address,
  bytesToHex
} from '../lib/blackbook-wallet'

async function test() {
  // Generate a test wallet
  const mnemonic = await generateMnemonic()
  const seed = await mnemonicToSeed(mnemonic)
  const keyPair = createKeyPair(seed)
  const address = await deriveL1Address(keyPair.publicKey)
  
  console.log('Test Wallet:')
  console.log('- Address:', address)
  console.log('- Public Key:', bytesToHex(keyPair.publicKey))
  
  // Sign a test transfer
  const signedRequest = await signTransfer(
    keyPair.secretKey,
    keyPair.publicKey,
    address,
    'L1_TEST_RECIPIENT',
    10
  )
  
  console.log('\nSigned Request:')
  console.log(JSON.stringify(signedRequest, null, 2))
  
  console.log('\nSignature Format Check:')
  console.log('- Chain ID type:', typeof signedRequest.chain_id)
  console.log('- Chain ID value:', signedRequest.chain_id)
  console.log('- Chain ID hex:', '0x' + signedRequest.chain_id.toString(16).padStart(2, '0'))
  console.log('- Signature length:', signedRequest.signature.length, 'chars')
}

test().catch(console.error)
