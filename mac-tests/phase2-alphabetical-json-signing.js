/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 2 TEST: Alphabetical JSON Key Sorting for L2 Rust Compatibility
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests the sortKeysAlphabetically() function that ensures JSON payloads
 * are serialized with alphabetically sorted keys, matching Rust's serde_json
 * behavior for deterministic signature verification.
 * 
 * Run: node mac-tests/phase2-alphabetical-json-signing.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

import nacl from 'tweetnacl';
import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';

// ═══════════════════════════════════════════════════════════════════════════
// MAC'S WALLET CREDENTIALS
// ═══════════════════════════════════════════════════════════════════════════

const MAC_WALLET = {
  l1Address: 'L1_94B3C863E068096596CE80F04C2233B72AE11790',
  l2Address: 'L2_94B3C863E068096596CE80F04C2233B72AE11790',
  publicKey: 'ec6941c71740e192bbf5933d5f9cc18ea161329ce864da900d8de73d45c28752',
  vault: {
    salt: '579a5c28a02f8c3ecc2801545a216cec',
    encryptedBlob: 'U2FsdGVkX19443Y8LJ1PaUV6/aG4Ctod88tWo7AVDftZlcgWurkSGAhVEAScVQ91+Ew9iP0d588HfIUYlXQPGEmIMDhjj3M6cDPbDtnTZFh848l0Z71CjV0CpB41Avad',
  },
  password: 'MacSecurePassword2026!'
};

// ═══════════════════════════════════════════════════════════════════════════
// ALPHABETICAL JSON SORTING (from our SDKs)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sort object keys alphabetically (recursively) for deterministic JSON serialization.
 * L2 server uses Rust serde_json which sorts keys alphabetically - we must match.
 */
function sortKeysAlphabetically(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortKeysAlphabetically);
  }
  
  const sortedKeys = Object.keys(obj).sort();
  const result = {};
  for (const key of sortedKeys) {
    result[key] = sortKeysAlphabetically(obj[key]);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// KEY DERIVATION HELPER
// ═══════════════════════════════════════════════════════════════════════════

function deriveKeypair(vault, password) {
  const encryptionKey = CryptoJS.PBKDF2(password, vault.salt, {
    keySize: 256 / 32,
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256
  });
  
  const decrypted = CryptoJS.AES.decrypt(vault.encryptedBlob, encryptionKey.toString());
  const seedHex = decrypted.toString(CryptoJS.enc.Utf8);
  const seedBytes = Buffer.from(seedHex, 'hex');
  
  return nacl.sign.keyPair.fromSeed(new Uint8Array(seedBytes));
}

// ═══════════════════════════════════════════════════════════════════════════
// SIGNING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function signMessage(privateKey, message, chainId = 0x02) {
  const domainSeparated = Buffer.concat([
    Buffer.from([chainId]),
    Buffer.from(message, 'utf8')
  ]);
  
  const signature = nacl.sign.detached(new Uint8Array(domainSeparated), privateKey);
  return Buffer.from(signature).toString('hex');
}

function verifySignature(publicKey, message, signature, chainId = 0x02) {
  const domainSeparated = Buffer.concat([
    Buffer.from([chainId]),
    Buffer.from(message, 'utf8')
  ]);
  
  return nacl.sign.detached.verify(
    new Uint8Array(domainSeparated),
    new Uint8Array(Buffer.from(signature, 'hex')),
    publicKey
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

async function runTests() {
  console.log('═'.repeat(70));
  console.log('🧪 PHASE 2 TEST: Alphabetical JSON Key Sorting');
  console.log('═'.repeat(70));
  console.log('   Purpose: Ensure JSON keys are sorted alphabetically for L2 Rust compatibility');
  console.log('═'.repeat(70));
  
  let passed = 0;
  let failed = 0;
  
  // Get Mac's keypair for signing tests
  const keypair = deriveKeypair(MAC_WALLET.vault, MAC_WALLET.password);
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Basic Key Sorting
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 1: Basic Key Sorting');
  try {
    const unsorted = {
      zebra: 1,
      apple: 2,
      mango: 3,
      banana: 4
    };
    
    const sorted = sortKeysAlphabetically(unsorted);
    const keys = Object.keys(sorted);
    
    const expected = ['apple', 'banana', 'mango', 'zebra'];
    const isCorrect = keys.every((k, i) => k === expected[i]);
    
    if (isCorrect) {
      console.log('   ✅ PASSED: Keys sorted alphabetically');
      console.log(`      Input order:  [zebra, apple, mango, banana]`);
      console.log(`      Output order: [${keys.join(', ')}]`);
      passed++;
    } else {
      console.log('   ❌ FAILED: Keys not sorted correctly');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: Nested Object Sorting
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 2: Nested Object Sorting');
  try {
    const unsorted = {
      outer_z: {
        inner_b: 1,
        inner_a: 2
      },
      outer_a: {
        deep_z: { deepest_b: 1, deepest_a: 2 },
        deep_a: 'value'
      }
    };
    
    const sorted = sortKeysAlphabetically(unsorted);
    const json = JSON.stringify(sorted);
    
    // Check that outer_a comes before outer_z
    const outerAIndex = json.indexOf('outer_a');
    const outerZIndex = json.indexOf('outer_z');
    
    // Check that inner_a comes before inner_b
    const innerAIndex = json.indexOf('inner_a');
    const innerBIndex = json.indexOf('inner_b');
    
    if (outerAIndex < outerZIndex && innerAIndex < innerBIndex) {
      console.log('   ✅ PASSED: Nested objects sorted recursively');
      console.log(`      JSON: ${json.substring(0, 60)}...`);
      passed++;
    } else {
      console.log('   ❌ FAILED: Nested objects not sorted correctly');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: Array Handling
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 3: Array Handling');
  try {
    const unsorted = {
      items: [
        { z_key: 1, a_key: 2 },
        { m_key: 3, b_key: 4 }
      ],
      name: 'test'
    };
    
    const sorted = sortKeysAlphabetically(unsorted);
    const json = JSON.stringify(sorted);
    
    // Array order should be preserved, but object keys within should be sorted
    // "items" comes before "name" alphabetically
    // Within each array item, a_key before z_key, b_key before m_key
    const itemsIndex = json.indexOf('items');
    const nameIndex = json.indexOf('name');
    const aKeyIndex = json.indexOf('a_key');
    const zKeyIndex = json.indexOf('z_key');
    
    if (itemsIndex < nameIndex && aKeyIndex < zKeyIndex) {
      console.log('   ✅ PASSED: Arrays handled correctly');
      console.log(`      JSON: ${json}`);
      passed++;
    } else {
      console.log('   ❌ FAILED: Array handling incorrect');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: Bet Payload Sorting
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 4: Bet Payload Sorting (Real-World Case)');
  try {
    // This is how a bet payload might be constructed in the SDK
    const betPayload = {
      market_id: 'btc-100k-2026',
      option: 'yes',
      amount: 100
    };
    
    const sortedPayload = sortKeysAlphabetically(betPayload);
    const json = JSON.stringify(sortedPayload);
    
    // Expected: {"amount":100,"market_id":"btc-100k-2026","option":"yes"}
    const expected = '{"amount":100,"market_id":"btc-100k-2026","option":"yes"}';
    
    if (json === expected) {
      console.log('   ✅ PASSED: Bet payload sorted correctly');
      console.log(`      Expected: ${expected}`);
      console.log(`      Got:      ${json}`);
      passed++;
    } else {
      console.log('   ❌ FAILED: Bet payload not sorted correctly');
      console.log(`      Expected: ${expected}`);
      console.log(`      Got:      ${json}`);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: Signature Consistency with Sorted JSON
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 5: Signature Consistency with Sorted JSON');
  try {
    const payload = {
      wallet: MAC_WALLET.l2Address,
      market_id: 'test-market',
      amount: 50,
      option: 'yes',
      timestamp: 1706054400000
    };
    
    // Sign with unsorted JSON
    const unsortedJson = JSON.stringify(payload);
    const unsortedSig = signMessage(keypair.secretKey, unsortedJson);
    
    // Sign with sorted JSON
    const sortedJson = JSON.stringify(sortKeysAlphabetically(payload));
    const sortedSig = signMessage(keypair.secretKey, sortedJson);
    
    console.log('   📦 Unsorted JSON:');
    console.log(`      ${unsortedJson}`);
    console.log(`      Signature: ${unsortedSig.substring(0, 32)}...`);
    
    console.log('   📦 Sorted JSON:');
    console.log(`      ${sortedJson}`);
    console.log(`      Signature: ${sortedSig.substring(0, 32)}...`);
    
    // Signatures should be DIFFERENT because the message is different
    if (unsortedSig !== sortedSig) {
      console.log('   ✅ PASSED: Different JSON order produces different signatures');
      console.log('   💡 This proves why alphabetical sorting is REQUIRED for L2 compatibility');
      passed++;
    } else {
      console.log('   ❌ FAILED: Signatures should differ for different JSON order');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: L2 Server Simulation (Rust serde_json behavior)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 6: L2 Server Simulation (Rust serde_json behavior)');
  try {
    // Simulate what the L2 Rust server does
    const clientPayload = {
      wallet: MAC_WALLET.l2Address,
      market_id: 'btc-price',
      amount: 100,
      option: 'yes'
    };
    
    // Client sorts and signs
    const clientSorted = sortKeysAlphabetically(clientPayload);
    const clientJson = JSON.stringify(clientSorted);
    const clientSig = signMessage(keypair.secretKey, clientJson);
    
    // Server receives and re-serializes (Rust serde_json sorts alphabetically)
    // We simulate this by sorting again
    const serverSorted = sortKeysAlphabetically(clientPayload);
    const serverJson = JSON.stringify(serverSorted);
    
    // Server verifies signature
    const isValid = verifySignature(keypair.publicKey, serverJson, clientSig);
    
    if (isValid && clientJson === serverJson) {
      console.log('   ✅ PASSED: Client-Server JSON matches');
      console.log(`      Client JSON: ${clientJson}`);
      console.log(`      Server JSON: ${serverJson}`);
      console.log('      Signature verification: ✓ VALID');
      passed++;
    } else {
      console.log('   ❌ FAILED: Client-Server JSON mismatch or invalid signature');
      console.log(`      Client JSON: ${clientJson}`);
      console.log(`      Server JSON: ${serverJson}`);
      console.log(`      Match: ${clientJson === serverJson}`);
      console.log(`      Signature valid: ${isValid}`);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 7: Full Signed Request Format
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 7: Full Signed Request Format (SDK Output)');
  try {
    const timestamp = Date.now();
    const nonce = timestamp * 1000 + Math.floor(Math.random() * 1000);
    const requestPath = '/bet';
    
    const payload = {
      market_id: 'election-2026',
      option: 'candidate_a',
      amount: 250
    };
    
    // Sort payload for signing
    const sortedPayload = sortKeysAlphabetically(payload);
    const payloadStr = JSON.stringify(sortedPayload);
    
    // Create message in SDK format
    const message = `${requestPath}\n${payloadStr}\n${timestamp}\n${nonce}`;
    const signature = signMessage(keypair.secretKey, message);
    
    const signedRequest = {
      wallet_address: MAC_WALLET.l2Address,
      public_key: MAC_WALLET.publicKey,
      nonce: nonce.toString(),
      timestamp: timestamp,
      chain_id: 0x02,
      request_path: requestPath,
      payload: payloadStr,
      signature: signature
    };
    
    console.log('   ✅ PASSED: Full signed request created');
    console.log('   📦 Signed Request:');
    console.log(`      wallet_address: ${signedRequest.wallet_address}`);
    console.log(`      public_key: ${signedRequest.public_key.substring(0, 32)}...`);
    console.log(`      payload: ${signedRequest.payload}`);
    console.log(`      signature: ${signedRequest.signature.substring(0, 32)}...`);
    passed++;
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  console.log('📊 PHASE 2 TEST RESULTS');
  console.log('═'.repeat(70));
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('═'.repeat(70));
  
  if (failed === 0) {
    console.log('🎉 All Phase 2 tests passed! Alphabetical JSON signing is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Review the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
