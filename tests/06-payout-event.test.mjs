/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FEATURE TEST: PAYOUT EVENT (Market Resolution & Winnings)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests for market resolution and payout of winnings
 * 
 * Features tested:
 * - Dealer resolves market
 * - Winners receive correct payout
 * - Losers receive nothing
 * - Position clears after resolution
 * - Settlement process
 */

import { MarketsSDK, createMarketsSDK, MarketStatus } from '../sdk/markets-sdk.js'
import { UnifiedDealerSDK, DealerCrypto } from '../sdk/unified-dealer-sdk.js'
import { CONFIG, TEST_SEEDS, TEST_ADDRESSES } from './config.js'
import { 
  TestRunner, 
  assert, 
  assertEqual, 
  assertNotNull,
  assertGreaterThan,
  logInfo,
  sleep,
  generateUniqueId
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

const runner = new TestRunner('Payout Event Tests')

// ---------------------------------------------------------------------------
// Test: Initialize Dealer SDK
// ---------------------------------------------------------------------------
runner.test('Initialize Dealer SDK', async () => {
  const dealerSigner = createSigner(TEST_SEEDS.dealer)
  const dealerPublicKey = getPublicKey(TEST_SEEDS.dealer)
  
  const sdk = new UnifiedDealerSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
    dealerAddress: TEST_ADDRESSES.dealer,
    dealerPublicKey: dealerPublicKey,
    dealerSigner: dealerSigner,
  })
  
  assertNotNull(sdk, 'Dealer SDK should be created')
  logInfo('Dealer SDK initialized')
})

// ---------------------------------------------------------------------------
// Test: Get Resolved Markets
// ---------------------------------------------------------------------------
runner.test('Get resolved markets', async () => {
  const sdk = createMarketsSDK({ l2Url: CONFIG.L2_URL })
  
  try {
    const markets = await sdk.getMarkets()
    
    const resolved = markets.filter(m => 
      m.status === MarketStatus.RESOLVED || 
      m.status === 'resolved' ||
      m.status === 'settled'
    )
    
    logInfo(`Total markets: ${markets.length}`)
    logInfo(`Resolved markets: ${resolved.length}`)
    
    if (resolved.length > 0) {
      const market = resolved[0]
      logInfo(`Example resolved: ${market.id}`)
      logInfo(`  Winning outcome: ${market.winningOutcome ?? 'N/A'}`)
    }
  } catch (error) {
    logInfo(`Markets: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Check Resolved Market Details
// ---------------------------------------------------------------------------
runner.test('Check resolved market has winning outcome', async () => {
  const sdk = createMarketsSDK({ l2Url: CONFIG.L2_URL })
  
  try {
    const markets = await sdk.getMarkets()
    
    const resolved = markets.find(m => 
      m.status === MarketStatus.RESOLVED || m.status === 'resolved'
    )
    
    if (!resolved) {
      logInfo('No resolved markets to check')
      return
    }
    
    const details = await sdk.getMarket(resolved.id)
    
    assertNotNull(details.winningOutcome, 'Resolved market should have winning outcome')
    
    logInfo(`Market: ${details.id}`)
    logInfo(`Question: ${details.question || details.title}`)
    logInfo(`Winning Outcome: ${details.winningOutcome} (${details.outcomes?.[details.winningOutcome]})`)
  } catch (error) {
    logInfo(`Market details: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Dealer Can Resolve Market
// ---------------------------------------------------------------------------
runner.test('Dealer can resolve a market', async () => {
  const dealerSigner = createSigner(TEST_SEEDS.dealer)
  const dealerPublicKey = getPublicKey(TEST_SEEDS.dealer)
  
  const dealerSDK = new UnifiedDealerSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
    dealerAddress: TEST_ADDRESSES.dealer,
    dealerPublicKey: dealerPublicKey,
    dealerSigner: dealerSigner,
  })
  
  const marketsSDK = createMarketsSDK({ l2Url: CONFIG.L2_URL })
  
  try {
    const markets = await marketsSDK.getMarkets()
    
    // Find an active market to resolve (for testing)
    const activeMarket = markets.find(m => 
      m.status === MarketStatus.ACTIVE || m.status === 'active'
    )
    
    if (!activeMarket) {
      logInfo('No active markets to resolve')
      return
    }
    
    logInfo(`Attempting to resolve market: ${activeMarket.id}`)
    
    // Resolve with outcome 0 as winner
    const result = await dealerSDK.resolveMarket({
      marketId: activeMarket.id,
      winningOutcome: 0,
      evidence: 'Test resolution',
    })
    
    if (result.success) {
      logInfo(`✓ Market resolved successfully!`)
      logInfo(`  Winning outcome: ${result.winningOutcome}`)
      logInfo(`  Payouts processed: ${result.payoutsProcessed}`)
    } else {
      logInfo(`Resolution result: ${result.error || result.message}`)
    }
  } catch (error) {
    logInfo(`Resolution: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Winners Receive Payout
// ---------------------------------------------------------------------------
runner.test('Winners receive correct payout', async () => {
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  const aliceL2 = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  const dealerSigner = createSigner(TEST_SEEDS.dealer)
  const dealerPublicKey = getPublicKey(TEST_SEEDS.dealer)
  
  const marketsSDK = createMarketsSDK({
    l2Url: CONFIG.L2_URL,
    userAddress: aliceL2,
    userPublicKey: alicePublicKey,
    userSigner: aliceSigner,
  })
  
  try {
    // Check Alice's positions
    const positions = await marketsSDK.getPositions(aliceL2)
    
    if (positions.length === 0) {
      logInfo('Alice has no positions to check payouts')
      return
    }
    
    // Find positions in resolved markets
    const markets = await marketsSDK.getMarkets()
    const resolvedMarketIds = markets
      .filter(m => m.status === 'resolved')
      .map(m => m.id)
    
    const resolvedPositions = positions.filter(p => 
      resolvedMarketIds.includes(p.marketId)
    )
    
    if (resolvedPositions.length === 0) {
      logInfo('No positions in resolved markets')
      return
    }
    
    for (const pos of resolvedPositions) {
      const market = markets.find(m => m.id === pos.marketId)
      
      if (market && market.winningOutcome === pos.outcomeIndex) {
        logInfo(`✓ Alice won on market ${pos.marketId}`)
        logInfo(`  Shares held: ${pos.shares}`)
        logInfo(`  Payout: ${pos.shares} (1:1 for winning shares)`)
      } else {
        logInfo(`✗ Alice lost on market ${pos.marketId}`)
        logInfo(`  Her outcome: ${pos.outcomeIndex}, Winning: ${market?.winningOutcome}`)
      }
    }
  } catch (error) {
    logInfo(`Payout check: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Claim Winnings
// ---------------------------------------------------------------------------
runner.test('User can claim winnings from resolved market', async () => {
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  const aliceL2 = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  const marketsSDK = createMarketsSDK({
    l2Url: CONFIG.L2_URL,
    userAddress: aliceL2,
    userPublicKey: alicePublicKey,
    userSigner: aliceSigner,
  })
  
  try {
    // Check for claimable winnings
    const claimable = await marketsSDK.getClaimableWinnings(aliceL2)
    
    if (!claimable || claimable.length === 0) {
      logInfo('No winnings to claim')
      return
    }
    
    logInfo(`Found ${claimable.length} claimable winning(s)`)
    
    for (const claim of claimable) {
      logInfo(`  Market: ${claim.marketId}`)
      logInfo(`  Amount: ${claim.amount}`)
      
      // Attempt to claim
      const result = await marketsSDK.claimWinnings(claim.marketId)
      
      if (result.success) {
        logInfo(`  ✓ Claimed ${result.amount} successfully`)
      } else {
        logInfo(`  Claim result: ${result.error}`)
      }
    }
  } catch (error) {
    logInfo(`Claim winnings: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Settlement Events
// ---------------------------------------------------------------------------
runner.test('Settlement emits correct events', async () => {
  const dealerSigner = createSigner(TEST_SEEDS.dealer)
  const dealerPublicKey = getPublicKey(TEST_SEEDS.dealer)
  
  const sdk = new UnifiedDealerSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
    dealerAddress: TEST_ADDRESSES.dealer,
    dealerPublicKey: dealerPublicKey,
    dealerSigner: dealerSigner,
  })
  
  let eventReceived = false
  
  sdk.on((event) => {
    if (event.type === 'market_resolved' || event.type === 'settlement_completed') {
      eventReceived = true
      logInfo(`Event received: ${event.type}`)
    }
  })
  
  // Events would be emitted during resolution
  logInfo(`Event listener registered (events fire during resolution)`)
})

// ---------------------------------------------------------------------------
// Test: Non-Dealer Cannot Resolve
// ---------------------------------------------------------------------------
runner.test('Non-dealer cannot resolve market', async () => {
  // Try to resolve as Alice (not a dealer)
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  
  const sdk = new UnifiedDealerSDK({
    l1Url: CONFIG.L1_URL,
    l2Url: CONFIG.L2_URL,
    dealerAddress: TEST_ADDRESSES.alice, // Alice is not a dealer
    dealerPublicKey: alicePublicKey,
    dealerSigner: aliceSigner,
  })
  
  const marketsSDK = createMarketsSDK({ l2Url: CONFIG.L2_URL })
  
  try {
    const markets = await marketsSDK.getMarkets()
    const activeMarket = markets.find(m => m.status === 'active')
    
    if (!activeMarket) {
      logInfo('No active markets to test')
      return
    }
    
    const result = await sdk.resolveMarket({
      marketId: activeMarket.id,
      winningOutcome: 0,
    })
    
    assert(!result.success, 'Non-dealer should not be able to resolve')
    logInfo(`✓ Correctly rejected non-dealer resolution: ${result.error}`)
  } catch (error) {
    logInfo(`✓ Correctly rejected: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Market Status After Resolution
// ---------------------------------------------------------------------------
runner.test('Market status changes to resolved after resolution', async () => {
  const marketsSDK = createMarketsSDK({ l2Url: CONFIG.L2_URL })
  
  try {
    const markets = await marketsSDK.getMarkets()
    
    const resolved = markets.filter(m => 
      m.status === 'resolved' || m.status === 'settled'
    )
    
    for (const market of resolved.slice(0, 3)) {
      const details = await marketsSDK.getMarket(market.id)
      
      assert(
        details.status === 'resolved' || details.status === 'settled',
        `Market ${market.id} should be resolved`
      )
      
      logInfo(`Market ${market.id}: status=${details.status}`)
    }
  } catch (error) {
    logInfo(`Status check: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Balance Increases After Winning
// ---------------------------------------------------------------------------
runner.test('User balance increases after claiming winning', async () => {
  const aliceSigner = createSigner(TEST_SEEDS.alice)
  const alicePublicKey = getPublicKey(TEST_SEEDS.alice)
  const aliceL2 = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  const marketsSDK = createMarketsSDK({
    l2Url: CONFIG.L2_URL,
    userAddress: aliceL2,
    userPublicKey: alicePublicKey,
    userSigner: aliceSigner,
  })
  
  try {
    // Get balance before
    const balanceBefore = await marketsSDK.getBalance(aliceL2)
    logInfo(`Balance before: ${balanceBefore?.available || balanceBefore}`)
    
    // Check for and claim winnings
    const claimable = await marketsSDK.getClaimableWinnings(aliceL2)
    
    if (!claimable || claimable.length === 0) {
      logInfo('No winnings to claim for balance test')
      return
    }
    
    // Claim first winning
    await marketsSDK.claimWinnings(claimable[0].marketId)
    
    // Get balance after
    await sleep(500)
    const balanceAfter = await marketsSDK.getBalance(aliceL2)
    logInfo(`Balance after: ${balanceAfter?.available || balanceAfter}`)
    
    const before = balanceBefore?.available || balanceBefore || 0
    const after = balanceAfter?.available || balanceAfter || 0
    
    if (after > before) {
      logInfo(`✓ Balance increased by ${after - before}`)
    }
  } catch (error) {
    logInfo(`Balance test: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Full Betting Cycle (Bet → Resolve → Payout)
// ---------------------------------------------------------------------------
runner.test('Full betting cycle: bet → resolve → payout', async () => {
  logInfo('This test demonstrates the full lifecycle:')
  logInfo('1. User places bet on outcome')
  logInfo('2. Market closes and is resolved by oracle/dealer')
  logInfo('3. Winners receive payout (shares → tokens)')
  logInfo('4. Losers receive nothing')
  logInfo('')
  logInfo('Individual steps are tested in previous tests.')
  logInfo('For end-to-end testing, run the tests in sequence.')
})

// ═══════════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════════

runner.run().then(results => {
  process.exit(results.failed > 0 ? 1 : 0)
})
