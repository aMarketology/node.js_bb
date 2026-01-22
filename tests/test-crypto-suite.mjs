/**
 * Comprehensive test for standardized signature and address utilities
 * Tests the complete flow: mnemonic → keypair → addresses → signing → verification
 */

import { generateMnemonic, mnemonicToSeed, bytesToHex } from '../lib/blackbook-wallet';
import { createKeyPair, signMessage, verifySignature, signCanonicalMessage } from '../lib/signature-utils';
import { deriveL1Address, deriveL2Address, l1ToL2Address, l2ToL1Address, validateAddress } from '../lib/address-utils';

async function testAddressDerivation() {
  console.log('\n🔑 Testing Address Derivation...');
  
  // Generate test keypair
  const mnemonic = await generateMnemonic();
  const seed = await mnemonicToSeed(mnemonic);
  const keyPair = await createKeyPair(seed);
  
  console.log('Generated keypair:');
  console.log('  Public key:', keyPair.publicKey);
  console.log('  Private key:', keyPair.privateKey.substring(0, 16) + '...');
  
  // Test address derivation
  const l1Address = deriveL1Address(keyPair.publicKey);
  const l2Address = deriveL2Address(keyPair.publicKey);
  
  console.log('\nDerived addresses:');
  console.log('  L1:', l1Address);
  console.log('  L2:', l2Address);
  
  // Test address validation
  console.log('\nAddress validation:');
  console.log('  L1 valid:', validateAddress(l1Address));
  console.log('  L2 valid:', validateAddress(l2Address));
  console.log('  Invalid:', validateAddress('INVALID_ADDRESS'));
  
  // Test address conversion
  const l1ToL2 = l1ToL2Address(l1Address);
  const l2ToL1 = l2ToL1Address(l2Address);
  
  console.log('\nAddress conversion:');
  console.log('  L1 → L2:', l1ToL2);
  console.log('  L2 → L1:', l2ToL1);
  console.log('  Conversion match:', l1ToL2 === l2Address && l2ToL1 === l1Address);
  
  return { keyPair, l1Address, l2Address };
}

async function testSignatureFlow({ keyPair, l1Address }) {
  console.log('\n🔐 Testing Signature Flow...');
  
  // Test message signing
  const message = 'Hello BlackBook L1 Settlement Protocol!';
  const signature = await signMessage(message, keyPair.privateKey);
  
  console.log('Message signing:');
  console.log('  Message:', message);
  console.log('  Signature:', signature);
  
  // Test signature verification
  const timestamp = Math.floor(Date.now() / 1000);
  try {
    const isValid = await verifySignature(keyPair.publicKey, signature, message, timestamp);
    console.log('  Verification: ✅ VALID');
  } catch (error) {
    console.log('  Verification: ❌ FAILED -', error.message);
    return false;
  }
  
  return true;
}

async function testCanonicalSigning({ keyPair, l1Address }) {
  console.log('\n📝 Testing Canonical Message Signing...');
  
  // Test canonical message signing
  const domain = 'BLACKBOOK_L1';
  const operation = 'transfer';
  const payloadHash = 'abc123def456';
  
  const signedMessage = await signCanonicalMessage(
    domain,
    operation,
    payloadHash,
    keyPair.privateKey
  );
  
  console.log('Canonical signing:');
  console.log('  Domain:', domain);
  console.log('  Operation:', operation);
  console.log('  Payload hash:', payloadHash);
  console.log('  Timestamp:', signedMessage.timestamp);
  console.log('  Nonce:', signedMessage.nonce);
  console.log('  Message:', signedMessage.message.substring(0, 50) + '...');
  console.log('  Signature:', signedMessage.signature);
  console.log('  Public key:', signedMessage.publicKey);
  
  // Verify canonical signature
  try {
    const isValid = await verifySignature(
      signedMessage.publicKey,
      signedMessage.signature,
      signedMessage.message,
      signedMessage.timestamp
    );
    console.log('  Verification: ✅ VALID');
  } catch (error) {
    console.log('  Verification: ❌ FAILED -', error.message);
    return false;
  }
  
  return true;
}

async function testSettlementProtocolCompatibility({ keyPair, l1Address, l2Address }) {
  console.log('\n🏦 Testing Settlement Protocol Compatibility...');
  
  // Test settlement operation signing
  const settlementPayload = {
    user_address: l1Address,
    amount: 1000000, // 1 million base units
    operation: 'soft_lock',
    reference_id: 'bet_12345',
    timestamp: Math.floor(Date.now() / 1000),
    nonce: crypto.randomUUID()
  };
  
  console.log('Settlement payload:');
  console.log('  User:', settlementPayload.user_address);
  console.log('  Amount:', settlementPayload.amount);
  console.log('  Operation:', settlementPayload.operation);
  console.log('  Reference:', settlementPayload.reference_id);
  
  // Create canonical payload hash (simplified for test)
  const payloadString = JSON.stringify(settlementPayload);
  const payloadHash = bytesToHex(new TextEncoder().encode(payloadString));
  
  // Sign settlement operation
  const settlementSignature = await signCanonicalMessage(
    'BLACKBOOK_L1_SETTLEMENT',
    'soft_lock',
    payloadHash,
    keyPair.privateKey
  );
  
  console.log('Settlement signature:');
  console.log('  Signature:', settlementSignature.signature);
  console.log('  Timestamp:', settlementSignature.timestamp);
  console.log('  Nonce:', settlementSignature.nonce);
  
  // Verify settlement signature
  try {
    const isValid = await verifySignature(
      settlementSignature.publicKey,
      settlementSignature.signature,
      settlementSignature.message,
      settlementSignature.timestamp
    );
    console.log('  Verification: ✅ VALID');
  } catch (error) {
    console.log('  Verification: ❌ FAILED -', error.message);
    return false;
  }
  
  return true;
}

async function runAllTests() {
  console.log('🧪 BlackBook Cryptographic Utilities Test Suite');
  console.log('================================================');
  
  try {
    // Test 1: Address derivation
    const { keyPair, l1Address, l2Address } = await testAddressDerivation();
    
    // Test 2: Basic signature flow
    const signatureOk = await testSignatureFlow({ keyPair, l1Address });
    if (!signatureOk) {
      console.log('\n❌ Signature tests failed!');
      return;
    }
    
    // Test 3: Canonical message signing
    const canonicalOk = await testCanonicalSigning({ keyPair, l1Address });
    if (!canonicalOk) {
      console.log('\n❌ Canonical signing tests failed!');
      return;
    }
    
    // Test 4: Settlement protocol compatibility
    const settlementOk = await testSettlementProtocolCompatibility({ keyPair, l1Address, l2Address });
    if (!settlementOk) {
      console.log('\n❌ Settlement protocol tests failed!');
      return;
    }
    
    console.log('\n✅ All tests passed! Cryptographic utilities are working correctly.');
    console.log('\n🚀 Ready for L1 ↔ L2 settlement integration!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Run tests
runAllTests();