/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Shared configuration for all test files
 */

export const CONFIG = {
  // Server URLs
  L1_URL: process.env.L1_URL || 'http://localhost:8080',
  L2_URL: process.env.L2_URL || 'http://localhost:1234',
  
  // Test timeouts
  TIMEOUT_SHORT: 5000,
  TIMEOUT_MEDIUM: 15000,
  TIMEOUT_LONG: 30000,
  
  // Test amounts
  DEFAULT_TRANSFER_AMOUNT: 10,
  DEFAULT_BET_AMOUNT: 5,
  DEFAULT_BRIDGE_AMOUNT: 50,
  
  // Logging
  VERBOSE: process.env.VERBOSE === 'true',
}

// Test account seeds (deterministic for testing)
export const TEST_SEEDS = {
  alice: '18f2c2e3bcb7a4b5329cfed4bd79bf17df4d47aa1888a6b3d1a1450fb53a8a24',
  bob: 'e4ac49e5a04ef7dfc6e1a838fdf14597f2d514d0029a82cb45c916293487c25b',
  charlie: 'c3a4b5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
  dealer: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
}

// Expected test addresses (derived from seeds)
export const TEST_ADDRESSES = {
  alice: 'L1_52882D768C0F3E7932AAD1813CF8B19058D507A8',
  bob: 'L1_5DB4B525FB40D6EA6BFD24094C2BC24984BAC433',
  dealer: 'L1_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D',
}

// Test market data
export const TEST_MARKETS = {
  simple: {
    id: 'test_market_001',
    question: 'Will it rain tomorrow?',
    outcomes: ['Yes', 'No'],
    initialPrices: [0.5, 0.5],
  },
  worldCup: {
    id: 'wc_2026_winner',
    question: 'Who will win the 2026 World Cup?',
    outcomes: ['Brazil', 'Argentina', 'France', 'Germany', 'Other'],
    initialPrices: [0.25, 0.20, 0.20, 0.15, 0.20],
  },
}

export default CONFIG
