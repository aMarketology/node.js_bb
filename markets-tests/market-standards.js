/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MARKET STANDARDS - Prism Prediction Market
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This file contains all the constants and validation rules for markets
 * on the Prism Prediction Market platform.
 * 
 * Import this file for:
 * - Market validation
 * - Test assertions
 * - SDK configuration
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// MARKET STATUS CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const MARKET_STATUS = {
  DRAFT: 'draft',           // Created but not submitted
  PENDING: 'pending',       // Awaiting initial liquidity
  ACTIVE: 'active',         // Trading is open
  FROZEN: 'frozen',         // Trading halted, awaiting resolution
  RESOLVED: 'resolved',     // Outcome determined, payouts complete
  CANCELLED: 'cancelled',   // Market voided, refunds issued
  DISPUTED: 'disputed'      // Resolution contested
};

// ═══════════════════════════════════════════════════════════════════════════
// MARKET TYPE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const MARKET_TYPE = {
  MAIN: 'main',             // Primary event market
  USER_PROP: 'user_prop',   // User-created prop bet
  PROP: 'prop'              // Official prop bet
};

// ═══════════════════════════════════════════════════════════════════════════
// TRADING TYPE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TRADING_TYPE = {
  CPMM: 'cpmm',             // Constant Product Market Maker (AMM)
  ORDERBOOK: 'orderbook'    // Traditional order book
};

// ═══════════════════════════════════════════════════════════════════════════
// LIQUIDITY REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════

const LIQUIDITY_REQUIREMENTS = {
  // Minimum liquidity to activate a market
  MINIMUM: 100,                    // $100 BC
  
  // Recommended liquidity for good UX
  RECOMMENDED: 500,                // $500 BC
  
  // Maximum liquidity per market
  MAXIMUM: 1000000,                // $1,000,000 BC
  
  // Currency
  CURRENCY: 'BC'                   // BlackCoin credits
};

// ═══════════════════════════════════════════════════════════════════════════
// TIMING REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════

const TIMING_REQUIREMENTS = {
  // Minimum duration for a market
  MIN_DURATION_HOURS: 1,
  MIN_DURATION_MS: 60 * 60 * 1000,                    // 1 hour
  
  // Maximum duration for a market
  MAX_DURATION_DAYS: 365,
  MAX_DURATION_MS: 365 * 24 * 60 * 60 * 1000,        // 365 days
  
  // Buffer before market closes
  MIN_TIME_BEFORE_CLOSE_SECONDS: 300,                 // 5 minutes
  MIN_TIME_BEFORE_CLOSE_MS: 5 * 60 * 1000,
  
  // Maximum time in frozen state before resolution
  FREEZE_GRACE_PERIOD_HOURS: 72,
  FREEZE_GRACE_PERIOD_MS: 72 * 60 * 60 * 1000,       // 72 hours
  
  // Time to fund a pending market
  FUNDING_TIMEOUT_DAYS: 7,
  FUNDING_TIMEOUT_MS: 7 * 24 * 60 * 60 * 1000        // 7 days
};

// ═══════════════════════════════════════════════════════════════════════════
// OUTCOME REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════

const OUTCOME_REQUIREMENTS = {
  // Minimum outcomes (binary market)
  MINIMUM: 2,
  
  // Maximum outcomes
  MAXIMUM: 10,
  
  // Label constraints
  LABEL_MAX_LENGTH: 50,
  
  // Binary markets must have a "No" option
  BINARY_MUST_INCLUDE_NO: true
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════

const CONTENT_REQUIREMENTS = {
  // Title constraints
  TITLE_MIN_LENGTH: 10,
  TITLE_MAX_LENGTH: 200,
  
  // Description constraints
  DESCRIPTION_MIN_LENGTH: 20,
  DESCRIPTION_MAX_LENGTH: 2000,
  
  // Resolution criteria is mandatory
  RESOLUTION_CRITERIA_REQUIRED: true
};

// ═══════════════════════════════════════════════════════════════════════════
// BETTING LIMITS
// ═══════════════════════════════════════════════════════════════════════════

const BETTING_LIMITS = {
  // Minimum bet size
  MIN_BET: 1,                      // $1 BC
  
  // Maximum single bet
  MAX_BET: 10000,                  // $10,000 BC
  
  // Maximum position as % of pool
  MAX_POSITION_PERCENT: 25         // 25% of pool
};

// ═══════════════════════════════════════════════════════════════════════════
// FEE STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════

const FEE_STRUCTURE = {
  // Trading fee percentage
  TRADING_FEE_PERCENT: 2.0,        // 2% of each trade
  
  // LP share of trading fees
  LP_SHARE: 0.5,                   // 50% to LPs
  
  // Platform share of trading fees
  PLATFORM_SHARE: 0.5,             // 50% to platform
  
  // Prop bet creator share
  PROP_CREATOR_SHARE: 0.01         // 1% of trading fees
};

// ═══════════════════════════════════════════════════════════════════════════
// POOL INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

const POOL_INITIALIZATION = {
  // Initial price for binary markets
  INITIAL_PRICE_YES: 0.50,         // $0.50 per YES share
  INITIAL_PRICE_NO: 0.50,          // $0.50 per NO share
  
  // AMM formula
  FORMULA: 'x * y = k',            // Constant product
  
  // Price bounds
  MIN_PRICE: 0.01,                 // 1% minimum odds
  MAX_PRICE: 0.99                  // 99% maximum odds
};

// ═══════════════════════════════════════════════════════════════════════════
// MARKET CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

const MARKET_CATEGORIES = {
  SPORTS: 'sports',
  CRYPTO: 'crypto',
  POLITICS: 'politics',
  ENTERTAINMENT: 'entertainment',
  FINANCE: 'finance',
  TECH: 'tech',
  SCIENCE: 'science',
  WORLD: 'world',
  OTHER: 'other'
};

const CATEGORY_SUBCATEGORIES = {
  sports: ['football', 'basketball', 'soccer', 'mma', 'esports', 'other'],
  crypto: ['price', 'protocol', 'regulation', 'adoption'],
  politics: ['elections', 'legislation', 'international', 'policy'],
  entertainment: ['movies', 'tv', 'music', 'awards', 'streaming'],
  finance: ['stocks', 'indices', 'commodities', 'forex', 'rates'],
  tech: ['product launches', 'acquisitions', 'ai', 'startups'],
  science: ['space', 'medicine', 'climate', 'physics'],
  world: ['events', 'disasters', 'economy', 'demographics']
};

// ═══════════════════════════════════════════════════════════════════════════
// RESOLUTION SOURCES (by category)
// ═══════════════════════════════════════════════════════════════════════════

const ACCEPTABLE_RESOLUTION_SOURCES = {
  sports: ['official league', 'espn', 'fifa', 'ufc', 'nba.com', 'nfl.com'],
  crypto: ['coingecko', 'binance', 'coinbase', 'chainlink', 'coinmarketcap'],
  politics: ['ap', 'reuters', 'official government', 'congress.gov'],
  entertainment: ['official announcements', 'box office mojo', 'nielsen'],
  finance: ['bloomberg', 'yahoo finance', 'federal reserve', 'sec filings'],
  tech: ['company announcements', 'sec filings', 'techcrunch'],
  science: ['nasa', 'who', 'nature', 'peer-reviewed journals'],
  world: ['un', 'world bank', 'imf', 'official statistics']
};

// ═══════════════════════════════════════════════════════════════════════════
// COMBINED MARKET REQUIREMENTS (for easy import)
// ═══════════════════════════════════════════════════════════════════════════

const MARKET_REQUIREMENTS = {
  // Liquidity
  MIN_LIQUIDITY: LIQUIDITY_REQUIREMENTS.MINIMUM,
  MAX_LIQUIDITY: LIQUIDITY_REQUIREMENTS.MAXIMUM,
  RECOMMENDED_LIQUIDITY: LIQUIDITY_REQUIREMENTS.RECOMMENDED,
  
  // Betting
  MIN_BET: BETTING_LIMITS.MIN_BET,
  MAX_BET: BETTING_LIMITS.MAX_BET,
  MAX_POSITION_PERCENT: BETTING_LIMITS.MAX_POSITION_PERCENT,
  
  // Outcomes
  MIN_OUTCOMES: OUTCOME_REQUIREMENTS.MINIMUM,
  MAX_OUTCOMES: OUTCOME_REQUIREMENTS.MAXIMUM,
  OUTCOME_LABEL_MAX_LENGTH: OUTCOME_REQUIREMENTS.LABEL_MAX_LENGTH,
  
  // Content
  MIN_TITLE_LENGTH: CONTENT_REQUIREMENTS.TITLE_MIN_LENGTH,
  MAX_TITLE_LENGTH: CONTENT_REQUIREMENTS.TITLE_MAX_LENGTH,
  MIN_DESCRIPTION_LENGTH: CONTENT_REQUIREMENTS.DESCRIPTION_MIN_LENGTH,
  MAX_DESCRIPTION_LENGTH: CONTENT_REQUIREMENTS.DESCRIPTION_MAX_LENGTH,
  
  // Timing
  MIN_DURATION_MS: TIMING_REQUIREMENTS.MIN_DURATION_MS,
  MAX_DURATION_MS: TIMING_REQUIREMENTS.MAX_DURATION_MS,
  FUNDING_TIMEOUT_MS: TIMING_REQUIREMENTS.FUNDING_TIMEOUT_MS,
  FREEZE_GRACE_MS: TIMING_REQUIREMENTS.FREEZE_GRACE_PERIOD_MS,
  
  // Fees
  TRADING_FEE_PERCENT: FEE_STRUCTURE.TRADING_FEE_PERCENT
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate a market object against requirements
 * @param {object} market - Market object to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateMarket(market) {
  const errors = [];
  
  // Required fields
  if (!market.id) errors.push('Market ID is required');
  if (!market.title) errors.push('Market title is required');
  if (!market.description) errors.push('Market description is required');
  if (!market.outcomes || !Array.isArray(market.outcomes)) errors.push('Outcomes array is required');
  if (!market.closes_at) errors.push('closes_at timestamp is required');
  if (!market.resolution_criteria) errors.push('Resolution criteria is required');
  if (!market.category) errors.push('Category is required');
  
  // Title validation
  if (market.title) {
    if (market.title.length < CONTENT_REQUIREMENTS.TITLE_MIN_LENGTH) {
      errors.push(`Title must be at least ${CONTENT_REQUIREMENTS.TITLE_MIN_LENGTH} characters`);
    }
    if (market.title.length > CONTENT_REQUIREMENTS.TITLE_MAX_LENGTH) {
      errors.push(`Title must be at most ${CONTENT_REQUIREMENTS.TITLE_MAX_LENGTH} characters`);
    }
  }
  
  // Description validation
  if (market.description) {
    if (market.description.length < CONTENT_REQUIREMENTS.DESCRIPTION_MIN_LENGTH) {
      errors.push(`Description must be at least ${CONTENT_REQUIREMENTS.DESCRIPTION_MIN_LENGTH} characters`);
    }
    if (market.description.length > CONTENT_REQUIREMENTS.DESCRIPTION_MAX_LENGTH) {
      errors.push(`Description must be at most ${CONTENT_REQUIREMENTS.DESCRIPTION_MAX_LENGTH} characters`);
    }
  }
  
  // Outcomes validation
  if (market.outcomes && Array.isArray(market.outcomes)) {
    if (market.outcomes.length < OUTCOME_REQUIREMENTS.MINIMUM) {
      errors.push(`Market must have at least ${OUTCOME_REQUIREMENTS.MINIMUM} outcomes`);
    }
    if (market.outcomes.length > OUTCOME_REQUIREMENTS.MAXIMUM) {
      errors.push(`Market must have at most ${OUTCOME_REQUIREMENTS.MAXIMUM} outcomes`);
    }
    
    // Check for unique labels
    const labels = market.outcomes.map(o => o.label);
    const uniqueLabels = new Set(labels);
    if (labels.length !== uniqueLabels.size) {
      errors.push('Outcome labels must be unique');
    }
    
    // Check label lengths
    for (const outcome of market.outcomes) {
      if (outcome.label && outcome.label.length > OUTCOME_REQUIREMENTS.LABEL_MAX_LENGTH) {
        errors.push(`Outcome label "${outcome.label}" exceeds ${OUTCOME_REQUIREMENTS.LABEL_MAX_LENGTH} characters`);
      }
    }
  }
  
  // Timing validation
  if (market.closes_at) {
    const closesAt = typeof market.closes_at === 'number' 
      ? market.closes_at * 1000  // Convert from Unix timestamp if needed
      : new Date(market.closes_at).getTime();
    const now = Date.now();
    
    if (closesAt <= now) {
      errors.push('closes_at must be in the future');
    }
    
    const duration = closesAt - now;
    if (duration < TIMING_REQUIREMENTS.MIN_DURATION_MS) {
      errors.push(`Market must be open for at least ${TIMING_REQUIREMENTS.MIN_DURATION_HOURS} hour(s)`);
    }
    if (duration > TIMING_REQUIREMENTS.MAX_DURATION_MS) {
      errors.push(`Market cannot be open for more than ${TIMING_REQUIREMENTS.MAX_DURATION_DAYS} days`);
    }
  }
  
  // Liquidity validation
  if (market.initial_liquidity !== undefined) {
    if (market.initial_liquidity < LIQUIDITY_REQUIREMENTS.MINIMUM) {
      errors.push(`Initial liquidity must be at least ${LIQUIDITY_REQUIREMENTS.MINIMUM} $BC`);
    }
    if (market.initial_liquidity > LIQUIDITY_REQUIREMENTS.MAXIMUM) {
      errors.push(`Initial liquidity cannot exceed ${LIQUIDITY_REQUIREMENTS.MAXIMUM} $BC`);
    }
  }
  
  // Category validation
  if (market.category) {
    const validCategories = Object.values(MARKET_CATEGORIES);
    if (!validCategories.includes(market.category)) {
      errors.push(`Invalid category: ${market.category}. Must be one of: ${validCategories.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a market can accept bets
 * @param {object} market - Market object
 * @returns {object} - { canBet: boolean, reason: string }
 */
function canBetOnMarket(market) {
  // Status check
  if (market.status !== MARKET_STATUS.ACTIVE) {
    return { canBet: false, reason: `Market status is ${market.status}, must be ${MARKET_STATUS.ACTIVE}` };
  }
  
  // Time check
  const closesAt = typeof market.closes_at === 'number' 
    ? market.closes_at * 1000 
    : new Date(market.closes_at).getTime();
  const now = Date.now();
  
  if (closesAt <= now) {
    return { canBet: false, reason: 'Market has closed' };
  }
  
  // Buffer check
  const timeUntilClose = closesAt - now;
  if (timeUntilClose < TIMING_REQUIREMENTS.MIN_TIME_BEFORE_CLOSE_MS) {
    return { canBet: false, reason: 'Market closes in less than 5 minutes' };
  }
  
  // Liquidity check
  if (market.liquidity !== undefined && market.liquidity < LIQUIDITY_REQUIREMENTS.MINIMUM) {
    return { canBet: false, reason: `Insufficient liquidity: ${market.liquidity} < ${LIQUIDITY_REQUIREMENTS.MINIMUM}` };
  }
  
  return { canBet: true, reason: 'Market is accepting bets' };
}

/**
 * Validate a bet against limits
 * @param {number} amount - Bet amount
 * @param {object} market - Market object
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateBet(amount, market) {
  const errors = [];
  
  if (amount < BETTING_LIMITS.MIN_BET) {
    errors.push(`Minimum bet is ${BETTING_LIMITS.MIN_BET} $BC`);
  }
  
  if (amount > BETTING_LIMITS.MAX_BET) {
    errors.push(`Maximum bet is ${BETTING_LIMITS.MAX_BET} $BC`);
  }
  
  // Check position limit if market has liquidity info
  if (market && market.liquidity) {
    const maxPosition = market.liquidity * (BETTING_LIMITS.MAX_POSITION_PERCENT / 100);
    if (amount > maxPosition) {
      errors.push(`Bet exceeds ${BETTING_LIMITS.MAX_POSITION_PERCENT}% of pool liquidity (max: ${maxPosition.toFixed(2)} $BC)`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate initial pool state for given liquidity
 * @param {number} liquidity - Initial liquidity amount
 * @param {number} numOutcomes - Number of outcomes (default 2 for binary)
 * @returns {object} - Pool initialization state
 */
function calculateInitialPool(liquidity, numOutcomes = 2) {
  const sharesPerOutcome = liquidity / numOutcomes * 2; // Each share starts at $0.50
  const prices = Array(numOutcomes).fill(1 / numOutcomes);
  const reserves = Array(numOutcomes).fill(sharesPerOutcome);
  const k = reserves.reduce((acc, r) => acc * r, 1);
  
  return {
    liquidity,
    numOutcomes,
    reserves,
    prices,
    k,
    sharesPerOutcome
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Status constants
  MARKET_STATUS,
  MARKET_TYPE,
  TRADING_TYPE,
  
  // Requirements
  LIQUIDITY_REQUIREMENTS,
  TIMING_REQUIREMENTS,
  OUTCOME_REQUIREMENTS,
  CONTENT_REQUIREMENTS,
  BETTING_LIMITS,
  FEE_STRUCTURE,
  POOL_INITIALIZATION,
  
  // Categories
  MARKET_CATEGORIES,
  CATEGORY_SUBCATEGORIES,
  ACCEPTABLE_RESOLUTION_SOURCES,
  
  // Combined requirements
  MARKET_REQUIREMENTS,
  
  // Validation helpers
  validateMarket,
  canBetOnMarket,
  validateBet,
  calculateInitialPool
};
