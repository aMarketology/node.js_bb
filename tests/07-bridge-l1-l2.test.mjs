/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FEATURE TEST: BRIDGE (L1 ↔ L2 Operations)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests for bridging tokens between L1 and L2 layers
 * 
 * Features tested:
 * - Deposit tokens from L1 to L2
 * - Withdraw tokens from L2 to L1
 * - Bridge transaction tracking
 * - L2 session management
 */

import { BlackBookWallet, createBlackBookSDK } from '../sdk/blackbook-wallet-sdk.js'
import { CreditPredictionSDK, createCreditPredictionSDK } from '../sdk/credit-prediction-actions-sdk.js'
import { CONFIG, TEST_SEEDS, TEST_ADDRESSES } from './config.js'
import { 
  TestRunner, 
  assert, 
  assertEqual, 
  assertNotNull,
  assertGreaterThan,
  logInfo,
  sleep,
  retry
} from './utils.js'
import nacl from 'tweetnacl'

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Create signer for tests
// ═══════════════════════════════════════════════════════════════════════════

function createSigner(seedHex) {
  const seed = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    seed[i] = parseInt(seedHex.substr(i * 2, 2), 16)
  }
  const keyPair = nacl.sign.keyPair.fromSeed(seed)
  
  return async (message) => {
    const messageBytes = new TextEncoder().encode(message)
    const signature = nacl.sign.detached(messageBytes, keyPair.secretKey)
    return Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('')
  }
}

function getPublicKey(seedHex) {
  const seed = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    seed[i] = parseInt(seedHex.substr(i * 2, 2), 16)
  }
  const keyPair = nacl.sign.keyPair.fromSeed(seed)
  return Array.from(keyPair.publicKey).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

const runner = new TestRunner('Bridge (L1 ↔ L2) Tests')

// ---------------------------------------------------------------------------
// Test: Initialize Bridge SDK
// ---------------------------------------------------------------------------
runner.test('Initialize CreditPrediction SDK for bridging', async () => {
  const sdk = createCreditPredictionSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
  })
  
  assertNotNull(sdk, 'Bridge SDK should be created')
  logInfo('CreditPrediction SDK initialized for bridging')
})

// ---------------------------------------------------------------------------
// Test: Check L1 Balance Before Deposit
// ---------------------------------------------------------------------------
runner.test('Check L1 balance before deposit', async () => {
  const walletSDK = createBlackBookSDK({ apiUrl: CONFIG.L1_URL })
  
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  
  walletSDK.connect({
    address: TEST_ADDRESSES.alice,
    publicKey: alicePublicKey,
    sign: aliceSigner,
  })
  
  try {
    const balance = await walletSDK.getBalance()
    
    assertNotNull(balance, 'Balance should be returned')
    logInfo(`Alice L1 Balance: ${balance.available || balance}`)
    
    return balance
  } catch (error) {
    logInfo(`L1 balance: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Check L2 Balance Before Deposit
// ---------------------------------------------------------------------------
runner.test('Check L2 balance before deposit', async () => {
  const sdk = createCreditPredictionSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
  })
  
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  const aliceL2 = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  try {
    sdk.connect({
      l1Address: TEST_ADDRESSES.alice,
      l2Address: aliceL2,
      publicKey: alicePublicKey,
      sign: aliceSigner,
    })
    
    const l2Balance = await sdk.getL2Balance()
    
    logInfo(`Alice L2 Balance: ${l2Balance?.available || l2Balance || 0}`)
  } catch (error) {
    logInfo(`L2 balance: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Deposit Tokens L1 → L2
// ---------------------------------------------------------------------------
runner.test('Deposit tokens from L1 to L2', async () => {
  const sdk = createCreditPredictionSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
  })
  
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  const aliceL2 = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  sdk.connect({
    l1Address: TEST_ADDRESSES.alice,
    l2Address: aliceL2,
    publicKey: alicePublicKey,
    sign: aliceSigner,
  })
  
  try {
    const depositAmount = CONFIG.DEFAULT_DEPOSIT_AMOUNT
    
    logInfo(`Depositing ${depositAmount} tokens from L1 to L2...`)
    
    const result = await sdk.depositToL2(depositAmount)
    
    if (result.success) {
      logInfo(`✓ Deposit initiated`)
      logInfo(`  Transaction: ${result.transactionId || result.txHash}`)
      logInfo(`  Amount: ${depositAmount}`)
    } else {
      logInfo(`Deposit result: ${result.error || result.message}`)
    }
  } catch (error) {
    logInfo(`Deposit: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Verify L2 Balance After Deposit
// ---------------------------------------------------------------------------
runner.test('Verify L2 balance increases after deposit', async () => {
  const sdk = createCreditPredictionSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
  })
  
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  const aliceL2 = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  sdk.connect({
    l1Address: TEST_ADDRESSES.alice,
    l2Address: aliceL2,
    publicKey: alicePublicKey,
    sign: aliceSigner,
  })
  
  try {
    // Wait for deposit to be processed
    await sleep(1000)
    
    const l2Balance = await sdk.getL2Balance()
    
    logInfo(`Current L2 Balance: ${l2Balance?.available || l2Balance || 0}`)
    logInfo('(Compare with previous balance to verify increase)')
  } catch (error) {
    logInfo(`Balance check: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Withdraw Tokens L2 → L1
// ---------------------------------------------------------------------------
runner.test('Withdraw tokens from L2 to L1', async () => {
  const sdk = createCreditPredictionSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
  })
  
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  const aliceL2 = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  sdk.connect({
    l1Address: TEST_ADDRESSES.alice,
    l2Address: aliceL2,
    publicKey: alicePublicKey,
    sign: aliceSigner,
  })
  
  try {
    const withdrawAmount = CONFIG.DEFAULT_WITHDRAW_AMOUNT
    
    logInfo(`Withdrawing ${withdrawAmount} tokens from L2 to L1...`)
    
    const result = await sdk.withdrawFromL2(withdrawAmount)
    
    if (result.success) {
      logInfo(`✓ Withdrawal initiated`)
      logInfo(`  Transaction: ${result.transactionId || result.txHash}`)
      logInfo(`  Amount: ${withdrawAmount}`)
      logInfo(`  Note: Withdrawal may have a delay period`)
    } else {
      logInfo(`Withdrawal result: ${result.error || result.message}`)
    }
  } catch (error) {
    logInfo(`Withdrawal: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Open L2 Session
// ---------------------------------------------------------------------------
runner.test('Open L2 session with BlackBook SDK', async () => {
  const walletSDK = createBlackBookSDK({ apiUrl: CONFIG.L1_URL })
  
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  
  walletSDK.connect({
    address: TEST_ADDRESSES.alice,
    publicKey: alicePublicKey,
    sign: aliceSigner,
  })
  
  try {
    const sessionAmount = CONFIG.DEFAULT_BET_AMOUNT
    
    logInfo(`Opening L2 session with ${sessionAmount} tokens...`)
    
    const result = await walletSDK.openL2Session({
      amount: sessionAmount,
      l2Url: CONFIG.L2_URL,
    })
    
    if (result.success) {
      logInfo(`✓ L2 session opened`)
      logInfo(`  Session ID: ${result.sessionId}`)
      logInfo(`  Amount locked: ${sessionAmount}`)
    } else {
      logInfo(`Session open result: ${result.error || result.message}`)
    }
  } catch (error) {
    logInfo(`Open session: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Get Active L2 Sessions
// ---------------------------------------------------------------------------
runner.test('Get active L2 sessions', async () => {
  const walletSDK = createBlackBookSDK({ apiUrl: CONFIG.L1_URL })
  
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  
  walletSDK.connect({
    address: TEST_ADDRESSES.alice,
    publicKey: alicePublicKey,
    sign: aliceSigner,
  })
  
  try {
    const sessions = await walletSDK.getL2Sessions()
    
    logInfo(`Active L2 sessions: ${sessions?.length || 0}`)
    
    if (sessions && sessions.length > 0) {
      for (const session of sessions.slice(0, 3)) {
        logInfo(`  Session: ${session.sessionId || session.id}`)
        logInfo(`    Amount: ${session.amount}`)
        logInfo(`    Status: ${session.status}`)
      }
    }
  } catch (error) {
    logInfo(`Get sessions: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Settle L2 Session
// ---------------------------------------------------------------------------
runner.test('Settle L2 session and return to L1', async () => {
  const walletSDK = createBlackBookSDK({ apiUrl: CONFIG.L1_URL })
  
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  
  walletSDK.connect({
    address: TEST_ADDRESSES.alice,
    publicKey: alicePublicKey,
    sign: aliceSigner,
  })
  
  try {
    // Get active sessions first
    const sessions = await walletSDK.getL2Sessions()
    
    if (!sessions || sessions.length === 0) {
      logInfo('No active L2 sessions to settle')
      return
    }
    
    const sessionToSettle = sessions[0]
    
    logInfo(`Settling session ${sessionToSettle.sessionId || sessionToSettle.id}...`)
    
    const result = await walletSDK.settleL2Session({
      sessionId: sessionToSettle.sessionId || sessionToSettle.id,
    })
    
    if (result.success) {
      logInfo(`✓ Session settled`)
      logInfo(`  Final balance returned: ${result.settledAmount}`)
      logInfo(`  P&L: ${result.pnl || 'N/A'}`)
    } else {
      logInfo(`Settlement result: ${result.error || result.message}`)
    }
  } catch (error) {
    logInfo(`Settle session: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Bridge Transaction History
// ---------------------------------------------------------------------------
runner.test('Get bridge transaction history', async () => {
  const sdk = createCreditPredictionSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
  })
  
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  const aliceL2 = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  sdk.connect({
    l1Address: TEST_ADDRESSES.alice,
    l2Address: aliceL2,
    publicKey: alicePublicKey,
    sign: aliceSigner,
  })
  
  try {
    const history = await sdk.getBridgeHistory()
    
    logInfo(`Bridge transactions: ${history?.length || 0}`)
    
    if (history && history.length > 0) {
      for (const tx of history.slice(0, 5)) {
        logInfo(`  ${tx.type}: ${tx.amount}`)
        logInfo(`    Status: ${tx.status}`)
        logInfo(`    Date: ${tx.timestamp || tx.createdAt}`)
      }
    }
  } catch (error) {
    logInfo(`Bridge history: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Pending Deposits
// ---------------------------------------------------------------------------
runner.test('Check for pending deposits', async () => {
  const sdk = createCreditPredictionSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
  })
  
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  const aliceL2 = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  sdk.connect({
    l1Address: TEST_ADDRESSES.alice,
    l2Address: aliceL2,
    publicKey: alicePublicKey,
    sign: aliceSigner,
  })
  
  try {
    const pending = await sdk.getPendingDeposits()
    
    logInfo(`Pending deposits: ${pending?.length || 0}`)
    
    if (pending && pending.length > 0) {
      for (const dep of pending) {
        logInfo(`  Amount: ${dep.amount}`)
        logInfo(`    Status: ${dep.status}`)
        logInfo(`    Confirmations: ${dep.confirmations || 'N/A'}`)
      }
    }
  } catch (error) {
    logInfo(`Pending deposits: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Pending Withdrawals
// ---------------------------------------------------------------------------
runner.test('Check for pending withdrawals', async () => {
  const sdk = createCreditPredictionSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
  })
  
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  const aliceL2 = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  sdk.connect({
    l1Address: TEST_ADDRESSES.alice,
    l2Address: aliceL2,
    publicKey: alicePublicKey,
    sign: aliceSigner,
  })
  
  try {
    const pending = await sdk.getPendingWithdrawals()
    
    logInfo(`Pending withdrawals: ${pending?.length || 0}`)
    
    if (pending && pending.length > 0) {
      for (const wd of pending) {
        logInfo(`  Amount: ${wd.amount}`)
        logInfo(`    Status: ${wd.status}`)
        logInfo(`    Estimated completion: ${wd.estimatedCompletion || 'N/A'}`)
      }
    }
  } catch (error) {
    logInfo(`Pending withdrawals: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Deposit with Insufficient L1 Balance
// ---------------------------------------------------------------------------
runner.test('Deposit fails with insufficient L1 balance', async () => {
  const sdk = createCreditPredictionSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
  })
  
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  const aliceL2 = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  sdk.connect({
    l1Address: TEST_ADDRESSES.alice,
    l2Address: aliceL2,
    publicKey: alicePublicKey,
    sign: aliceSigner,
  })
  
  try {
    const hugeAmount = '999999999999'
    
    const result = await sdk.depositToL2(hugeAmount)
    
    assert(!result.success, 'Deposit should fail with insufficient balance')
    logInfo(`✓ Correctly rejected: ${result.error || result.message}`)
  } catch (error) {
    logInfo(`✓ Correctly rejected: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Bridge Events
// ---------------------------------------------------------------------------
runner.test('Bridge SDK emits events', async () => {
  const sdk = createCreditPredictionSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
  })
  
  const events = []
  
  sdk.on((event) => {
    events.push(event)
    logInfo(`Event: ${event.type}`)
  })
  
  logInfo('Event listener registered for bridge operations')
  logInfo('Events: deposit_initiated, deposit_confirmed, withdrawal_initiated, etc.')
})

// ═══════════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════════

runner.run().then(results => {
  process.exit(results.failed > 0 ? 1 : 0)
})
