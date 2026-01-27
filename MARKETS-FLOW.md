# Prism Prediction Market - Complete Markets Flow

> **Version:** 1.0.0  
> **Last Updated:** January 23, 2026  
> **Network:** BlackBook L2 (Prism Prediction Markets)

This document provides the complete technical flow for how markets move through the system, from initial creation to final resolution and payout.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [The Two-Layer System](#the-two-layer-system)
3. [Complete Market Lifecycle Flow](#complete-market-lifecycle-flow)
4. [Step-by-Step: Creating a Live Market](#step-by-step-creating-a-live-market)
5. [Dealer Operations](#dealer-operations)
6. [Market Activation Requirements](#market-activation-requirements)
7. [Trading Flow](#trading-flow)
8. [Resolution & Payout Flow](#resolution--payout-flow)
9. [API Reference](#api-reference)
10. [Status Reconciliation](#status-reconciliation)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRISM PREDICTION MARKET ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────┐         ┌─────────────────────────────────────┐  │
│   │      SUPABASE       │         │           LAYER 2 (L2)              │  │
│   │   (Config Layer)    │         │      (Authoritative Ledger)         │  │
│   ├─────────────────────┤         ├─────────────────────────────────────┤  │
│   │ • Market metadata   │         │ • CPMM liquidity pools              │  │
│   │ • Draft markets     │   ───►  │ • User balances                     │  │
│   │ • Frontend display  │         │ • Active bets                       │  │
│   │ • Admin config      │   ◄───  │ • Transaction history               │  │
│   │ • User history      │         │ • Ed25519 signatures                │  │
│   └─────────────────────┘         └─────────────────────────────────────┘  │
│           │                                       │                         │
│           │                                       │                         │
│           ▼                                       ▼                         │
│   ┌─────────────────────┐         ┌─────────────────────────────────────┐  │
│   │     FRONTEND        │         │           LAYER 1 (L1)              │  │
│   │   (User Interface)  │         │         (Bank/Vault)                │  │
│   ├─────────────────────┤         ├─────────────────────────────────────┤  │
│   │ • Market browser    │         │ • $BC (BlackCoin) balances          │  │
│   │ • Betting UI        │         │ • Deposits/Withdrawals              │  │
│   │ • Portfolio view    │         │ • Bridge operations                 │  │
│   └─────────────────────┘         └─────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Two-Layer System

### Critical Distinction

| Layer | Purpose | Data Stored | Authoritative For |
|-------|---------|-------------|-------------------|
| **Supabase** | Configuration & Display | Market metadata, titles, descriptions, categories | Frontend display, admin config |
| **L2 Ledger** | Trading & Balances | CPMM pools, reserves, bets, balances | **ALL trading operations** |

### Why This Matters

A market can exist in Supabase with `status: 'active'` but **NOT be tradeable** if it doesn't exist on L2.

```javascript
// Supabase status ≠ L2 reality
const supabaseMarket = { status: 'active', l2_market_id: 'trump_cz' };  // Shows in UI
const l2Markets = await fetch('http://localhost:1234/markets');         // May not include trump_cz!

// True status = L2 state
const isTrulyActive = l2Markets.markets.some(m => m.id === 'trump_cz' && !m.resolved);
```

### Source of Truth

```
┌────────────────────────────────────────────────────────────┐
│                    SOURCE OF TRUTH                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│   SUPABASE is authoritative for:                           │
│   ✓ Market titles, descriptions                            │
│   ✓ Categories and tags                                    │
│   ✓ Resolution criteria text                               │
│   ✓ Admin configuration                                    │
│   ✓ Draft market storage                                   │
│                                                            │
│   L2 LEDGER is authoritative for:                          │
│   ✓ Whether market can accept bets (EXISTS on L2)          │
│   ✓ Current prices (CPMM reserves)                         │
│   ✓ Liquidity amount                                       │
│   ✓ User balances                                          │
│   ✓ Bet positions                                          │
│   ✓ Resolution state                                       │
│   ✓ Payouts                                                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Complete Market Lifecycle Flow

```
                              MARKET LIFECYCLE
═══════════════════════════════════════════════════════════════════════════════

 1. DRAFT                2. PENDING              3. ACTIVE               
 ───────────────────     ───────────────────     ───────────────────     
 │ Supabase Only   │     │ Awaiting Funding│     │ LIVE ON L2      │     
 │                 │     │                 │     │                 │     
 │ • XML created   │────►│ • Submitted     │────►│ • Dealer funded │     
 │ • Seeded to DB  │     │ • Needs $100+   │     │ • CPMM active   │     
 │ • No L2 market  │     │ • 7 day timeout │     │ • Bets accepted │     
 └─────────────────┘     └─────────────────┘     └─────────────────┘     
                                                         │
                                                         │ closes_at reached
                                                         ▼
 6. RESOLVED             5. DISPUTED (optional)  4. FROZEN              
 ───────────────────     ───────────────────     ───────────────────     
 │ Final State    │     │ Contested       │     │ Trading Halted  │     
 │                │     │                 │     │                 │     
 │ • Winner set   │◄────│ • Under review  │◄────│ • Awaiting      │     
 │ • Payouts done │     │ • 72hr window   │     │   resolution    │     
 │ • Redeemable   │     │ • Arbitration   │     │ • No new bets   │     
 └─────────────────┘     └─────────────────┘     └─────────────────┘     

═══════════════════════════════════════════════════════════════════════════════
```

### Status Transitions

| From | To | Trigger | Who Can Trigger |
|------|-----|---------|-----------------|
| `draft` | `pending` | Market submitted for funding | Admin/System |
| `pending` | `active` | Dealer funds with ≥$100 BC | Dealer (signed) |
| `pending` | `cancelled` | 7 days without funding | System |
| `active` | `frozen` | `closes_at` time reached | System |
| `active` | `cancelled` | Market voided | Dealer (signed) |
| `frozen` | `resolved` | Oracle declares winner | Dealer (signed) |
| `frozen` | `disputed` | User disputes outcome | User (signed) |
| `disputed` | `resolved` | Dispute resolved | Dealer (signed) |

---

## Step-by-Step: Creating a Live Market

### Phase 1: Draft Creation (Supabase Only)

```bash
# 1. Create XML file in rss/events/
cat > rss/events/btc_100k.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<market id="btc_100k">
  <title>Will Bitcoin exceed $100,000 before June 1, 2026?</title>
  <description>This market resolves YES if BTC/USD exceeds $100,000...</description>
  <category>crypto</category>
  <source url="https://coingecko.com/en/coins/bitcoin"/>
  <outcomes>
    <outcome id="yes" probability="0.45">Yes - Above $100k</outcome>
    <outcome id="no" probability="0.55">No - Below $100k</outcome>
  </outcomes>
  <deadline>2026-06-01</deadline>
  <rules>Resolves based on CoinGecko BTC/USD price.</rules>
  <initial_pool>500</initial_pool>
</market>
EOF

# 2. Seed to Supabase
node scripts/seed-markets.js

# Result: Market exists in Supabase with status='pending'
# But NOT on L2 - cannot accept bets yet!
```

### Phase 2: Dealer Funding (L2 Activation)

```javascript
// Dealer must sign CREATE_MARKET transaction
import { UnifiedDealerSDK } from './sdk/unified-dealer-sdk.js';

const dealer = new UnifiedDealerSDK({
  privateKey: process.env.DEALER_PRIVATE_KEY,
  l2Url: 'http://localhost:1234'
});

// This creates the market ON L2 with CPMM pool
const result = await dealer.createMarket({
  title: 'Will Bitcoin exceed $100,000 before June 1, 2026?',
  outcomes: ['Yes - Above $100k', 'No - Below $100k'],
  liquidity: 500,  // $500 BC - DEBITED from dealer balance
  closes_at: 1748739600  // June 1, 2026
});

console.log(result);
// {
//   success: true,
//   market_id: 'MKT_1769301234_a1b2c3d4',  // L2 market ID
//   liquidity: 500,
//   reserves: [250, 250],  // 50/50 split
//   k: 62500  // Constant product
// }
```

### Phase 3: Sync L2 → Supabase

```javascript
// After L2 creation, sync status back to Supabase
const { SupabaseSync } = require('./integration/supabase-sync.js');

const sync = new SupabaseSync();
await sync.pushMarketsToSupabase();

// Now Supabase reflects:
// - l2_market_id: 'MKT_1769301234_a1b2c3d4'
// - status: 'active'
// - liquidity: 500
// - yes_price: 0.50
// - no_price: 0.50
```

---

## Dealer Operations

### Dealer Role

The **Dealer** is the market maker and oracle with special privileges:

| Operation | Requires Signature | Action Type |
|-----------|-------------------|-------------|
| Confirm deposits | Yes | `DEALER_CONFIRM_DEPOSIT` |
| Create markets | Yes | `CREATE_MARKET` |
| Resolve markets | Yes | `RESOLVE` |
| Void markets | Yes | `VOID_MARKET` |
| Complete withdrawals | Yes | `WITHDRAW_COMPLETE` |

### Dealer Credentials

```javascript
const DEALER = {
  l1_address: 'L1_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D',
  l2_address: 'L2_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D',
  public_key: '07943256765557e704e4945aa4d1d56a1b0aac60bd8cc328faa99572aee5e84a'
};
```

### Signed Transaction Format

```javascript
// All dealer operations require Ed25519 signature
const signedTransaction = {
  action: 'CREATE_MARKET',
  timestamp: Math.floor(Date.now() / 1000),
  nonce: `${Date.now()}_${randomId()}`,
  payload: {
    creator: 'L2_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D',
    title: 'Market Title',
    outcomes: ['Yes', 'No'],
    liquidity: 500,
    closes_at: null
  },
  signature: 'ed25519_signature_hex...'
};
```

---

## Market Activation Requirements

### Minimum Requirements Checklist

From [market-standards.md](market-standards.md):

```javascript
const ACTIVATION_REQUIREMENTS = {
  // ═══════════════════════════════════════════════════════════
  // MUST HAVE for activation
  // ═══════════════════════════════════════════════════════════
  
  liquidity: {
    minimum: 100,           // $100 BC minimum
    source: 'dealer',       // Dealer provides initial liquidity
    debited: true           // Deducted from dealer L2 balance
  },
  
  content: {
    title: { min: 10, max: 200 },
    description: { min: 20, max: 2000 },
    resolution_criteria: 'required'
  },
  
  outcomes: {
    count: { min: 2, max: 10 },
    mutually_exclusive: true
  },
  
  timing: {
    closes_at: 'must_be_future',
    min_duration: '1 hour'
  },
  
  signature: {
    type: 'Ed25519',
    signer: 'dealer',
    action: 'CREATE_MARKET'
  }
};
```

### Current L2 State (Live Data)

As of January 23, 2026:

| Metric | Value |
|--------|-------|
| **Total L2 Markets** | 7 |
| **Active (accepting bets)** | 3 |
| **Resolved** | 4 |
| **Dealer L2 Balance** | 53,500.00 BB |
| **Total Active Liquidity** | ~2,500 BB |

```
Active Markets on L2:
─────────────────────────────────────────────────────────────
  MKT_1769213640_5b703d5a | Test Market         | 1,000.00 BB
  MKT_1769213640_ed50e798 | Second Test Market  |   500.00 BB
  MKT_1769213969_271a80dd | Bet Test            | 1,000.15 BB
─────────────────────────────────────────────────────────────
```

### Supabase vs L2 Status

| Supabase Status | L2 Reality | Can Accept Bets? |
|-----------------|------------|------------------|
| `draft` | Not on L2 | ❌ No |
| `pending` | Not on L2 | ❌ No |
| `active` (no L2 ID) | Not on L2 | ❌ No |
| `active` (has L2 ID) | On L2, not resolved | ✅ **Yes** |
| `resolved` | On L2, resolved | ❌ No (redeem only) |

---

## Trading Flow

### User Places Bet

```
User Action                    System Response
───────────────────────────────────────────────────────────────────

1. User signs bet             → Signature verified (Ed25519)
   {                          
     action: 'BUY',           
     market_id: 'MKT_...',    
     outcome: 0,              → 0 = Yes, 1 = No
     amount: 100              → $100 BC bet
   }                          

2. Balance check              → User has ≥$100 L2 balance?
                              → Yes: Continue | No: Reject

3. CPMM calculation           → Calculate shares received
   Before: reserves = [500, 500], k = 250000
   Fee: 2% → $2 to LPs
   Net: $98 added to NO pool
   
4. Pool update                → New reserves calculated
   After: reserves = [412.5, 598]
   Shares received: ~87.5 YES shares
   New prices: YES 59.2% / NO 40.8%

5. State changes              → Atomic transaction
   - User balance: -100 BB
   - User position: +87.5 YES shares
   - Market volume: +100 BB
   - Market liquidity: updated

6. Response                   → Bet confirmation
   {
     success: true,
     shares: 87.5,
     avg_price: 1.14,
     new_prices: [0.592, 0.408]
   }
```

### CPMM Formula

```
Constant Product Market Maker (CPMM)
═══════════════════════════════════════════════════════════════════

Formula: x * y = k

Where:
  x = YES reserve
  y = NO reserve  
  k = constant (preserved across trades)

Price Calculation:
  YES price = y / (x + y)
  NO price  = x / (x + y)

Example:
  Initial: x=500, y=500, k=250,000
  Prices: YES=50%, NO=50%
  
  After $100 bet on YES (net $98 after 2% fee):
  - Add $98/2 = $49 to NO reserve (for 2-outcome market)
  - New y = 549
  - New x = k/y = 250,000/549 = 455.4
  - Shares = 500 - 455.4 = 44.6 YES shares
  - New prices: YES=54.7%, NO=45.3%
```

---

## Resolution & Payout Flow

### Resolution Timeline

```
Event Occurs         Market Freezes         Resolution         Payouts
      │                    │                    │                 │
      ▼                    ▼                    ▼                 ▼
  ┌────────┐          ┌─────────┐         ┌─────────┐       ┌─────────┐
  │ Real   │          │ Trading │         │ Oracle  │       │ Winners │
  │ World  │ ───────► │ Halted  │ ──────► │ Decides │ ────► │ Redeem  │
  │ Event  │          │         │         │         │       │ Shares  │
  └────────┘          └─────────┘         └─────────┘       └─────────┘
                           │                   │
                      Auto at            Dealer signs
                     closes_at           RESOLVE action
                                         (72hr max)
```

### Resolution Process

```javascript
// Dealer resolves market
const resolution = await dealer.resolveMarket({
  market_id: 'MKT_1769213987_f4a98740',
  winning_outcome: 0,  // 0 = YES won
  evidence: 'https://coingecko.com/btc-hit-100k'
});

// L2 state after resolution:
// - market.resolved = true
// - market.winning_outcome = 0
// - YES shareholders can redeem at $1.00 per share
// - NO shares worth $0.00
```

### Payout Calculation

```
PAYOUT EXAMPLE
═══════════════════════════════════════════════════════════════════

Market: "Will BTC hit $100k?"
Result: YES (outcome 0)

User Alice:
  - Bought 100 YES shares @ avg $0.55
  - Total spent: $55 BC
  - Payout: 100 × $1.00 = $100 BC
  - Profit: $45 BC (+82%)

User Bob:  
  - Bought 200 NO shares @ avg $0.45
  - Total spent: $90 BC
  - Payout: $0 (NO lost)
  - Loss: -$90 BC (-100%)

LP (Dealer):
  - Initial liquidity: $500 BC
  - Trading fees collected: $12.50 BC
  - Remaining after payouts: ~$387.50 BC
```

### Redemption

```javascript
// Winner redeems shares
const redemption = await user.redeemWinnings({
  market_id: 'MKT_1769213987_f4a98740'
});

// Response:
// {
//   success: true,
//   shares_redeemed: 100,
//   payout: 100.00,
//   new_balance: 1100.00
// }
```

---

## API Reference

### L2 Endpoints (Trading - Authoritative)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/markets` | List all L2 markets |
| `GET` | `/markets/{id}` | Get specific market |
| `GET` | `/markets/{id}/prices` | Get current CPMM prices |
| `GET` | `/balance/{address}` | Get user balance |
| `POST` | `/market` | Create market (dealer signed) |
| `POST` | `/bet` | Place bet (user signed) |
| `POST` | `/resolve` | Resolve market (dealer signed) |
| `POST` | `/redeem` | Redeem winning shares |

### Supabase Tables (Config - Display)

| Table | Purpose |
|-------|---------|
| `pmarket` | Market metadata and config |
| `prop_bets` | User-created prop bets |
| `user_bets` | Bet history (analytics) |
| `market_config` | Admin settings |

### Market Status Query

```javascript
// Check TRUE market status (combine both sources)
async function getMarketStatus(l2MarketId) {
  // 1. Check L2 (authoritative for trading)
  const l2Res = await fetch(`${L2_URL}/markets/${l2MarketId}`);
  const l2Market = l2Res.ok ? await l2Res.json() : null;
  
  // 2. Check Supabase (metadata)
  const { data: sbMarket } = await supabase
    .from('pmarket')
    .select('*')
    .eq('l2_market_id', l2MarketId)
    .single();
  
  return {
    exists_on_l2: !!l2Market,
    can_accept_bets: l2Market && !l2Market.resolved,
    supabase_status: sbMarket?.status,
    true_status: l2Market 
      ? (l2Market.resolved ? 'resolved' : 'active')
      : 'draft',
    liquidity: l2Market?.liquidity || 0,
    prices: l2Market?.prices || [0.5, 0.5]
  };
}
```

---

## Status Reconciliation

### 3-Layer Defense Architecture

To ensure only active markets with ≥$100 BC liquidity are displayed, filtering occurs at three layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                    3-LAYER FILTERING DEFENSE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAYER 1: API Proxy (/app/api/markets/route.ts)                │
│  ├─ Filters at server edge before sending to client            │
│  ├─ Checks: !resolved && liquidity >= 100                      │
│  └─ Impact: Reduces payload from ~350 markets → ~3 markets     │
│     (99% reduction in network transfer)                         │
│                                                                 │
│  LAYER 2: SDK (sdk/markets-sdk.js)                             │
│  ├─ Defensive client-side filtering                            │
│  ├─ Checks: !resolved && liquidity >= 100                      │
│  └─ Impact: Safety net if API proxy bypassed                   │
│                                                                 │
│  LAYER 3: Frontend (app/markets/page.tsx)                      │
│  ├─ Final safety net before display                            │
│  ├─ Checks: !resolved && liquidity >= 100                      │
│  └─ Impact: Prevents any unfunded markets from rendering       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Why 3 layers?**
1. **Performance**: API proxy filtering eliminates wasteful data transfer
2. **Security**: Defense in depth - no single point of failure
3. **Debugging**: Console logs at each layer show where filtering occurs

**Console Output Example:**
```
🔍 API Proxy: Filtered 354 → 3 active markets (≥100 BB liquidity)
🛡️ SDK Filter: 3 → 3 active markets (≥100 BB liquidity)
✅ Frontend: Loaded 3 active markets with liquidity (filtered from 3 total)
```

### Sync Script

To ensure Supabase reflects L2 reality:

```bash
# Sync L2 status to Supabase
node scripts/sync-l2-status.js
```

### Status Rules

```javascript
const STATUS_RULES = {
  // If market exists on L2 and not resolved → active
  'l2_active': {
    condition: (l2) => l2 && !l2.resolved,
    supabase_status: 'active'
  },
  
  // If market exists on L2 and resolved → resolved
  'l2_resolved': {
    condition: (l2) => l2 && l2.resolved,
    supabase_status: 'resolved'
  },
  
  // If market NOT on L2 → draft (metadata only)
  'not_on_l2': {
    condition: (l2) => !l2,
    supabase_status: 'draft'
  }
};
```

### Current Status Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKET STATUS SUMMARY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Supabase Markets:  354 (metadata entries)                      │
│                                                                 │
│  L2 Markets:          7 (actually tradeable)                    │
│    ├─ Active:         3 (accepting bets)                        │
│    └─ Resolved:       4 (payouts complete)                      │
│                                                                 │
│  Status Breakdown:                                              │
│    • 354 markets in Supabase marked "active"                    │
│    • Only 3 actually accept bets (exist on L2)                  │
│    • 351 are effectively "draft" (no L2 liquidity)              │
│                                                                 │
│  To activate a draft market:                                    │
│    1. Dealer signs CREATE_MARKET                                │
│    2. Funds with ≥$100 BC liquidity                             │
│    3. L2 creates CPMM pool                                      │
│    4. Sync updates Supabase status                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Market Activation Checklist

```
□ Market XML exists in rss/events/
□ Market seeded to Supabase (status: pending/draft)
□ Dealer has sufficient L2 balance (≥ liquidity amount)
□ Dealer signs CREATE_MARKET transaction
□ L2 creates market with CPMM pool
□ Sync script updates Supabase status to 'active'
□ Market appears in GET /markets response
□ Users can place bets
```

### Key Constants

| Constant | Value | Notes |
|----------|-------|-------|
| Min Liquidity | $100 BC | Required for activation |
| Trading Fee | 2% | Split LP/platform |
| Min Bet | $1 BC | Smallest bet |
| Max Bet | $10,000 BC | Single bet limit |
| Funding Timeout | 7 days | Pending → Cancelled |
| Resolution Window | 72 hours | Frozen → must resolve |

### Addresses

```
Dealer L1: L1_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D
Dealer L2: L2_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D
L2 Server: http://localhost:1234
```

---

*Document maintained by Prism Prediction Market Team*  
*See also: [market-standards.md](market-standards.md) | [MARKETS.md](MARKETS.md)*
