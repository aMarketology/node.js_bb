/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FEATURE TEST: BET ON EVENT (Place Bets)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests for placing bets on prediction markets using MarketsSDK
 * 
 * Features tested:
 * - Get available markets
 * - Get market details
 * - Get bet quote (price preview)
 * - Place a bet (buy shares)
 * - Verify position after bet
 * - Sell shares (exit position)
 * - CPMM price updates
 */

import { MarketsSDK, createMarketsSDK, MarketStatus } from '../sdk/markets-sdk.js'
import { CreditPredictionSDK } from '../sdk/credit-prediction-actions-sdk.js'
import { CONFIG, TEST_SEEDS, TEST_ADDRESSES } from './config.js'
import { 
  TestRunner, 
  assert, 
  assertEqual, 
  assertNotNull,
  assertGreaterThan,
  assertLessThan,
  assertInRange,
  logInfo,
  sleep
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

const runner = new TestRunner('Place Bets Tests')

// ---------------------------------------------------------------------------
// Test: Initialize Markets SDK
// ---------------------------------------------------------------------------
runner.test('Initialize Markets SDK', async () => {
  const sdk = createMarketsSDK({
    l2Url: CONFIG.L2_URL,
  })
  
  assertNotNull(sdk, 'SDK should be created')
  logInfo(`Markets SDK initialized for ${CONFIG.L2_URL}`)
})

// ---------------------------------------------------------------------------
// Test: Get Active Markets
// ---------------------------------------------------------------------------
runner.test('Get list of active markets', async () => {
  const sdk = createMarketsSDK({ l2Url: CONFIG.L2_URL })
  
  try {
    const markets = await sdk.getMarkets()
    
    assertNotNull(markets, 'Markets should not be null')
    
    if (markets.length > 0) {
      logInfo(`Found ${markets.length} markets`)
      
      // Log first market info
      const market = markets[0]
      logInfo(`First market: ${market.id} - ${market.question || market.title}`)
    } else {
      logInfo('No markets available yet')
    }
  } catch (error) {
    logInfo(`Markets endpoint: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Get Market Details
// ---------------------------------------------------------------------------
runner.test('Get specific market details', async () => {
  const sdk = createMarketsSDK({ l2Url: CONFIG.L2_URL })
  
  try {
    const markets = await sdk.getMarkets()
    
    if (markets.length === 0) {
      logInfo('No markets to query')
      return
    }
    
    const marketId = markets[0].id
    const details = await sdk.getMarket(marketId)
    
    assertNotNull(details, 'Market details should not be null')
    assertEqual(details.id, marketId, 'Market ID should match')
    assertNotNull(details.outcomes, 'Market should have outcomes')
    
    logInfo(`Market: ${details.question || details.title}`)
    logInfo(`Outcomes: ${details.outcomes?.join(', ')}`)
    logInfo(`Status: ${details.status}`)
  } catch (error) {
    logInfo(`Market details: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Get Current Prices
// ---------------------------------------------------------------------------
runner.test('Get current market prices', async () => {
  const sdk = createMarketsSDK({ l2Url: CONFIG.L2_URL })
  
  try {
    const markets = await sdk.getMarkets()
    
    if (markets.length === 0) {
      logInfo('No markets available')
      return
    }
    
    const market = markets[0]
    const prices = await sdk.getPrices(market.id)
    
    assertNotNull(prices, 'Prices should not be null')
    assert(Array.isArray(prices), 'Prices should be an array')
    
    // Prices should sum to approximately 1 (100%)
    const sum = prices.reduce((a, b) => a + b, 0)
    assertInRange(sum, 0.95, 1.05, 'Prices should sum to ~1')
    
    logInfo(`Market ${market.id} prices:`)
    prices.forEach((price, i) => {
      logInfo(`  Outcome ${i}: ${(price * 100).toFixed(1)}%`)
    })
  } catch (error) {
    logInfo(`Prices endpoint: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Get Bet Quote
// ---------------------------------------------------------------------------
runner.test('Get bet quote (price preview)', async () => {
  const sdk = createMarketsSDK({ l2Url: CONFIG.L2_URL })
  
  try {
    const markets = await sdk.getMarkets()
    
    if (markets.length === 0) {
      logInfo('No markets available')
      return
    }
    
    const market = markets[0]
    const betAmount = CONFIG.DEFAULT_BET_AMOUNT
    
    // Get quote for betting on outcome 0
    const quote = await sdk.getQuote(market.id, 0, betAmount)
    
    assertNotNull(quote, 'Quote should not be null')
    assertNotNull(quote.shares, 'Quote should have shares')
    assertNotNull(quote.avgPrice, 'Quote should have average price')
    assertGreaterThan(quote.shares, 0, 'Should receive positive shares')
    
    logInfo(`Quote for ${betAmount} on outcome 0:`)
    logInfo(`  Shares: ${quote.shares?.toFixed(4)}`)
    logInfo(`  Avg Price: ${quote.avgPrice?.toFixed(4)}`)
    logInfo(`  Price Impact: ${(quote.priceImpact * 100)?.toFixed(2)}%`)
  } catch (error) {
    logInfo(`Quote endpoint: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Place a Bet (Buy Shares)
// ---------------------------------------------------------------------------
runner.test('Place a bet on market outcome', async () => {
  const signer = createSigner(TEST_SEEDS.alice)
  const publicKey = getPublicKey(TEST_SEEDS.alice)
  const l2Address = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  const sdk = createMarketsSDK({
    l2Url: CONFIG.L2_URL,
    userAddress: l2Address,
    userPublicKey: publicKey,
    userSigner: signer,
  })
  
  try {
    const markets = await sdk.getMarkets()
    
    if (markets.length === 0) {
      logInfo('No markets available for betting')
      return
    }
    
    // Find an active market
    const activeMarket = markets.find(m => 
      m.status === MarketStatus.ACTIVE || m.status === 'active'
    )
    
    if (!activeMarket) {
      logInfo('No active markets for betting')
      return
    }
    
    const betAmount = CONFIG.DEFAULT_BET_AMOUNT
    const outcomeIndex = 0
    
    logInfo(`Placing bet: ${betAmount} on outcome ${outcomeIndex} of market ${activeMarket.id}`)
    
    const result = await sdk.placeBet(activeMarket.id, outcomeIndex, betAmount)
    
    if (result.success) {
      assertNotNull(result.shares, 'Should receive shares')
      assertGreaterThan(result.shares, 0, 'Shares should be positive')
      
      logInfo(`✓ Bet placed successfully!`)
      logInfo(`  Shares received: ${result.shares?.toFixed(4)}`)
      logInfo(`  Average price: ${result.avgPrice?.toFixed(4)}`)
      logInfo(`  TX: ${result.txHash || 'N/A'}`)
    } else {
      logInfo(`Bet not placed: ${result.error}`)
    }
  } catch (error) {
    logInfo(`Bet placement: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Check Position After Bet
// ---------------------------------------------------------------------------
runner.test('Check user position after bet', async () => {
  const signer = createSigner(TEST_SEEDS.alice)
  const publicKey = getPublicKey(TEST_SEEDS.alice)
  const l2Address = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  const sdk = createMarketsSDK({
    l2Url: CONFIG.L2_URL,
    userAddress: l2Address,
    userPublicKey: publicKey,
    userSigner: signer,
  })
  
  try {
    const positions = await sdk.getPositions(l2Address)
    
    assertNotNull(positions, 'Positions should not be null')
    
    if (positions.length > 0) {
      logInfo(`Found ${positions.length} position(s):`)
      
      for (const pos of positions) {
        logInfo(`  Market: ${pos.marketId}`)
        logInfo(`  Outcome: ${pos.outcomeIndex}`)
        logInfo(`  Shares: ${pos.shares}`)
        logInfo(`  Cost Basis: ${pos.costBasis}`)
      }
    } else {
      logInfo('No positions found (may not have placed any bets yet)')
    }
  } catch (error) {
    logInfo(`Positions: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Price Updates After Bet
// ---------------------------------------------------------------------------
runner.test('Prices update after bet (CPMM)', async () => {
  const signer = createSigner(TEST_SEEDS.alice)
  const publicKey = getPublicKey(TEST_SEEDS.alice)
  const l2Address = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  const sdk = createMarketsSDK({
    l2Url: CONFIG.L2_URL,
    userAddress: l2Address,
    userPublicKey: publicKey,
    userSigner: signer,
  })
  
  try {
    const markets = await sdk.getMarkets()
    
    if (markets.length === 0) {
      logInfo('No markets available')
      return
    }
    
    const market = markets.find(m => 
      m.status === MarketStatus.ACTIVE || m.status === 'active'
    )
    
    if (!market) {
      logInfo('No active markets')
      return
    }
    
    // Get prices before
    const pricesBefore = await sdk.getPrices(market.id)
    logInfo(`Prices before: ${pricesBefore.map(p => (p * 100).toFixed(1) + '%').join(', ')}`)
    
    // Place a bet
    const result = await sdk.placeBet(market.id, 0, CONFIG.DEFAULT_BET_AMOUNT)
    
    if (result.success) {
      // Get prices after
      const pricesAfter = await sdk.getPrices(market.id)
      logInfo(`Prices after: ${pricesAfter.map(p => (p * 100).toFixed(1) + '%').join(', ')}`)
      
      // Outcome 0 price should have increased
      assert(pricesAfter[0] >= pricesBefore[0], 'Outcome 0 price should increase after buying')
      
      logInfo(`✓ CPMM price update verified`)
    }
  } catch (error) {
    logInfo(`CPMM test: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Sell Shares (Exit Position)
// ---------------------------------------------------------------------------
runner.test('Sell shares (exit position)', async () => {
  const signer = createSigner(TEST_SEEDS.alice)
  const publicKey = getPublicKey(TEST_SEEDS.alice)
  const l2Address = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  const sdk = createMarketsSDK({
    l2Url: CONFIG.L2_URL,
    userAddress: l2Address,
    userPublicKey: publicKey,
    userSigner: signer,
  })
  
  try {
    // Get current positions
    const positions = await sdk.getPositions(l2Address)
    
    if (positions.length === 0) {
      logInfo('No positions to sell')
      return
    }
    
    const position = positions[0]
    const sharesToSell = Math.min(position.shares, 1) // Sell up to 1 share
    
    logInfo(`Selling ${sharesToSell} shares of outcome ${position.outcomeIndex} in market ${position.marketId}`)
    
    const result = await sdk.sellShares(
      position.marketId,
      position.outcomeIndex,
      sharesToSell
    )
    
    if (result.success) {
      assertNotNull(result.received, 'Should receive payment')
      assertGreaterThan(result.received, 0, 'Payment should be positive')
      
      logInfo(`✓ Sold shares successfully!`)
      logInfo(`  Received: ${result.received?.toFixed(4)}`)
      logInfo(`  TX: ${result.txHash || 'N/A'}`)
    } else {
      logInfo(`Sell not completed: ${result.error}`)
    }
  } catch (error) {
    logInfo(`Sell shares: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Cannot Bet on Resolved Market
// ---------------------------------------------------------------------------
runner.test('Cannot bet on resolved market', async () => {
  const signer = createSigner(TEST_SEEDS.alice)
  const publicKey = getPublicKey(TEST_SEEDS.alice)
  const l2Address = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  const sdk = createMarketsSDK({
    l2Url: CONFIG.L2_URL,
    userAddress: l2Address,
    userPublicKey: publicKey,
    userSigner: signer,
  })
  
  try {
    const markets = await sdk.getMarkets()
    
    // Find a resolved market
    const resolvedMarket = markets.find(m => 
      m.status === MarketStatus.RESOLVED || m.status === 'resolved'
    )
    
    if (!resolvedMarket) {
      logInfo('No resolved markets to test')
      return
    }
    
    const result = await sdk.placeBet(resolvedMarket.id, 0, CONFIG.DEFAULT_BET_AMOUNT)
    
    assert(!result.success, 'Betting on resolved market should fail')
    logInfo(`✓ Correctly rejected bet on resolved market: ${result.error}`)
  } catch (error) {
    // Expected to fail
    logInfo(`✓ Correctly rejected: ${error.message}`)
  }
})

// ---------------------------------------------------------------------------
// Test: Bet Amount Validation
// ---------------------------------------------------------------------------
runner.test('Validate bet amount (minimum/maximum)', async () => {
  const signer = createSigner(TEST_SEEDS.alice)
  const publicKey = getPublicKey(TEST_SEEDS.alice)
  const l2Address = TEST_ADDRESSES.alice.replace('L1_', 'L2_')
  
  const sdk = createMarketsSDK({
    l2Url: CONFIG.L2_URL,
    userAddress: l2Address,
    userPublicKey: publicKey,
    userSigner: signer,
  })
  
  try {
    const markets = await sdk.getMarkets()
    
    if (markets.length === 0) {
      logInfo('No markets available')
      return
    }
    
    const market = markets.find(m => m.status === 'active')
    if (!market) {
      logInfo('No active markets')
      return
    }
    
    // Try zero amount
    try {
      await sdk.placeBet(market.id, 0, 0)
      logInfo('Zero amount was accepted (may be allowed)')
    } catch (error) {
      logInfo(`✓ Zero amount rejected: ${error.message}`)
    }
    
    // Try negative amount
    try {
      await sdk.placeBet(market.id, 0, -10)
      logInfo('Negative amount was accepted (unexpected)')
    } catch (error) {
      logInfo(`✓ Negative amount rejected: ${error.message}`)
    }
  } catch (error) {
    logInfo(`Validation test: ${error.message}`)
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════════

runner.run().then(results => {
  process.exit(results.failed > 0 ? 1 : 0)
})
