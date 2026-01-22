# BlackBook L1 ↔ L2 Settlement: Next Steps & Milestones

> **Updated January 18, 2026** - Using actual L2 endpoints and implemented features

## 🎯 Primary Objective
Build a complete prediction market betting system with real events, L1 settlement, and proper payouts using the BlackBook settlement protocol.

## 📋 Current State Assessment

### ✅ **Completed Foundation**
- [x] Ed25519 signature system with `@noble/ed25519`
- [x] Standardized L1/L2 address derivation 
- [x] Settlement SDK (`sdk/settlement-sdk.js`)
- [x] Settlement API routes (`app/api/settlement/route.ts`)
- [x] Settlement Context and UI components
- [x] Wallet system with encrypted vaults
- [x] L1/L2 balance tracking and virtual balance
- [x] Soft-lock mechanism for active bets

### 🔧 **Ready for Integration**
- Settlement protocol (`settlement.proto`) specification
- L1 Bank server (Rust/Axum, localhost:8080)
- L2 Casino server (Rust, localhost:1234)
- Next.js frontend with settlement UI
- Cryptographic utilities (signing/verification)

---

## 🚀 **MILESTONE 1: Event Creation & Management**
*Target: 1-2 days*

### 1.1 Real Prediction Event System

#### **Create Market Management API**
```typescript
// lib/market-manager.ts (Updated for L2 Backend)
interface Market {
  id: string;
  title: string;
  description: string;
  outcomes: string[];
  created_at: number;
  expires_at?: number;
  category: 'sports' | 'politics' | 'crypto' | 'entertainment';
  market_type: 'main' | 'prop' | 'user_prop';
  status: 'draft' | 'pending' | 'active' | 'frozen' | 'resolved';
  creator: string;
  initial_liquidity?: number;
  parent_id?: string; // For prop bets
  winning_outcome?: number;
  resolver?: string; // Dealer/Oracle address
}
```

#### **Task Breakdown:**
- [ ] Create `lib/market-manager.ts` - Market CRUD using real L2 endpoints
- [ ] Update `app/components/MarketCreator.tsx` - Use `/market` and `/market/draft`
- [ ] Create `app/components/MarketList.tsx` - Display markets from `/markets`
- [ ] Add dealer approval workflow for drafts: `/market/approve` (dealer auth required)
- [ ] Add prop bet creation using `/market/:id/prop/create`
- [ ] Add market storage sync with existing L2 backend

#### **L2 Backend Endpoints (✅ Already Implemented):**
```typescript
// Core Market Operations  
POST   /market              - Create new market (instant active)
POST   /market/draft        - Create draft market (awaiting approval)
POST   /market/approve      - Approve draft (DEALER SIGNATURE REQUIRED)
POST   /market/reject       - Reject draft (DEALER SIGNATURE REQUIRED) 
GET    /markets             - List active markets only
GET    /markets/drafts      - List draft markets awaiting approval
GET    /markets/pending     - List markets needing liquidity
GET    /markets/frozen      - List frozen markets (trading halted)
GET    /markets/resolved    - List resolved markets with payouts
GET    /market/:id          - Get single market + all prop bets
GET    /market/:id/lifecycle - Get market lifecycle status

// Prop Betting
POST   /market/:id/prop/create - Create official prop bet under market
POST   /prop/activate       - Activate user-submitted prop (Supabase sync)
POST   /prop/reject         - Reject user-submitted prop
```

#### **Acceptance Criteria:**
- Admins can create markets with multiple outcomes via `/market`
- Users can submit draft markets via `/market/draft`  
- Dealer can approve/reject drafts with signatures (auth implemented)
- Markets display proper lifecycle: draft → pending → active → frozen → resolved
- Prop bets can be created under parent markets
- Market data syncs with existing L2 state

---

## 🚀 **MILESTONE 2: Real Betting Flow with L1 Settlement**
*Target: 3-4 days*

### 2.1 Enhanced Betting Interface

#### **Upgrade Betting Components** *(Real L2 CPMM Integration)*
```typescript
interface BetRequest {
  market_id: string;
  outcome: number;  // outcome index (0, 1, 2...)
  amount: number;   // stake amount
  user_address: string;
  // CPMM Integration (✅ IMPLEMENTED)
  max_slippage?: number; // slippage protection
  quote_price?: number;  // from /quote endpoint
}
```

#### **L2 CPMM Trading Endpoints (✅ Already Implemented):**
```typescript
GET    /quote/:market_id/:outcome/:amount - Get price quote before buying
POST   /cpmm/buy           - Buy shares (with slippage protection)
POST   /cpmm/sell          - Sell shares back to pool  
GET    /cpmm/prices/:market_id - Current outcome prices
GET    /cpmm/pool/:market_id   - Pool state (liquidity, reserves)
```

#### **Task Breakdown:**
- [ ] Update `app/components/BettingInterface.tsx` to use `/quote` and `/cpmm/buy`
- [ ] Add CPMM price display using `/cpmm/prices/:market_id`
- [ ] Implement slippage protection in buy orders
- [ ] Add share selling capability via `/cpmm/sell`
- [ ] Create `lib/cpmm-client.ts` for L2 CPMM integration
- [ ] Add clearinghouse deposit flow: `/clearinghouse/deposit` (dealer auth required)

#### **Clearinghouse Integration (✅ Implemented - Needs Frontend):**
```typescript
// Deposit Flow (Dealer Authentication Required)
POST   /clearinghouse/deposit - Confirm L1 deposit (dealer signature required)
POST   /clearinghouse/withdraw - Request withdrawal
POST   /clearinghouse/withdraw/complete - Complete withdrawal (dealer signature required)
GET    /clearinghouse/pending - List pending withdrawals
GET    /clearinghouse/stats - Get clearinghouse statistics
GET    /clearinghouse/deposits/:address - User deposit history
GET    /clearinghouse/withdrawals/:address - User withdrawal history
GET    /balance/:address    - Get L2 balance (available + locked)
GET    /unified/balance/:address - Unified L1/L2 balance view
```

#### **L2 Clearinghouse Integration Tasks:**
- [ ] Connect betting UI to `/clearinghouse/deposit` for deposits
- [ ] Implement CPMM buying with `/cpmm/buy` endpoint
- [ ] Add real-time balance updates via `/balance/:address`
- [ ] Show position tracking with `/unified/positions/:address`
- [ ] Add withdrawal flow: `/clearinghouse/withdraw` → `/clearinghouse/withdraw/complete`
- [ ] **CRITICAL:** Add dealer signature generation for deposit/withdraw confirmations
- [ ] Connect betting UI to `SettlementContext`
- [ ] Implement `placeBetWithLock()` using settlement SDK
- [ ] Add real-time L1 balance updates after bets
- [ ] Show locked funds in wallet UI
- [ ] Add bet history with settlement status

#### **Acceptance Criteria:**
- Users can place bets on real prediction events
- L1 funds are properly soft-locked when betting
- Virtual balance updates immediately
- Bet confirmations include gas/fee estimates
- Failed bets release locks automatically

### 2.2 Bet Management System

#### **Create Bet Tracking**
```typescript
interface ActiveBet {
  bet_id: string;
  user_address: string;
  event_id: string;
  outcome: string;
  stake: number;
  potential_payout: number;
  lock_id: string;  // L1 soft-lock reference
  placed_at: number;
  status: 'active' | 'winning' | 'losing' | 'void';
}
```

#### **Task Breakdown:**
- [ ] Create `lib/bet-manager.ts` - Bet storage and retrieval
- [ ] Create `app/api/bets/route.ts` - Bet history API
- [ ] Create `app/components/BetHistory.tsx` - User bet display
- [ ] Add bet cancellation before event close
- [ ] Implement bet position aggregation

---

## 🚀 **MILESTONE 3: Event Resolution & Payout System**
*Target: 2-3 days*

### 3.1 Oracle Integration & Event Resolution

#### **Oracle Resolution System** *(✅ Implemented - Needs Frontend)*
```typescript
interface MarketResolution {
  market_id: string;
  winning_outcome: number; // outcome index
  resolved_at: number;
  resolver: string;        // dealer/oracle address
  // Dealer signature required (✅ implemented)
  dealer_public_key: string;
  dealer_signature: string;
  timestamp: number;
  nonce: string;
}
```

#### **L2 Resolution Endpoint (✅ Already Implemented):**
```typescript
POST   /resolve            - Resolve market (DEALER SIGNATURE REQUIRED)
// Automatically:
// - Calculates payouts for winning bets
// - Distributes winnings to user balances  
// - Updates market status to 'resolved'
// - Creates settlement transaction records
```

#### **Task Breakdown:**
- [ ] Create `lib/dealer-oracle.ts` - Dealer resolution interface
- [ ] Build dealer dashboard for market resolution
- [ ] Add dealer signature generation for `/resolve` calls
- [ ] Implement market resolution UI (dealer-only access)
- [ ] Add resolution history and audit trail
- [ ] **CRITICAL:** Only dealer can resolve markets (oracle controls settlement)

### 3.2 Automatic Payout Processing *(Built into L2 /resolve)*

#### **Payout System** *(✅ Already Implemented)*
```typescript
// Payouts are automatically calculated and distributed by /resolve endpoint
// No separate payout calls needed - it's atomic with resolution

interface PayoutResult {
  market_id: string;
  total_winnings_distributed: number;
  winner_count: number;
  average_payout: number;
  house_edge_collected: number;
  // Individual payouts are applied to user balances automatically
}
```
```typescript
interface PayoutCalculation {
  bet_id: string;
  original_stake: number;
  payout_amount: number;
  profit: number;
  house_edge: number;
  settlement_request: SettleBetRequest;
}
```

#### **Task Breakdown:**
- [ ] Create `lib/payout-engine.ts` - Payout calculations
- [ ] Implement different payout models (fixed odds, parimutuel)
- [ ] Add house edge configuration
- [ ] Create batch payout processing
- [ ] Add payout verification before settlement

### 3.3 L1 Settlement Integration

#### **Settlement Execution** *(Uses Dealer Oracle)*
- [ ] Integrate `/resolve` endpoint (dealer signature required)
- [ ] Add dealer authentication to resolution calls
- [ ] Handle automatic payout distribution (built into `/resolve`)
- [ ] Update user balances after resolution (automatic)
- [ ] Add settlement transaction tracking via `/user/status/:address`
- [ ] Build dealer resolution interface (oracle controls settlement)

#### **Acceptance Criteria:**
- Events resolve automatically or manually
- Winning bets calculate correct payouts
- L1 settlements execute successfully  
- User balances update with winnings
- Failed settlements can be retried
- Complete audit trail for all transactions

---

## 🚀 **MILESTONE 4: Wallet Integration & Balance Management**
*Target: 2 days*

### 4.1 Enhanced Wallet Features

#### **Real Balance Management** *(L1 ↔ L2 Integration)*
- [ ] Use `/unified/balance/:address` for seamless L1/L2 view
- [ ] Show available vs locked breakdown via `/balance/:address`
- [ ] Display credit sessions via `/credit/status/:address`
- [ ] Add deposit flow: `/clearinghouse/deposit` (dealer auth required)
- [ ] Add withdrawal flow: `/clearinghouse/withdraw` → `/clearinghouse/withdraw/complete`
- [ ] Show clearinghouse stats via `/clearinghouse/stats`

#### **Settlement History**
- [ ] Create `app/components/SettlementHistory.tsx`
- [ ] Display soft-locks, settlements, and payouts
- [ ] Add transaction status tracking
- [ ] Show pending settlements and expected completion
- [ ] Add settlement receipt downloads

### 4.2 Financial Reconciliation

#### **Balance Verification**
- [ ] Add balance reconciliation checks
- [ ] Implement settlement audit trails
- [ ] Create financial reporting for admins
- [ ] Add balance mismatch detection and resolution
- [ ] Implement withdrawal/deposit flows

---

## 🚀 **MILESTONE 5: Testing & Production Readiness**
*Target: 3-4 days*

### 5.1 Comprehensive Testing

#### **End-to-End Testing**
```typescript
// tests/e2e-betting-flow.js
describe('Complete Betting Flow', () => {
  test('User places bet → Event resolves → Payout settlement', async () => {
    // Test complete flow with real L1/L2 servers
  });
});
```

#### **Task Breakdown:**
- [ ] Create E2E tests for complete betting flows
- [ ] Test settlement protocol with real L1/L2 servers  
- [ ] Add load testing for concurrent bets
- [ ] Test error scenarios and recovery
- [ ] Validate all cryptographic operations

### 5.2 Production Configuration

#### **Deployment Preparation**
- [ ] Add proper environment configuration
- [ ] Implement production logging and monitoring
- [ ] Add rate limiting for betting endpoints
- [ ] Configure proper CORS and security headers
- [ ] Set up production database migrations

### 5.3 Admin Dashboard

#### **Management Interface**
- [ ] Create admin panel for event management
- [ ] Add settlement monitoring dashboard
- [ ] Implement financial reporting
- [ ] Add user management and KYC integration
- [ ] Create system health monitoring

---

## 📊 **Key Performance Indicators (KPIs)**

### **Technical Metrics**
- [ ] Settlement success rate > 99%
- [ ] Bet placement latency < 2 seconds
- [ ] L1 balance sync accuracy > 99.9%
- [ ] Zero failed payouts due to system errors

### **Business Metrics**
- [ ] User can complete full betting cycle in < 30 seconds
- [ ] Event creation to resolution cycle < 24 hours for test events
- [ ] Support for 100+ concurrent active bets
- [ ] Complete audit trail for all financial operations

---

## 🛠 **Development Priorities**

### **Week 1: Core Betting**
1. Event creation and management system
2. Enhanced betting interface with settlement
3. L1 soft-lock integration

### **Week 2: Resolution & Payouts**
1. Oracle and resolution system
2. Payout calculation engine
3. Settlement execution and balance updates

### **Week 3: Polish & Testing**
1. Comprehensive testing suite
2. Admin dashboard and monitoring
3. Production deployment preparation

---

## 🔗 **Critical Dependencies**

### **External Services**
- [ ] L1 BlackBook server (`L1_HTTP_URL` env var) - Settlement operations
- [ ] L2 BlackBook server (`L2_PORT` env var, default 1234) - Market management
- [ ] **Dealer Oracle** (`ORACLE_ADDRESS=L2_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D`) - Resolution authority
- [ ] Supabase for user data and market metadata

### **System Requirements**
- [ ] Settlement protocol fully operational
- [ ] Wallet system with real L1 balances  
- [ ] ✅ **Ed25519 signature verification with replay protection** (IMPLEMENTED)
- [ ] ✅ **Dealer oracle authentication** (IMPLEMENTED)
- [ ] Real-time balance synchronization
- [ ] **SDK Updates Needed:** Add dealer auth to all clearinghouse/resolution calls

---

## 🚀 **Getting Started: First Steps**

1. **Create Event Management System** (`lib/event-manager.ts`)
2. **Build Event Creation UI** (`app/components/EventCreator.tsx`)  
3. **Test Event Lifecycle** (create → display → bet → resolve)
4. **Integrate Settlement SDK** for real L1 operations
5. **Build Payout Engine** with proper settlement

**The foundation is solid - now let's build the prediction market! 🎯**