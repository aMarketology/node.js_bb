# Phase 1: Core Pages (2 Weeks)

## 1. HOME PAGE - Market Discovery
**File:** `app/page.tsx` (replace current)

### What Users See
- Grid of market cards (3 columns desktop, 1 mobile)
- Category tabs: All, Sports, Politics, Crypto, Entertainment
- Search bar at top
- Each card shows: title, current odds, volume, time until close

### Components to Build
```
components/MarketCard.tsx
  - Market title
  - 2-3 outcome buttons with odds (e.g., "Korea 45%", "Draw 30%", "Czechia 25%")
  - Volume badge ("$12.5K traded")
  - Status badge ("Closes in 2 days")
  - Click → go to /markets/[slug]

components/CategoryFilter.tsx
  - Tab buttons for categories
  - Active tab highlighted
```

### SDK Integration
```typescript
import { useLayer2 } from '@/contexts/Layer2Context'

const markets = await sdk.listMarkets({ category: 'sports' })
```

### Design
- Clean white cards with shadows
- Green/red for odds up/down
- Responsive grid (CSS Grid or Tailwind)

---

## 2. ENHANCED MARKET DETAIL PAGE
**File:** `app/markets/[slug]/page.tsx` (enhance existing)

### What to Add

#### A. Price Chart (left side)
**Component:** `components/PriceChart.tsx`
- Line chart showing probability over time
- Use Recharts library
- Show last 7 days of data
- X-axis: time, Y-axis: probability (0-100%)

```typescript
// Need new backend endpoint
GET /markets/{id}/history?interval=1h&days=7

// Returns: [{ timestamp, prices: [0.45, 0.30, 0.25] }, ...]
```

#### B. Market Info Card (right sidebar)
**Component:** `components/MarketInfo.tsx`
- Creator address
- Created date
- Resolution date
- Total volume
- Total liquidity
- Oracle name (if assigned)

#### C. Recent Activity Feed (bottom)
**Component:** `components/ActivityFeed.tsx`
- List of recent bets
- Show: user (first 6 chars), outcome, amount, time ago
- "Alice bought 100 shares of Korea @ 45%"

```typescript
// Need new backend endpoint
GET /markets/{id}/trades?limit=20

// Returns: [{ user, outcome, shares, price, timestamp }, ...]
```

### Layout
```
┌─────────────────────────────────────────────┐
│ Market Title                                │
├──────────────────────┬──────────────────────┤
│                      │                      │
│   Price Chart        │   Betting Panel      │
│   (existing)         │   (existing)         │
│                      │                      │
│                      ├──────────────────────┤
│                      │   Market Info        │
│                      │   (NEW)              │
├──────────────────────┴──────────────────────┤
│   Recent Activity Feed (NEW)                │
└─────────────────────────────────────────────┘
```

---

## 3. PORTFOLIO PAGE
**File:** `app/portfolio/page.tsx` (NEW)

### Layout: 3 Tabs

#### Tab 1: Active Positions
**What to Show:**
- Table with columns:
  - Market name
  - Your bet (outcome + shares)
  - Current value
  - Profit/Loss ($ and %)
  - Actions (Sell button)

**Component:** `components/PositionCard.tsx`

```typescript
const positions = await sdk.getAllPositions()

// For each position:
const market = await sdk.getMarket(position.market_id)
const currentPrice = market.cpmm_pool.current_prices[position.outcome]
const currentValue = position.shares * currentPrice
const profitLoss = currentValue - position.cost_basis
```

#### Tab 2: History
**What to Show:**
- Table of past trades
- Columns: Date, Market, Outcome, Amount, Result (Win/Loss), Profit
- Filter: All / Wins / Losses

```typescript
const history = await sdk.getTransactions(limit: 100)
// Filter for bet/sell transactions
```

#### Tab 3: Summary Stats
- Total profit/loss (all time)
- Win rate %
- Total volume traded
- Number of markets traded
- Best trade
- Worst trade

### Design
- Green for profits, red for losses
- Big numbers for totals
- Simple table (no fancy charts yet)

---

## 4. BRIDGE PAGE - L1 ↔ L2 Transfers
**File:** `app/bridge/page.tsx` (NEW)

### Layout: Two Panels Side-by-Side

#### Left Panel: Deposit (L1 → L2)
```
┌──────────────────────────┐
│ Deposit to L2            │
├──────────────────────────┤
│ L1 Balance: 19,985 BB    │
│                          │
│ Amount: [______] BB      │
│                          │
│ [Max] button             │
│                          │
│ ⓘ Instant transfer       │
│                          │
│ [Deposit] button         │
└──────────────────────────┘
```

**What Happens:**
1. User enters amount
2. Click Deposit
3. Call `sendTransfer()` from blackbook-wallet.ts
4. Send to L2 bridge address (need to define this)
5. L2 backend watches for transfers to bridge address
6. Credits user's L2 account automatically

**Code:**
```typescript
import { sendTransfer } from '@/lib/blackbook-wallet'

const BRIDGE_ADDRESS = 'L1_BRIDGE1234...' // Define this

await sendTransfer(
  'http://localhost:8080',
  wallet,
  BRIDGE_ADDRESS,
  amount
)

// Then wait for L2 to credit (poll or WebSocket)
```

#### Right Panel: Withdraw (L2 → L1)
```
┌──────────────────────────┐
│ Withdraw to L1           │
├──────────────────────────┤
│ L2 Balance: 1,500 BB     │
│ (50 BB locked in bets)   │
│                          │
│ Amount: [______] BB      │
│                          │
│ [Max] button             │
│                          │
│ ⓘ Takes ~1 minute        │
│                          │
│ [Withdraw] button        │
└──────────────────────────┘
```

**What Happens:**
1. User enters amount
2. Click Withdraw
3. Call L2 endpoint: `POST /bridge/withdraw { amount }`
4. L2 deducts from user balance
5. L2 backend sends L1 transfer back to user
6. Show pending status until confirmed

**Code:**
```typescript
// Need new L2 endpoint
await sdk.request('POST', '/bridge/withdraw', { 
  amount,
  l1_address: wallet.l1Address 
})
```

#### Bottom: Transfer History
- List recent deposits/withdrawals
- Show: Type, Amount, Status (Pending/Complete), Time, Tx ID

---

## BACKEND WORK NEEDED

### 1. New L2 Endpoints
```
GET  /markets/{id}/history?interval=1h&days=7
  → Returns price history for charting

GET  /markets/{id}/trades?limit=20
  → Returns recent trades for activity feed

GET  /positions/{address}
  → Returns all user positions (already exists in SDK)

POST /bridge/withdraw
  → Request withdrawal to L1
  Body: { amount, l1_address }

GET  /bridge/history/{address}
  → Get deposit/withdrawal history
```

### 2. Bridge Service (New)
```rust
// Watches L1 blockchain for transfers to bridge address
// When detected: credits L2 account

// Processes L2 withdrawal requests
// Sends L1 transfer back to user
```

### 3. Define Bridge Address
Pick an L1 address to receive deposits:
```
BRIDGE_ADDRESS = "L1_BRIDGE1234567890ABCDEF..." 
```

---

## STEP-BY-STEP IMPLEMENTATION

### Day 1-2: Setup
- [ ] Create `lib/layer2-sdk.ts` (copy from layer-2-sdk.js, add types)
- [ ] Install dependencies: `npm install recharts`
- [ ] Define bridge address constant

### Day 3-4: Home Page
- [ ] Create `components/MarketCard.tsx`
- [ ] Create `components/CategoryFilter.tsx`
- [ ] Replace `app/page.tsx` with market discovery
- [ ] Test with mock data first
- [ ] Connect to real L2 API

### Day 5-6: Market Detail Enhancements
- [ ] Create `components/PriceChart.tsx` with Recharts
- [ ] Create `components/MarketInfo.tsx`
- [ ] Create `components/ActivityFeed.tsx`
- [ ] Add to existing market page
- [ ] Request backend endpoints for history/trades

### Day 7-8: Portfolio Page
- [ ] Create `app/portfolio/page.tsx`
- [ ] Create `components/PositionCard.tsx`
- [ ] Implement 3 tabs (Active, History, Stats)
- [ ] Calculate P&L for each position
- [ ] Add sell functionality

### Day 9-10: Bridge Page
- [ ] Create `app/bridge/page.tsx`
- [ ] Create deposit form (L1 → L2)
- [ ] Create withdrawal form (L2 → L1)
- [ ] Create transfer history table
- [ ] Test with Alice/Bob accounts

### Day 11-12: Backend Integration
- [ ] Backend: Add market history endpoint
- [ ] Backend: Add trades endpoint
- [ ] Backend: Build bridge service
- [ ] Backend: Add withdrawal endpoint
- [ ] Test end-to-end flows

### Day 13-14: Polish & Testing
- [ ] Mobile responsive testing
- [ ] Error handling for all forms
- [ ] Loading states
- [ ] Empty states (no positions, no history)
- [ ] Final QA

---

## SUCCESS CRITERIA

### Home Page ✓
- [ ] Shows at least 10 markets
- [ ] Category filter works
- [ ] Search filters markets
- [ ] Cards link to market detail
- [ ] Loads in < 2 seconds

### Market Detail ✓
- [ ] Chart shows last 7 days
- [ ] Recent trades update
- [ ] Market info accurate
- [ ] All data loads

### Portfolio ✓
- [ ] Shows all user positions
- [ ] P&L calculates correctly
- [ ] Sell button works
- [ ] History shows past trades
- [ ] Stats are accurate

### Bridge ✓
- [ ] Can deposit L1 → L2
- [ ] Can withdraw L2 → L1
- [ ] Balance updates
- [ ] History shows transfers
- [ ] Works with Alice/Bob

---

## FILE CHECKLIST

```
app/
├── page.tsx                    ⭐ REPLACE (Home)
├── markets/[slug]/page.tsx     🔨 ENHANCE (Add chart, info, activity)
├── portfolio/page.tsx          ⭐ NEW
├── bridge/page.tsx             ⭐ NEW

components/
├── MarketCard.tsx              ⭐ NEW
├── CategoryFilter.tsx          ⭐ NEW
├── PriceChart.tsx              ⭐ NEW
├── MarketInfo.tsx              ⭐ NEW
├── ActivityFeed.tsx            ⭐ NEW
├── PositionCard.tsx            ⭐ NEW
├── BridgeForm.tsx              ⭐ NEW

lib/
├── layer2-sdk.ts               ⭐ NEW (port from .js)

constants/
├── bridge.ts                   ⭐ NEW (define BRIDGE_ADDRESS)
```

---

## QUESTIONS TO ANSWER

1. **Bridge Address:** What L1 address should receive deposits?
2. **Bridge Service:** Run as separate process or part of L2 backend?
3. **Withdrawal Speed:** Instant or queue with manual approval?
4. **History Retention:** How many days of price history to store?
5. **Position Refresh:** Real-time WebSocket or poll every 10 seconds?

---

**Next Update:** January 18, 2026 (end of Week 1)
