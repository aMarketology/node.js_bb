/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 1 TEST: User Wallet L2 Signing with On-Demand Key Derivation
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests the derivePrivateKeyOnDemand() function using Mac's real vault.
 * This validates that user wallets can sign L2 transactions without
 * storing private keys - keys are derived on-demand from the vault.
 * 
 * Run: node mac-tests/phase1-user-wallet-signing.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';

// ═══════════════════════════════════════════════════════════════════════════
// MAC'S WALLET CREDENTIALS (from macwallet.txt)
// ═══════════════════════════════════════════════════════════════════════════

const MAC_WALLET = {
  username: 'mac_blackbook',
  email: 'mac@blackbook.io',
  l1Address: 'L1_94B3C863E068096596CE80F04C2233B72AE11790',
  l2Address: 'L2_94B3C863E068096596CE80F04C2233B72AE11790',
  publicKey: 'ec6941c71740e192bbf5933d5f9cc18ea161329ce864da900d8de73d45c28752',
  vault: {
    salt: '579a5c28a02f8c3ecc2801545a216cec',
    encryptedBlob: 'U2FsdGVkX19443Y8LJ1PaUV6/aG4Ctod88tWo7AVDftZlcgWurkSGAhVEAScVQ91+Ew9iP0d588HfIUYlXQPGEmIMDhjj3M6cDPbDtnTZFh848l0Z71CjV0CpB41Avad',
    algorithm: 'AES-256',
    kdf: 'PBKDF2',
    iterations: 100000
  },
  password: 'MacSecurePassword2026!'
};

// ═══════════════════════════════════════════════════════════════════════════
// VAULT SESSION SIMULATION (matches lib/blackbook-wallet.ts)
// ═══════════════════════════════════════════════════════════════════════════

function createVaultSession(address, publicKey, encryptedBlob, nonce, salt) {
  return {
    address,
    publicKey,
    encryptedBlob,
    nonce: nonce || null,
    salt
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CRYPTO HELPERS (using CryptoJS - exact match to wallet creation)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Decrypt vault using CryptoJS - matches the exact code from macwallet.txt
 * 
 * Steps:
 * 1. Derive encryption key using PBKDF2
 * 2. Decrypt the vault using AES with the key as passphrase
 * 3. Return the seed hex string
 */
function decryptVaultCryptoJS(encryptedBlob, password, vaultSalt) {
  // 1. Derive encryption key using PBKDF2
  const encryptionKey = CryptoJS.PBKDF2(password, vaultSalt, {
    keySize: 256 / 32,
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256
  });
  
  // 2. Decrypt the vault to get seed
  const decrypted = CryptoJS.AES.decrypt(
    encryptedBlob, 
    encryptionKey.toString()
  );
  
  // 3. Convert to UTF8 string (should be hex seed)
  const seedHex = decrypted.toString(CryptoJS.enc.Utf8);
  
  return seedHex;
}

// ═══════════════════════════════════════════════════════════════════════════
// ON-DEMAND KEY DERIVATION (mirrors derivePrivateKeyOnDemand from blackbook-wallet.ts)
// ═══════════════════════════════════════════════════════════════════════════

async function derivePrivateKeyOnDemand(vaultSession, password) {
  console.log('🔐 Deriving keys on-demand...');
  console.log('   Address:', vaultSession.address);
  console.log('   Salt:', vaultSession.salt?.substring(0, 16) + '...');
  
  if (!vaultSession.encryptedBlob || !vaultSession.salt) {
    throw new Error('Vault session missing encrypted blob or salt');
  }
  
  // Decrypt the vault to get seed (CryptoJS format)
  const seedHex = decryptVaultCryptoJS(vaultSession.encryptedBlob, password, vaultSession.salt);
  
  if (!seedHex || seedHex.length !== 64) {
    throw new Error('Failed to decrypt vault - invalid password or corrupted vault');
  }
  
  console.log('   ✓ Vault decrypted successfully');
  
  // Derive Ed25519 keypair from seed
  const seedBytes = Buffer.from(seedHex, 'hex');
  const keypair = nacl.sign.keyPair.fromSeed(new Uint8Array(seedBytes));
  
  console.log('   ✓ Ed25519 keypair derived');
  
  return {
    secretKey: keypair.secretKey,
    publicKey: Buffer.from(keypair.publicKey).toString('hex')
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// L2 SIGNING FUNCTION (mirrors what CreditPredictionContext does)
// ═══════════════════════════════════════════════════════════════════════════

async function signL2Message(vaultSession, password, message) {
  // Derive keys on-demand
  const { secretKey, publicKey } = await derivePrivateKeyOnDemand(vaultSession, password);
  
  // Sign the message (L2 domain: 0x02)
  const domainSeparated = Buffer.concat([
    Buffer.from([0x02]), // L2 chain ID
    Buffer.from(message, 'utf8')
  ]);
  
  const signature = nacl.sign.detached(new Uint8Array(domainSeparated), secretKey);
  
  // CRITICAL: Clear secret key from memory
  secretKey.fill(0);
  console.log('   🗑️ Secret key cleared from memory');
  
  return {
    signature: Buffer.from(signature).toString('hex'),
    publicKey
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

async function runTests() {
  console.log('═'.repeat(70));
  console.log('🧪 PHASE 1 TEST: User Wallet L2 Signing');
  console.log('═'.repeat(70));
  console.log(`   Wallet: ${MAC_WALLET.username}`);
  console.log(`   Address: ${MAC_WALLET.l1Address}`);
  console.log('═'.repeat(70));
  
  let passed = 0;
  let failed = 0;
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Vault Session Creation
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 1: Create Vault Session');
  try {
    const session = createVaultSession(
      MAC_WALLET.l1Address,
      MAC_WALLET.publicKey,
      MAC_WALLET.vault.encryptedBlob,
      null,
      MAC_WALLET.vault.salt
    );
    
    if (session.address === MAC_WALLET.l1Address && 
        session.publicKey === MAC_WALLET.publicKey &&
        session.salt === MAC_WALLET.vault.salt) {
      console.log('   ✅ PASSED: Vault session created correctly');
      passed++;
    } else {
      console.log('   ❌ FAILED: Vault session data mismatch');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: On-Demand Key Derivation
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 2: On-Demand Key Derivation');
  try {
    const session = createVaultSession(
      MAC_WALLET.l1Address,
      MAC_WALLET.publicKey,
      MAC_WALLET.vault.encryptedBlob,
      null,
      MAC_WALLET.vault.salt
    );
    
    const { secretKey, publicKey } = await derivePrivateKeyOnDemand(session, MAC_WALLET.password);
    
    if (publicKey === MAC_WALLET.publicKey) {
      console.log('   ✅ PASSED: Derived public key matches stored public key');
      console.log(`      Expected: ${MAC_WALLET.publicKey.substring(0, 32)}...`);
      console.log(`      Got:      ${publicKey.substring(0, 32)}...`);
      passed++;
    } else {
      console.log('   ❌ FAILED: Public key mismatch');
      console.log(`      Expected: ${MAC_WALLET.publicKey}`);
      console.log(`      Got:      ${publicKey}`);
      failed++;
    }
    
    // Clear secret key
    secretKey.fill(0);
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: Wrong Password Rejection
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 3: Wrong Password Rejection');
  try {
    const session = createVaultSession(
      MAC_WALLET.l1Address,
      MAC_WALLET.publicKey,
      MAC_WALLET.vault.encryptedBlob,
      null,
      MAC_WALLET.vault.salt
    );
    
    await derivePrivateKeyOnDemand(session, 'WrongPassword123!');
    console.log('   ❌ FAILED: Should have thrown error for wrong password');
    failed++;
  } catch (error) {
    console.log('   ✅ PASSED: Correctly rejected wrong password');
    console.log(`      Error: ${error.message}`);
    passed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: L2 Message Signing
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 4: L2 Message Signing');
  try {
    const session = createVaultSession(
      MAC_WALLET.l1Address,
      MAC_WALLET.publicKey,
      MAC_WALLET.vault.encryptedBlob,
      null,
      MAC_WALLET.vault.salt
    );
    
    const testMessage = JSON.stringify({
      action: 'bet',
      market_id: 'test-market-123',
      amount: 100,
      timestamp: Date.now()
    });
    
    const { signature, publicKey } = await signL2Message(session, MAC_WALLET.password, testMessage);
    
    // Verify the signature
    const domainSeparated = Buffer.concat([
      Buffer.from([0x02]),
      Buffer.from(testMessage, 'utf8')
    ]);
    
    const isValid = nacl.sign.detached.verify(
      new Uint8Array(domainSeparated),
      new Uint8Array(Buffer.from(signature, 'hex')),
      new Uint8Array(Buffer.from(publicKey, 'hex'))
    );
    
    if (isValid) {
      console.log('   ✅ PASSED: L2 signature is valid');
      console.log(`      Signature: ${signature.substring(0, 32)}...`);
      passed++;
    } else {
      console.log('   ❌ FAILED: L2 signature verification failed');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: Simulate Bet Transaction Signing
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 5: Simulate Bet Transaction Signing');
  try {
    const session = createVaultSession(
      MAC_WALLET.l1Address,
      MAC_WALLET.publicKey,
      MAC_WALLET.vault.encryptedBlob,
      null,
      MAC_WALLET.vault.salt
    );
    
    // Simulate a real bet transaction
    const betPayload = {
      action: 'buy',
      wallet: MAC_WALLET.l2Address,
      market_id: 'btc-price-100k',
      option: 'yes',
      amount: 50,
      timestamp: Date.now()
    };
    
    const { signature, publicKey } = await signL2Message(
      session, 
      MAC_WALLET.password, 
      JSON.stringify(betPayload)
    );
    
    console.log('   ✅ PASSED: Bet transaction signed successfully');
    console.log('   📦 Signed Request:');
    console.log(`      wallet_address: ${MAC_WALLET.l2Address}`);
    console.log(`      public_key: ${publicKey.substring(0, 32)}...`);
    console.log(`      signature: ${signature.substring(0, 32)}...`);
    console.log(`      payload: ${JSON.stringify(betPayload).substring(0, 50)}...`);
    passed++;
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  console.log('📊 PHASE 1 TEST RESULTS');
  console.log('═'.repeat(70));
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('═'.repeat(70));
  
  if (failed === 0) {
    console.log('🎉 All Phase 1 tests passed! User wallet signing is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Review the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
