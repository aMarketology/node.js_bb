/**
 * Bridge Integration Test - Real L1 & L2 Connection
 * Tests the complete bridge flow with Alice's test account
 * 
 * Run: node tests/test-bridge-real.js
 */

import { createKeyPair, signMessage, hexToBytes, bytesToHex } from '../lib/signature-utils.js';
import { CreditPredictionSDK } from '../credit-prediction-actions-sdk.js';

const L1_API = process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080';
const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234';

// Alice's test account (from test-accounts.js)
const ALICE = {
  name: 'Alice',
  // Ed25519 seed (32 bytes) - this is the private key seed
  seed: '18f2c2e3bcb7a4b5329cfed4bd79bf17df4d47aa1888a6b3d1a1450fb53a8a24',
  // Derived public key
  publicKey: 'c0e349153cbc75e9529b5f1963205cab783463c6835c826a7587e0e0903c6705',
  l1Address: 'L1_52882D768C0F3E7932AAD1813CF8B19058D507A8',
  l2Address: 'L2_52882D768C0F3E7932AAD1813CF8B19058D507A8',
};

// Create signer function for Alice
async function createAliceSigner() {
  // Derive keypair from seed
  const seed = hexToBytes(ALICE.seed);
  const keyPair = await createKeyPair(seed);
  
  console.log('🔑 Alice keypair derived:');
  console.log('   Public key:', keyPair.publicKey);
  console.log('   Expected:  ', ALICE.publicKey);
  
  // Return signer function
  return async (message) => {
    return await signMessage(message, keyPair.privateKey);
  };
}

// Check server health
async function checkHealth() {
  console.log('\n📡 Checking server health...\n');
  
  try {
    const l1Health = await fetch(`${L1_API}/health`);
    const l1Data = await l1Health.json();
    console.log('✅ L1 Server:', l1Data.status, `(${l1Data.engine} ${l1Data.version})`);
  } catch (e) {
    console.log('❌ L1 Server: Not responding');
    return false;
  }
  
  try {
    const l2Health = await fetch(`${L2_API}/health`);
    const l2Data = await l2Health.json();
    console.log('✅ L2 Server:', l2Data.status, `(${l2Data.market_count} markets)`);
  } catch (e) {
    console.log('❌ L2 Server: Not responding');
    return false;
  }
  
  return true;
}

// Check balances
async function checkBalances() {
  console.log('\n💰 Checking balances...\n');
  
  // L1 Balance
  try {
    const l1Res = await fetch(`${L1_API}/balance/${ALICE.l1Address}`);
    const l1Data = await l1Res.json();
    console.log(`L1 Balance (${ALICE.l1Address}):`);
    console.log(`   Available: ${l1Data.balance || l1Data.available || 0} $BC`);
    console.log(`   Locked:    ${l1Data.locked || 0} $BC`);
  } catch (e) {
    console.log('❌ Failed to get L1 balance:', e.message);
  }
  
  // L2 Balance
  try {
    const l2Res = await fetch(`${L2_API}/balance/${ALICE.l2Address}`);
    const l2Data = await l2Res.json();
    console.log(`\nL2 Balance (${ALICE.l2Address}):`);
    console.log(`   Available: ${l2Data.available || l2Data.balance || 0} $BB`);
    console.log(`   Locked:    ${l2Data.locked || 0} $BB`);
  } catch (e) {
    console.log('❌ Failed to get L2 balance:', e.message);
  }
}

// Test bridge deposit (L1 → L2)
async function testBridgeDeposit(amount = 10) {
  console.log('\n🌉 Testing Bridge Deposit (L1 → L2)...\n');
  console.log(`   Amount: ${amount} $BC`);
  
  const signer = await createAliceSigner();
  
  // Create SDK instance
  const sdk = new CreditPredictionSDK({
    l1Url: L1_API,
    l2Url: L2_API,
    address: ALICE.l2Address,
    publicKey: ALICE.publicKey,
    signer: signer
  });
  
  try {
    // Check L1 balance first
    console.log('\n📊 Step 0: Checking L1 balance...');
    const l1Balance = await sdk.getL1Balance();
    console.log(`   L1 Available: ${l1Balance.available} $BC`);
    
    if (l1Balance.available < amount) {
      console.log(`❌ Insufficient L1 balance. Need ${amount}, have ${l1Balance.available}`);
      return;
    }
    
    // Full bridge flow
    console.log('\n🔒 Step 1: Locking on L1...');
    const result = await sdk.bridge(amount);
    
    if (result.success) {
      console.log('\n✅ BRIDGE SUCCESSFUL!');
      console.log(`   Lock ID: ${result.lockId}`);
      console.log(`   New L2 Balance: ${result.newL2Balance} $BB`);
    } else {
      console.log('\n❌ Bridge failed:', result);
    }
    
  } catch (error) {
    console.log('\n❌ Bridge error:', error.message);
    console.log('   Stack:', error.stack);
  }
}

// Test withdrawal (L2 → L1)
async function testWithdrawal(amount = 5) {
  console.log('\n📤 Testing Withdrawal (L2 → L1)...\n');
  console.log(`   Amount: ${amount} $BB`);
  
  const signer = await createAliceSigner();
  
  const sdk = new CreditPredictionSDK({
    l1Url: L1_API,
    l2Url: L2_API,
    address: ALICE.l2Address,
    publicKey: ALICE.publicKey,
    signer: signer
  });
  
  try {
    // Check L2 balance first
    console.log('\n📊 Checking L2 balance...');
    const l2Balance = await sdk.getBalance();
    console.log(`   L2 Available: ${l2Balance.available} $BB`);
    
    if (l2Balance.available < amount) {
      console.log(`❌ Insufficient L2 balance. Need ${amount}, have ${l2Balance.available}`);
      return;
    }
    
    // Withdraw
    console.log('\n🔓 Initiating withdrawal...');
    const result = await sdk.withdraw(amount);
    
    if (result.success) {
      console.log('\n✅ WITHDRAWAL INITIATED!');
      console.log(`   Withdrawal ID: ${result.withdrawalId}`);
      console.log(`   Amount: ${result.amount} $BB`);
      console.log(`   Status: ${result.status}`);
      console.log('\n   ℹ️  Withdrawal will be processed in next batch (~5 min)');
    } else {
      console.log('\n❌ Withdrawal failed:', result);
    }
    
  } catch (error) {
    console.log('\n❌ Withdrawal error:', error.message);
  }
}

// Main test flow
async function main() {
  console.log('═'.repeat(60));
  console.log('  BLACKBOOK BRIDGE INTEGRATION TEST');
  console.log('═'.repeat(60));
  console.log(`\nTest Account: ${ALICE.name}`);
  console.log(`L1 Address: ${ALICE.l1Address}`);
  console.log(`L2 Address: ${ALICE.l2Address}`);
  
  // Check servers
  const healthy = await checkHealth();
  if (!healthy) {
    console.log('\n❌ Servers not healthy. Aborting test.');
    return;
  }
  
  // Show initial balances
  await checkBalances();
  
  // Test bridge deposit (10 $BC)
  await testBridgeDeposit(10);
  
  // Show updated balances
  console.log('\n📊 Updated Balances After Bridge:');
  await checkBalances();
  
  // Optionally test withdrawal
  // await testWithdrawal(5);
  
  console.log('\n' + '═'.repeat(60));
  console.log('  TEST COMPLETE');
  console.log('═'.repeat(60));
}

main().catch(console.error);
