/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 4: MARKET STANDARDS VALIDATION TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests for market validation rules, requirements, and standards
 * as defined in market-standards.md
 * 
 * Run: node phase4-market-standards.js
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const {
  MARKET_STATUS,
  MARKET_TYPE,
  TRADING_TYPE,
  LIQUIDITY_REQUIREMENTS,
  TIMING_REQUIREMENTS,
  OUTCOME_REQUIREMENTS,
  CONTENT_REQUIREMENTS,
  BETTING_LIMITS,
  FEE_STRUCTURE,
  MARKET_CATEGORIES,
  MARKET_REQUIREMENTS,
  validateMarket,
  canBetOnMarket,
  validateBet,
  calculateInitialPool
} = require('./market-standards.js');

// ═══════════════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${testName}`);
    if (details) console.log(`     Details: ${details}`);
    testsFailed++;
  }
}

function section(name) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📋 ${name}`);
  console.log(`${'─'.repeat(70)}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

// Valid market for testing
const VALID_MARKET = {
  id: 'btc-100k-june-2026',
  title: 'Will Bitcoin exceed $100,000 before June 1, 2026?',
  description: 'This market resolves to YES if the price of Bitcoin (BTC) exceeds $100,000 USD at any point before June 1, 2026 00:00:00 UTC. Resolution based on CoinGecko.',
  outcomes: [
    { index: 0, label: 'Yes' },
    { index: 1, label: 'No' }
  ],
  closes_at: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
  resolution_criteria: 'Resolves based on CoinGecko BTC/USD price. YES if price >= $100,000 at any point before close.',
  category: 'crypto',
  initial_liquidity: 500,
  status: 'active',
  liquidity: 500
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: MARKET STATUS CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

function testMarketStatusConstants() {
  section('Market Status Constants');
  
  // Test all status values exist
  assert(MARKET_STATUS.DRAFT === 'draft', 'DRAFT status defined');
  assert(MARKET_STATUS.PENDING === 'pending', 'PENDING status defined');
  assert(MARKET_STATUS.ACTIVE === 'active', 'ACTIVE status defined');
  assert(MARKET_STATUS.FROZEN === 'frozen', 'FROZEN status defined');
  assert(MARKET_STATUS.RESOLVED === 'resolved', 'RESOLVED status defined');
  assert(MARKET_STATUS.CANCELLED === 'cancelled', 'CANCELLED status defined');
  
  // Test type constants
  assert(MARKET_TYPE.MAIN === 'main', 'MAIN market type defined');
  assert(MARKET_TYPE.USER_PROP === 'user_prop', 'USER_PROP market type defined');
  assert(MARKET_TYPE.PROP === 'prop', 'PROP market type defined');
  
  // Test trading types
  assert(TRADING_TYPE.CPMM === 'cpmm', 'CPMM trading type defined');
  assert(TRADING_TYPE.ORDERBOOK === 'orderbook', 'ORDERBOOK trading type defined');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: LIQUIDITY REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════

function testLiquidityRequirements() {
  section('Liquidity Requirements');
  
  // Minimum liquidity
  assert(
    LIQUIDITY_REQUIREMENTS.MINIMUM === 100,
    'Minimum liquidity is $100 BC',
    `Expected 100, got ${LIQUIDITY_REQUIREMENTS.MINIMUM}`
  );
  
  // Recommended liquidity
  assert(
    LIQUIDITY_REQUIREMENTS.RECOMMENDED === 500,
    'Recommended liquidity is $500 BC',
    `Expected 500, got ${LIQUIDITY_REQUIREMENTS.RECOMMENDED}`
  );
  
  // Maximum liquidity
  assert(
    LIQUIDITY_REQUIREMENTS.MAXIMUM === 1000000,
    'Maximum liquidity is $1,000,000 BC',
    `Expected 1000000, got ${LIQUIDITY_REQUIREMENTS.MAXIMUM}`
  );
  
  // Currency
  assert(
    LIQUIDITY_REQUIREMENTS.CURRENCY === 'BC',
    'Currency is BlackCoin (BC)'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: TIMING REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════

function testTimingRequirements() {
  section('Timing Requirements');
  
  // Minimum duration
  assert(
    TIMING_REQUIREMENTS.MIN_DURATION_HOURS === 1,
    'Minimum duration is 1 hour'
  );
  assert(
    TIMING_REQUIREMENTS.MIN_DURATION_MS === 60 * 60 * 1000,
    'Minimum duration MS calculated correctly'
  );
  
  // Maximum duration
  assert(
    TIMING_REQUIREMENTS.MAX_DURATION_DAYS === 365,
    'Maximum duration is 365 days'
  );
  
  // Freeze grace period
  assert(
    TIMING_REQUIREMENTS.FREEZE_GRACE_PERIOD_HOURS === 72,
    'Freeze grace period is 72 hours'
  );
  
  // Funding timeout
  assert(
    TIMING_REQUIREMENTS.FUNDING_TIMEOUT_DAYS === 7,
    'Funding timeout is 7 days'
  );
  
  // Close buffer
  assert(
    TIMING_REQUIREMENTS.MIN_TIME_BEFORE_CLOSE_SECONDS === 300,
    'Minimum time before close is 5 minutes (300 seconds)'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: OUTCOME REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════

function testOutcomeRequirements() {
  section('Outcome Requirements');
  
  // Minimum outcomes (binary)
  assert(
    OUTCOME_REQUIREMENTS.MINIMUM === 2,
    'Minimum outcomes is 2 (binary market)'
  );
  
  // Maximum outcomes
  assert(
    OUTCOME_REQUIREMENTS.MAXIMUM === 10,
    'Maximum outcomes is 10'
  );
  
  // Label max length
  assert(
    OUTCOME_REQUIREMENTS.LABEL_MAX_LENGTH === 50,
    'Outcome label max length is 50 characters'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: CONTENT REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════

function testContentRequirements() {
  section('Content Requirements');
  
  // Title length
  assert(
    CONTENT_REQUIREMENTS.TITLE_MIN_LENGTH === 10,
    'Title minimum length is 10 characters'
  );
  assert(
    CONTENT_REQUIREMENTS.TITLE_MAX_LENGTH === 200,
    'Title maximum length is 200 characters'
  );
  
  // Description length
  assert(
    CONTENT_REQUIREMENTS.DESCRIPTION_MIN_LENGTH === 20,
    'Description minimum length is 20 characters'
  );
  assert(
    CONTENT_REQUIREMENTS.DESCRIPTION_MAX_LENGTH === 2000,
    'Description maximum length is 2000 characters'
  );
  
  // Resolution criteria required
  assert(
    CONTENT_REQUIREMENTS.RESOLUTION_CRITERIA_REQUIRED === true,
    'Resolution criteria is required'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: BETTING LIMITS
// ═══════════════════════════════════════════════════════════════════════════

function testBettingLimits() {
  section('Betting Limits');
  
  // Minimum bet
  assert(
    BETTING_LIMITS.MIN_BET === 1,
    'Minimum bet is $1 BC'
  );
  
  // Maximum bet
  assert(
    BETTING_LIMITS.MAX_BET === 10000,
    'Maximum bet is $10,000 BC'
  );
  
  // Max position percentage
  assert(
    BETTING_LIMITS.MAX_POSITION_PERCENT === 25,
    'Maximum position is 25% of pool'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: FEE STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════

function testFeeStructure() {
  section('Fee Structure');
  
  // Trading fee
  assert(
    FEE_STRUCTURE.TRADING_FEE_PERCENT === 2.0,
    'Trading fee is 2%'
  );
  
  // LP share
  assert(
    FEE_STRUCTURE.LP_SHARE === 0.5,
    'LP share is 50%'
  );
  
  // Platform share
  assert(
    FEE_STRUCTURE.PLATFORM_SHARE === 0.5,
    'Platform share is 50%'
  );
  
  // Fee split adds up to 100%
  assert(
    FEE_STRUCTURE.LP_SHARE + FEE_STRUCTURE.PLATFORM_SHARE === 1.0,
    'Fee split adds up to 100%'
  );
  
  // Prop creator share
  assert(
    FEE_STRUCTURE.PROP_CREATOR_SHARE === 0.01,
    'Prop bet creator share is 1%'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: MARKET CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

function testMarketCategories() {
  section('Market Categories');
  
  const expectedCategories = ['sports', 'crypto', 'politics', 'entertainment', 'finance', 'tech', 'science', 'world', 'other'];
  
  for (const category of expectedCategories) {
    assert(
      Object.values(MARKET_CATEGORIES).includes(category),
      `Category "${category}" is defined`
    );
  }
  
  assert(
    Object.keys(MARKET_CATEGORIES).length === expectedCategories.length,
    `All ${expectedCategories.length} categories are defined`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: MARKET VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

function testMarketValidation() {
  section('Market Validation');
  
  // Test valid market
  const validResult = validateMarket(VALID_MARKET);
  assert(
    validResult.valid === true,
    'Valid market passes validation',
    validResult.errors.join(', ')
  );
  
  // Test missing ID
  const noId = { ...VALID_MARKET, id: undefined };
  const noIdResult = validateMarket(noId);
  assert(
    noIdResult.valid === false && noIdResult.errors.some(e => e.includes('ID')),
    'Market without ID fails validation'
  );
  
  // Test title too short
  const shortTitle = { ...VALID_MARKET, title: 'Short' };
  const shortTitleResult = validateMarket(shortTitle);
  assert(
    shortTitleResult.valid === false && shortTitleResult.errors.some(e => e.includes('Title')),
    'Market with title < 10 chars fails validation'
  );
  
  // Test title too long
  const longTitle = { ...VALID_MARKET, title: 'A'.repeat(201) };
  const longTitleResult = validateMarket(longTitle);
  assert(
    longTitleResult.valid === false && longTitleResult.errors.some(e => e.includes('Title')),
    'Market with title > 200 chars fails validation'
  );
  
  // Test description too short
  const shortDesc = { ...VALID_MARKET, description: 'Too short' };
  const shortDescResult = validateMarket(shortDesc);
  assert(
    shortDescResult.valid === false && shortDescResult.errors.some(e => e.includes('Description')),
    'Market with description < 20 chars fails validation'
  );
  
  // Test insufficient outcomes
  const oneOutcome = { ...VALID_MARKET, outcomes: [{ index: 0, label: 'Yes' }] };
  const oneOutcomeResult = validateMarket(oneOutcome);
  assert(
    oneOutcomeResult.valid === false && oneOutcomeResult.errors.some(e => e.includes('outcomes')),
    'Market with < 2 outcomes fails validation'
  );
  
  // Test too many outcomes
  const manyOutcomes = { 
    ...VALID_MARKET, 
    outcomes: Array.from({ length: 11 }, (_, i) => ({ index: i, label: `Option ${i}` }))
  };
  const manyOutcomesResult = validateMarket(manyOutcomes);
  assert(
    manyOutcomesResult.valid === false && manyOutcomesResult.errors.some(e => e.includes('outcomes')),
    'Market with > 10 outcomes fails validation'
  );
  
  // Test duplicate outcome labels
  const dupLabels = { 
    ...VALID_MARKET, 
    outcomes: [{ index: 0, label: 'Yes' }, { index: 1, label: 'Yes' }]
  };
  const dupLabelsResult = validateMarket(dupLabels);
  assert(
    dupLabelsResult.valid === false && dupLabelsResult.errors.some(e => e.includes('unique')),
    'Market with duplicate outcome labels fails validation'
  );
  
  // Test missing resolution criteria
  const noResolution = { ...VALID_MARKET, resolution_criteria: undefined };
  const noResolutionResult = validateMarket(noResolution);
  assert(
    noResolutionResult.valid === false && noResolutionResult.errors.some(e => e.includes('Resolution')),
    'Market without resolution criteria fails validation'
  );
  
  // Test invalid category
  const badCategory = { ...VALID_MARKET, category: 'invalid_category' };
  const badCategoryResult = validateMarket(badCategory);
  assert(
    badCategoryResult.valid === false && badCategoryResult.errors.some(e => e.includes('category')),
    'Market with invalid category fails validation'
  );
  
  // Test insufficient liquidity
  const lowLiquidity = { ...VALID_MARKET, initial_liquidity: 50 };
  const lowLiquidityResult = validateMarket(lowLiquidity);
  assert(
    lowLiquidityResult.valid === false && lowLiquidityResult.errors.some(e => e.includes('liquidity')),
    'Market with < $100 BC liquidity fails validation'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: CAN BET VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

function testCanBetValidation() {
  section('Can Bet Validation');
  
  // Active market can accept bets
  const activeMarket = { ...VALID_MARKET, status: 'active' };
  const activeResult = canBetOnMarket(activeMarket);
  assert(
    activeResult.canBet === true,
    'Active market can accept bets'
  );
  
  // Pending market cannot accept bets
  const pendingMarket = { ...VALID_MARKET, status: 'pending' };
  const pendingResult = canBetOnMarket(pendingMarket);
  assert(
    pendingResult.canBet === false,
    'Pending market cannot accept bets',
    pendingResult.reason
  );
  
  // Frozen market cannot accept bets
  const frozenMarket = { ...VALID_MARKET, status: 'frozen' };
  const frozenResult = canBetOnMarket(frozenMarket);
  assert(
    frozenResult.canBet === false,
    'Frozen market cannot accept bets',
    frozenResult.reason
  );
  
  // Resolved market cannot accept bets
  const resolvedMarket = { ...VALID_MARKET, status: 'resolved' };
  const resolvedResult = canBetOnMarket(resolvedMarket);
  assert(
    resolvedResult.canBet === false,
    'Resolved market cannot accept bets',
    resolvedResult.reason
  );
  
  // Closed market cannot accept bets
  const closedMarket = { 
    ...VALID_MARKET, 
    status: 'active',
    closes_at: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
  };
  const closedResult = canBetOnMarket(closedMarket);
  assert(
    closedResult.canBet === false,
    'Market past closes_at cannot accept bets',
    closedResult.reason
  );
  
  // Market closing soon cannot accept bets
  const closingSoon = { 
    ...VALID_MARKET, 
    status: 'active',
    closes_at: Math.floor(Date.now() / 1000) + 60 // 1 minute from now
  };
  const closingSoonResult = canBetOnMarket(closingSoon);
  assert(
    closingSoonResult.canBet === false,
    'Market closing in < 5 min cannot accept bets',
    closingSoonResult.reason
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: BET VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

function testBetValidation() {
  section('Bet Validation');
  
  // Valid bet
  const validBet = validateBet(100, VALID_MARKET);
  assert(
    validBet.valid === true,
    'Bet of $100 is valid'
  );
  
  // Bet below minimum
  const belowMin = validateBet(0.5, VALID_MARKET);
  assert(
    belowMin.valid === false && belowMin.errors.some(e => e.includes('Minimum')),
    'Bet below $1 fails validation'
  );
  
  // Bet above maximum
  const aboveMax = validateBet(15000, VALID_MARKET);
  assert(
    aboveMax.valid === false && aboveMax.errors.some(e => e.includes('Maximum')),
    'Bet above $10,000 fails validation'
  );
  
  // Bet at minimum
  const atMin = validateBet(1, VALID_MARKET);
  assert(
    atMin.valid === true,
    'Bet of exactly $1 (minimum) is valid'
  );
  
  // Bet at maximum (with sufficient pool liquidity)
  const largePool = { ...VALID_MARKET, liquidity: 100000 }; // $100k pool
  const atMax = validateBet(10000, largePool);
  assert(
    atMax.valid === true,
    'Bet of exactly $10,000 (maximum) is valid with large pool'
  );
  
  // Bet exceeding pool percentage
  const smallPool = { ...VALID_MARKET, liquidity: 100 };
  const tooLarge = validateBet(50, smallPool); // 50% of 100
  assert(
    tooLarge.valid === false && tooLarge.errors.some(e => e.includes('25%')),
    'Bet exceeding 25% of pool fails validation'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: POOL INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

function testPoolInitialization() {
  section('Pool Initialization');
  
  // Binary market initialization
  const binaryPool = calculateInitialPool(100, 2);
  
  assert(
    binaryPool.liquidity === 100,
    'Pool liquidity matches input'
  );
  
  assert(
    binaryPool.numOutcomes === 2,
    'Binary market has 2 outcomes'
  );
  
  assert(
    binaryPool.reserves.length === 2,
    'Binary pool has 2 reserve pools'
  );
  
  assert(
    binaryPool.reserves[0] === binaryPool.reserves[1],
    'Initial reserves are equal (50/50 odds)'
  );
  
  assert(
    binaryPool.prices[0] === 0.5 && binaryPool.prices[1] === 0.5,
    'Initial prices are 50/50'
  );
  
  assert(
    binaryPool.k === binaryPool.reserves[0] * binaryPool.reserves[1],
    'K constant calculated correctly (x * y = k)'
  );
  
  // Multi-outcome market initialization
  const triplePool = calculateInitialPool(300, 3);
  
  assert(
    triplePool.numOutcomes === 3,
    'Triple market has 3 outcomes'
  );
  
  assert(
    triplePool.reserves.length === 3,
    'Triple pool has 3 reserve pools'
  );
  
  assert(
    Math.abs(triplePool.prices[0] - 0.333) < 0.01,
    'Triple market initial prices are ~33% each',
    `Got ${triplePool.prices[0]}`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE: COMBINED REQUIREMENTS OBJECT
// ═══════════════════════════════════════════════════════════════════════════

function testCombinedRequirements() {
  section('Combined MARKET_REQUIREMENTS Object');
  
  // Liquidity
  assert(
    MARKET_REQUIREMENTS.MIN_LIQUIDITY === 100,
    'MIN_LIQUIDITY in combined object'
  );
  
  // Betting
  assert(
    MARKET_REQUIREMENTS.MIN_BET === 1,
    'MIN_BET in combined object'
  );
  
  // Outcomes
  assert(
    MARKET_REQUIREMENTS.MIN_OUTCOMES === 2,
    'MIN_OUTCOMES in combined object'
  );
  
  // Content
  assert(
    MARKET_REQUIREMENTS.MIN_TITLE_LENGTH === 10,
    'MIN_TITLE_LENGTH in combined object'
  );
  
  // Timing
  assert(
    MARKET_REQUIREMENTS.MIN_DURATION_MS === 3600000,
    'MIN_DURATION_MS in combined object'
  );
  
  // Fees
  assert(
    MARKET_REQUIREMENTS.TRADING_FEE_PERCENT === 2.0,
    'TRADING_FEE_PERCENT in combined object'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log('═'.repeat(70));
console.log('  PHASE 4: MARKET STANDARDS VALIDATION TESTS');
console.log('  Prism Prediction Market - Minimum Requirements');
console.log('═'.repeat(70));

testMarketStatusConstants();
testLiquidityRequirements();
testTimingRequirements();
testOutcomeRequirements();
testContentRequirements();
testBettingLimits();
testFeeStructure();
testMarketCategories();
testMarketValidation();
testCanBetValidation();
testBetValidation();
testPoolInitialization();
testCombinedRequirements();

// ═══════════════════════════════════════════════════════════════════════════
// RESULTS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

console.log(`\n${'═'.repeat(70)}`);
console.log('  TEST RESULTS');
console.log('═'.repeat(70));
console.log(`  ✅ Passed: ${testsPassed}`);
console.log(`  ❌ Failed: ${testsFailed}`);
console.log(`  📊 Total:  ${testsPassed + testsFailed}`);
console.log('═'.repeat(70));

if (testsFailed === 0) {
  console.log('\n🎉 ALL MARKET STANDARDS TESTS PASSED!\n');
  console.log('Market requirements validated:');
  console.log('  ✓ Minimum $100 BC initial liquidity');
  console.log('  ✓ 2-10 outcomes with unique labels');
  console.log('  ✓ 10-200 character titles');
  console.log('  ✓ Resolution criteria required');
  console.log('  ✓ $1-$10,000 bet limits');
  console.log('  ✓ 2% trading fee structure');
  console.log('  ✓ Valid category assignment');
  process.exit(0);
} else {
  console.log('\n⚠️  SOME TESTS FAILED - Review above for details\n');
  process.exit(1);
}
