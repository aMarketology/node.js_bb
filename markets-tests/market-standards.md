# Prism Prediction Market - Market Standards

> **Version:** 1.0.0  
> **Last Updated:** January 23, 2026  
> **Network:** BlackBook L2 (Prism Prediction Markets)

This document defines the minimum requirements for events to be live and bettable on the Prism Prediction Market platform.

---

## Table of Contents

1. [Market Lifecycle](#market-lifecycle)
2. [Minimum Requirements for Live Markets](#minimum-requirements-for-live-markets)
3. [Initial Funding Requirements](#initial-funding-requirements)
4. [Market Categories](#market-categories)
5. [Market Validation Rules](#market-validation-rules)
6. [Resolution Standards](#resolution-standards)
7. [Prop Bet Standards](#prop-bet-standards)

---

## Market Lifecycle

Markets on Prism follow a strict lifecycle progression:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MARKET LIFECYCLE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   DRAFT → PENDING → ACTIVE → FROZEN → RESOLVED                         │
│     │        │         │         │         │                           │
│  created  awaiting  trading   trading   payouts                        │
│           funding   enabled   halted    complete                       │
│                                                                         │
│   Alternative flows:                                                    │
│   - PENDING → CANCELLED (insufficient funding)                         │
│   - ACTIVE → CANCELLED (market voided)                                 │
│   - FROZEN → DISPUTED → RESOLVED (contested outcome)                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Status Definitions

| Status | Description | Trading Allowed | Duration |
|--------|-------------|-----------------|----------|
| `draft` | Market created, not yet submitted | No | Until submitted |
| `pending` | Awaiting initial liquidity funding | No | Max 7 days |
| `active` | Live and accepting bets | **Yes** | Until `closes_at` |
| `frozen` | Trading halted, awaiting resolution | No | Max 72 hours |
| `resolved` | Outcome determined, payouts complete | No | Final |
| `cancelled` | Market voided, refunds issued | No | Final |

---

## Minimum Requirements for Live Markets

### Core Requirements

For a market to transition from `pending` to `active` status:

```javascript
const MARKET_REQUIREMENTS = {
  // ═══════════════════════════════════════════════════════════
  // LIQUIDITY REQUIREMENTS
  // ═══════════════════════════════════════════════════════════
  liquidity: {
    minimum: 100,           // $BC - Minimum initial liquidity
    recommended: 500,       // $BC - Recommended for better UX
    maximum: 1000000,       // $BC - Maximum per market
    currency: 'BC'          // BlackCoin ($BC) credits
  },

  // ═══════════════════════════════════════════════════════════
  // TIMING REQUIREMENTS  
  // ═══════════════════════════════════════════════════════════
  timing: {
    minDurationHours: 1,           // Must be open for at least 1 hour
    maxDurationDays: 365,          // Maximum 1 year markets
    minTimeBeforeClose: 300,       // 5 min buffer before closes_at
    freezeGracePeriodHours: 72     // Max time in frozen before resolution
  },

  // ═══════════════════════════════════════════════════════════
  // OUTCOME REQUIREMENTS
  // ═══════════════════════════════════════════════════════════
  outcomes: {
    minimum: 2,             // At least 2 outcomes (Yes/No)
    maximum: 10,            // Maximum 10 outcomes
    labelMaxLength: 50,     // Characters per outcome label
    mustIncludeNo: true     // Binary markets must have "No" option
  },

  // ═══════════════════════════════════════════════════════════
  // CONTENT REQUIREMENTS
  // ═══════════════════════════════════════════════════════════
  content: {
    titleMinLength: 10,             // Descriptive title
    titleMaxLength: 200,            // Not too long
    descriptionMinLength: 20,       // Must have description
    descriptionMaxLength: 2000,     // Reasonable limit
    resolutionCriteriaRequired: true // MUST specify resolution source
  }
};
```

### Validation Checklist

Before a market goes live, the system validates:

- [x] **Unique ID**: Market ID is unique across all markets
- [x] **Valid Title**: Title is clear, unambiguous, and 10-200 characters
- [x] **Description**: Detailed description of 20-2000 characters
- [x] **Resolution Criteria**: Clear, verifiable resolution source specified
- [x] **Outcomes**: 2-10 valid outcomes with unique labels
- [x] **Closing Time**: `closes_at` timestamp is in the future
- [x] **Liquidity**: Minimum $100 BC initial liquidity funded
- [x] **Category**: Valid category assigned (sports, crypto, politics, etc.)
- [x] **No Duplicates**: No existing active market for same event

---

## Initial Funding Requirements

### Main Markets

| Market Type | Min Liquidity | Recommended | Creator Fee |
|-------------|---------------|-------------|-------------|
| **Sports** | $100 BC | $500 BC | 0% |
| **Crypto** | $100 BC | $500 BC | 0% |
| **Politics** | $100 BC | $500 BC | 0% |
| **Entertainment** | $100 BC | $250 BC | 0% |
| **Other** | $100 BC | $500 BC | 0% |

### Prop Bets (User-Created)

| Prop Type | Min Liquidity | Parent Market Req | Creator Share |
|-----------|---------------|-------------------|---------------|
| **Player Props** | $100 BC | Must be active | 1% of fees |
| **Game Props** | $100 BC | Must be active | 1% of fees |
| **Custom Props** | $100 BC | Must be active | 1% of fees |

### Funding Mechanics

```javascript
const FUNDING_CONFIG = {
  // Pool Initialization (CPMM - Constant Product Market Maker)
  poolInitialization: {
    // Initial liquidity split 50/50 for binary markets
    initialPriceYes: 0.50,    // $0.50 per YES share
    initialPriceNo: 0.50,     // $0.50 per NO share
    
    // For $100 initial liquidity:
    // - YES pool: 100 shares
    // - NO pool: 100 shares  
    // - K constant: 10,000
    
    formula: 'x * y = k',     // Constant product formula
  },

  // LP (Liquidity Provider) Rewards
  lpRewards: {
    tradingFeePercent: 2.0,   // 2% of each trade
    lpShare: 0.5,             // 50% of fees to LPs
    platformShare: 0.5        // 50% to platform
  },

  // Minimum Bet Sizes
  betting: {
    minimumBet: 1,            // $1 BC minimum bet
    maximumBet: 10000,        // $10,000 BC max single bet
    maxPositionPercent: 25    // Max 25% of pool per position
  }
};
```

### Pool Initialization Example

```
Initial Funding: $100 BC

Pool State After Initialization:
┌──────────────────────────────────────────┐
│  YES Pool: 100 shares ($0.50 each)       │
│  NO Pool:  100 shares ($0.50 each)       │
│  K Constant: 10,000                      │
│  Total Liquidity: $100 BC                │
│  Initial Odds: 50% / 50%                 │
└──────────────────────────────────────────┘

After $10 Bet on YES:
┌──────────────────────────────────────────┐
│  YES Pool: 83.33 shares                  │
│  NO Pool:  120 shares                    │
│  K Constant: 10,000 (unchanged)          │
│  New Odds: 59% YES / 41% NO              │
│  Bettor receives: ~16.67 YES shares      │
└──────────────────────────────────────────┘
```

---

## Market Categories

### Supported Categories

```javascript
const MARKET_CATEGORIES = {
  SPORTS: {
    code: 'sports',
    subcategories: ['football', 'basketball', 'soccer', 'mma', 'esports', 'other'],
    resolutionSources: ['official league', 'espn', 'fifa', 'ufc'],
    avgLiquidity: 500
  },
  
  CRYPTO: {
    code: 'crypto',
    subcategories: ['price', 'protocol', 'regulation', 'adoption'],
    resolutionSources: ['coingecko', 'binance', 'coinbase', 'chainlink'],
    avgLiquidity: 1000
  },
  
  POLITICS: {
    code: 'politics',
    subcategories: ['elections', 'legislation', 'international', 'policy'],
    resolutionSources: ['ap', 'reuters', 'official government'],
    avgLiquidity: 500
  },
  
  ENTERTAINMENT: {
    code: 'entertainment',
    subcategories: ['movies', 'tv', 'music', 'awards', 'streaming'],
    resolutionSources: ['official announcements', 'box office mojo', 'nielsen'],
    avgLiquidity: 250
  },
  
  FINANCE: {
    code: 'finance',
    subcategories: ['stocks', 'indices', 'commodities', 'forex', 'rates'],
    resolutionSources: ['bloomberg', 'yahoo finance', 'federal reserve'],
    avgLiquidity: 1000
  },
  
  TECH: {
    code: 'tech',
    subcategories: ['product launches', 'acquisitions', 'ai', 'startups'],
    resolutionSources: ['company announcements', 'sec filings', 'techcrunch'],
    avgLiquidity: 500
  },
  
  SCIENCE: {
    code: 'science',
    subcategories: ['space', 'medicine', 'climate', 'physics'],
    resolutionSources: ['nasa', 'who', 'nature', 'peer-reviewed'],
    avgLiquidity: 250
  },
  
  WORLD: {
    code: 'world',
    subcategories: ['events', 'disasters', 'economy', 'demographics'],
    resolutionSources: ['un', 'world bank', 'imf', 'official statistics'],
    avgLiquidity: 500
  }
};
```

---

## Market Validation Rules

### Required Fields Schema

```javascript
const MARKET_SCHEMA = {
  // Required fields for market creation
  required: {
    id: 'string',             // Unique market identifier
    title: 'string',          // Clear question/statement
    description: 'string',    // Detailed explanation
    outcomes: 'array',        // Array of outcome objects
    closes_at: 'timestamp',   // When trading stops
    resolution_criteria: 'string',  // How market will be resolved
    category: 'string',       // Market category
    initial_liquidity: 'number'     // Funding amount
  },

  // Optional fields
  optional: {
    slug: 'string',           // URL-friendly identifier
    tags: 'array',            // Searchable tags
    image_url: 'string',      // Market image
    resolution_date: 'timestamp',   // Expected resolution date
    parent_market_id: 'string',     // For prop bets
    created_by: 'string',     // Creator address
    metadata: 'object'        // Additional data
  },

  // Outcome object schema
  outcome: {
    index: 'number',          // 0, 1, 2, etc.
    label: 'string',          // "Yes", "No", "Team A", etc.
    description: 'string'     // Optional details
  }
};
```

### Validation Rules

```javascript
const VALIDATION_RULES = {
  // Title validation
  title: {
    minLength: 10,
    maxLength: 200,
    mustEndWithQuestionMark: false,  // Not required but recommended
    noSpecialChars: false,           // Allow reasonable special chars
    mustBeUnique: true               // No duplicate titles for active markets
  },

  // Timing validation
  timing: {
    closesAtMustBeFuture: true,
    minimumDuration: 60 * 60 * 1000,        // 1 hour minimum
    maximumDuration: 365 * 24 * 60 * 60 * 1000,  // 1 year max
    bufferBeforeEvent: 5 * 60 * 1000        // 5 min buffer
  },

  // Liquidity validation  
  liquidity: {
    minimum: 100,
    maximum: 1000000,
    mustBeFunded: true,      // Can't go active without funding
    fundingTimeout: 7 * 24 * 60 * 60 * 1000  // 7 days to fund
  },

  // Outcome validation
  outcomes: {
    minimumCount: 2,
    maximumCount: 10,
    uniqueLabels: true,
    maxLabelLength: 50,
    mustBeMutuallyExclusive: true  // One and only one can win
  }
};
```

---

## Resolution Standards

### Resolution Sources

Markets must specify a verifiable resolution source:

| Category | Acceptable Sources | Unacceptable Sources |
|----------|-------------------|---------------------|
| Sports | Official leagues, ESPN, FIFA | Social media, blogs |
| Crypto | CoinGecko, Binance, Chainlink | Personal price feeds |
| Politics | AP, Reuters, Official announcements | Opinion pieces |
| Finance | Bloomberg, SEC filings | Reddit, Twitter |

### Resolution Timeline

```
Event Occurs → Market Freezes → Resolution Window → Payouts
                     │                 │              │
              (auto-freeze)      (72 hour max)  (immediate)
```

### Resolution Criteria Examples

**Good Resolution Criteria:**
```
✅ "Resolves YES if Bitcoin price exceeds $100,000 USD on CoinGecko 
    at any point before 2026-06-01 00:00:00 UTC"

✅ "Resolves to the winning team according to official FIFA 
    match results at fifa.com"

✅ "Resolves YES if the bill is signed into law according to 
    Congress.gov before market close date"
```

**Bad Resolution Criteria:**
```
❌ "Resolves based on what most people think happened"
❌ "I'll decide the outcome"
❌ "Resolves to YES if Bitcoin moons"
❌ (no criteria specified)
```

---

## Prop Bet Standards

### Prop Bet Requirements

Prop bets are user-created markets attached to parent markets:

```javascript
const PROP_BET_REQUIREMENTS = {
  // Must have active parent market
  parentMarket: {
    mustBeActive: true,
    mustNotBeFrozen: true,
    propMustCloseBeforeParent: true
  },

  // Liquidity
  liquidity: {
    minimum: 100,            // Same as main markets
    sourceFromCreator: true  // Creator provides liquidity
  },

  // Content
  content: {
    mustRelateToParent: true,
    titleMinLength: 10,
    resolutionCriteriaRequired: true
  },

  // Creator incentives
  rewards: {
    creatorFeeShare: 0.01,   // 1% of trading fees
    minimumVolume: 100       // Must hit $100 volume to earn
  }
};
```

### Prop Bet Types

| Type | Description | Example |
|------|-------------|---------|
| **Player Props** | Individual performance | "Will Messi score 2+ goals?" |
| **Game Props** | In-game events | "Will there be a red card?" |
| **Special Props** | Unique scenarios | "Will the national anthem exceed 2 minutes?" |

---

## Quick Reference

### Market Ready Checklist

```
□ Market ID is unique
□ Title is 10-200 characters, clear and unambiguous
□ Description is 20-2000 characters
□ Resolution criteria specifies verifiable source
□ Outcomes are 2-10, mutually exclusive, with unique labels
□ closes_at is in the future (min 1 hour from now)
□ Category is valid
□ Initial liquidity is $100 BC minimum
□ No duplicate active market exists
```

### Minimum Viable Market

```javascript
const minimumViableMarket = {
  id: 'btc-100k-june-2026',
  title: 'Will Bitcoin exceed $100,000 before June 1, 2026?',
  description: 'This market resolves to YES if the price of Bitcoin (BTC) exceeds $100,000 USD at any point before June 1, 2026 00:00:00 UTC.',
  outcomes: [
    { index: 0, label: 'Yes' },
    { index: 1, label: 'No' }
  ],
  closes_at: 1748739600,  // June 1, 2026 00:00:00 UTC
  resolution_criteria: 'Resolves based on CoinGecko BTC/USD price. YES if price >= $100,000 at any point before close.',
  category: 'crypto',
  initial_liquidity: 100  // $100 BC
};
```

### Constants Summary

| Parameter | Value | Notes |
|-----------|-------|-------|
| Min Liquidity | $100 BC | Required to go active |
| Max Liquidity | $1,000,000 BC | Per market cap |
| Min Bet | $1 BC | Smallest allowed bet |
| Max Bet | $10,000 BC | Single bet limit |
| Trading Fee | 2% | Split between LPs and platform |
| Min Outcomes | 2 | Binary minimum |
| Max Outcomes | 10 | Multi-outcome limit |
| Min Duration | 1 hour | Shortest market |
| Max Duration | 365 days | Longest market |
| Freeze Grace | 72 hours | Max resolution time |
| Funding Timeout | 7 days | Time to fund pending market |

---

## Appendix: Market Status Codes

```javascript
// Export for use in tests and SDK
module.exports = {
  MARKET_STATUS: {
    DRAFT: 'draft',
    PENDING: 'pending',
    ACTIVE: 'active',
    FROZEN: 'frozen',
    RESOLVED: 'resolved',
    CANCELLED: 'cancelled',
    DISPUTED: 'disputed'
  },
  
  MARKET_REQUIREMENTS: {
    MIN_LIQUIDITY: 100,
    MAX_LIQUIDITY: 1000000,
    MIN_BET: 1,
    MAX_BET: 10000,
    MIN_OUTCOMES: 2,
    MAX_OUTCOMES: 10,
    MIN_TITLE_LENGTH: 10,
    MAX_TITLE_LENGTH: 200,
    MIN_DESCRIPTION_LENGTH: 20,
    MAX_DESCRIPTION_LENGTH: 2000,
    MIN_DURATION_MS: 60 * 60 * 1000,       // 1 hour
    MAX_DURATION_MS: 365 * 24 * 60 * 60 * 1000,  // 365 days
    FUNDING_TIMEOUT_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
    FREEZE_GRACE_MS: 72 * 60 * 60 * 1000,  // 72 hours
    TRADING_FEE_PERCENT: 2.0
  }
};
```

---

*Document maintained by Prism Prediction Market Team*
