# BlackBook Frontend Integration - Technical Roadmap

**Last Updated**: January 23, 2026  
**Status**: Backend Complete ✅ → Frontend Integration In Progress ⚠️  
**Focus**: Connect Production-Ready L1/L2 Infrastructure to User-Facing UI

---

## 🎯 Reality Check: Infrastructure is DONE

**Critical Insight**: Both L1 and L2 are **production-ready** with comprehensive APIs, SDKs, and security. The blocker is **frontend integration** - wiring up the existing backend to the Next.js UI.

### 📊 What's Already Built (Backend)

#### ✅ L1 Blockchain (Port 8080) - **PRODUCTION READY**
- [x] Ed25519 keypair generation and signing
- [x] Wallet creation with BIP-39 mnemonic
- [x] Vault encryption (PBKDF2 + AES-256-GCM)
- [x] SHA-256 address derivation (L1_XXX format)
- [x] Token transfers with signature verification
- [x] Transaction history and balance queries
- [x] **L2 Bridge Operations** (lock/unlock/settle)
- [x] Replay attack protection (nonce + timestamp)
- [x] Double-spend prevention
- [x] Comprehensive test suite (93+ transactions)
- [x] Test accounts with real balances (Alice: 12k BB, Bob: 17k BB)

**API Endpoints**:
```
GET  /balance/{address}        - Get wallet balance
GET  /transactions/{address}   - Transaction history
POST /transfer/simple          - Send tokens
POST /l2/lock                  - Lock tokens for L2 session
POST /l2/unlock                - Release tokens from L2
POST /l2/settle                - Settle L2 session
GET  /l2/session/{address}     - Get active L2 session
GET  /ledger                   - Visual transaction log
```

**Total Supply**: 130,985 BB  
**Active Wallets**: 8  
**Security**: Fuzz tested, DOS resistant, input validated

---

#### ✅ L2 Markets Server (Port 1234) - **PRODUCTION READY**
- [x] CPMM (Constant Product Market Maker) implementation
- [x] Market creation with configurable outcomes
- [x] Bet placement with slippage protection
- [x] Liquidity provision (add/remove)
- [x] Position tracking per user
- [x] Market resolution and settlement
- [x] Real-time price calculations
- [x] Ed25519 signature verification
- [x] Alphabetically-sorted JSON message signing
- [x] Nonce-based replay protection
- [x] Dealer/Oracle operations for deposits/withdrawals
- [x] L1 balance verification via gRPC

**API Endpoints**:
```
# Public (No Auth)
GET  /health                   - Server status
GET  /markets                  - List markets (active/closed/resolved)
GET  /market/{id}              - Market details
GET  /balance/{address}        - L1 + L2 balance
GET  /user/{address}/bets      - User's bet history

# User (Signature Required)
POST /buy                      - Buy shares in market
POST /sell                     - Sell position
POST /withdraw                 - Request L2 → L1 withdrawal
POST /redeem                   - Redeem winning bet
POST /market                   - Create new market

# Dealer/Oracle Only
POST /deposit                  - Confirm L1 → L2 deposit
POST /withdraw/complete        - Complete withdrawal
POST /resolve                  - Resolve market with winner
```

**Security**: Signature verification on all writes, nonce validation, timestamp verification (±5 minutes)

---

#### ✅ Available SDKs
1. **`blackbook-frontend-sdk.js`** - Complete L1 wallet operations
2. **`blackbook-wallet-sdk.js`** - Wallet creation and vault management
3. **`wallet-recovery-sdk.js`** - Shamir's Secret Sharing (3-of-2 recovery)
4. **`unified-balance-sdk.js`** - Cross-layer balance aggregation
5. **`credit-prediction-actions-sdk.js`** - Full L2 betting operations ⭐
6. **`markets-sdk.js`** - Lightweight L2 market data
7. **`unified-dealer-sdk.js`** - Dealer/Oracle operations
8. **`l2-credit-sdk.js`** - L2 session management

---

## ❌ What's NOT Built (Frontend Gap)

### Frontend Issues
1. **User Wallet L2 Signing** - Code path exists but disabled, defaults to Alice/Bob test accounts
2. **L1 Balance Display** - Not querying L1 API for real balances
3. **L2 Balance Display** - Shows L2 balance but not L1 or unified view
4. **Bridge UI** - BridgeInterface.tsx exists but incomplete
5. **Signature Format** - Frontend not using alphabetically-sorted JSON for L2
6. **Transaction History** - No UI for L1 transactions
7. **Unified Balance** - Not showing L1 Available + L2 Locked
8. **Password Re-prompt** - Not prompting for password on each transaction
9. **Error Handling** - Generic error messages, not user-friendly

### Integration Blockers
- [ ] Frontend uses wrong signature format for L2 (not alphabetical)
- [ ] User wallet private key derivation not wired up for L2 signing
- [ ] No bridge deposit flow (L1 → L2)
- [ ] No bridge withdrawal flow (L2 → L1)
- [ ] Balance polling not implemented
- [ ] Market status not using L2 API correctly

---

## 🔴 PHASE 1: Fix User Wallet L2 Signing (CRITICAL - 2-3 days)

**Problem**: Frontend defaults to Alice/Bob test wallets. User's real wallet is created but not used for L2 operations.

### Current Broken Flow
```typescript
// app/contexts/Layer2Context.tsx (line ~395)
if (activeWallet === 'alice') {
  privateKey = Buffer.from(TEST_ACCOUNTS.alice.privateKey, 'hex')
  publicKey = Buffer.from(TEST_ACCOUNTS.alice.publicKey, 'hex')
} else if (activeWallet === 'bob') {
  // same for bob  
} else if (activeWallet === 'user') {
  address = user?.blackbook_address?.replace('L1_', 'L2_')
  // ❌ STOPS HERE - no keys derived
}
```

### Target Flow
```typescript
else if (activeWallet === 'user' && vaultSession) {
  address = user?.blackbook_address?.replace('L1_', 'L2_')
  
  // Get password from memory
  const password = getPassword()
  if (!password) {
    throw new Error('Password required for signing')
  }
  
  // Derive keys on-demand (NEVER store them)
  const { secretKey, publicKey: derivedPublicKey } = 
    await derivePrivateKeyOnDemand(vaultSession, password)
  
  privateKey = Buffer.from(secretKey.slice(0, 32))
  publicKey = Buffer.from(derivedPublicKey)
  
  // Clear from memory after use
  secretKey.fill(0)
}
```

### Implementation Steps

#### 1.1 Update Layer2Context Initialization
**File**: `app/contexts/Layer2Context.tsx` (lines 380-420)

**Action Items**:
- [ ] Import `derivePrivateKeyOnDemand` from `@/lib/blackbook-wallet`
- [ ] Check if `vaultSession` exists
- [ ] Check if password is available (`getPassword()`)
- [ ] If no password, show `<PasswordPrompt />` modal
- [ ] Derive private key on-demand using password
- [ ] Initialize L2 SDK with derived keys
- [ ] Clear sensitive data after signing
- [ ] Test with real user wallet (not Alice/Bob)

**Success Criteria**:
- User signs up and creates wallet
- User logs in (password stored in memory)
- User navigates to market page
- activeWallet automatically switches to 'user' (not 'alice')
- L2 SDK initializes with user's keys
- User places bet → signs with own key → L2 accepts signature

---

#### 1.2 Fix L2 Signature Format
**File**: `app/contexts/Layer2Context.tsx` or wherever signing happens

**Current Issue**: Frontend may not be using alphabetically-sorted JSON for L2 signatures.

**L2 Signature Format** (from `frontend-nextsteps-l2.md`):
```javascript
// CRITICAL: Keys must be alphabetically sorted
const message = JSON.stringify({
  "action": "BUY",           // ← alphabetical order
  "nonce": nonce,            // ← alphabetical order  
  "payload": {               // ← alphabetical order
    "amount": 100,           // payload keys also sorted
    "market_id": "MKT_xxx",
    "outcome": 0,
    "user": "L2_xxx"
  },
  "timestamp": 1737654321
});

const signature = await sign(message, privateKey);
```

**Action Items**:
- [ ] Review current message construction in `placeBet()`, `addLiquidity()`, etc.
- [ ] Ensure JSON.stringify uses alphabetical key order
- [ ] Add helper function to sort keys recursively
- [ ] Test signature verification with L2 API
- [ ] Add debug logging for message format

**Helper Function**:
```typescript
function sortKeysAlphabetically(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeysAlphabetically);
  
  return Object.keys(obj)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = sortKeysAlphabetically(obj[key]);
      return sorted;
    }, {} as any);
}

// Usage
const message = JSON.stringify(sortKeysAlphabetically({
  action: 'BUY',
  timestamp: timestamp,
  nonce: nonce,
  payload: { user, market_id, outcome, amount }
}));
```

---

#### 1.3 Add Password Re-prompt on Transaction
**File**: `app/contexts/AuthContext.tsx` + `app/components/PasswordPrompt.tsx`

**Current Issue**: Password expires after 15 minutes, but no re-prompt during transaction.

**Implementation**:
- [ ] Before each L2 write operation, check `isPasswordUnlocked()`
- [ ] If expired, show `<PasswordPrompt />` modal
- [ ] On success, immediately proceed with signing
- [ ] On cancel, abort transaction
- [ ] Show clear error if wrong password

**Example**:
```typescript
async function placeBet(marketId: string, outcome: number, amount: number) {
  // Check if password is available
  if (!isPasswordUnlocked()) {
    const success = await showPasswordPrompt()
    if (!success) throw new Error('Authentication required')
  }
  
  // Derive keys and sign
  const { secretKey, publicKey } = await derivePrivateKeyOnDemand(vaultSession, getPassword())
  // ... sign transaction
  secretKey.fill(0) // Clear immediately
}
```

---

#### 1.4 Switch Default Wallet to 'user'
**File**: `app/contexts/AuthContext.tsx`

**Change**:
```typescript
// OLD
const [activeWallet, setActiveWallet] = useState<ActiveWallet>('alice')

// NEW - Only if user has wallet
const [activeWallet, setActiveWallet] = useState<ActiveWallet>('user')

// But use this logic:
useEffect(() => {
  if (user?.blackbook_address && vaultSession) {
    setActiveWallet('user')
  } else {
    setActiveWallet('alice') // Fallback to test account
  }
}, [user, vaultSession])
```

---

### Testing Checklist for Phase 1

**User Signup & Wallet Creation**:
- [ ] New user signs up with email/password
- [ ] User creates wallet with 12-word mnemonic
- [ ] Mnemonic is shown once and user confirms backup
- [ ] Wallet encrypted and saved to Supabase
- [ ] L1 address shows in wallet page (L1_XXX...)
- [ ] L2 address is derived (same base, L2_XXX...)

**L2 Connection**:
- [ ] User logs in (password stored in memory for 15 min)
- [ ] Navigate to any market page
- [ ] Console shows: "Initializing L2 SDK for 👤 User" (not Alice/Bob)
- [ ] No errors about missing keys or invalid signature

**Place Bet Flow**:
- [ ] Click "Bet Yes" on any market
- [ ] If password expired, modal appears: "Re-enter password"
- [ ] Enter password correctly
- [ ] Transaction signs with user's key
- [ ] Console shows: "🔐 Authenticating: { address: L2_XXX, public_key: YYY }"
- [ ] L2 API returns success (not 401 Unauthorized)
- [ ] Bet appears in user's position
- [ ] Private key never logged to console
- [ ] Private key cleared from memory after signing

**Add Liquidity Flow**:
- [ ] Click "Add Liquidity" tab
- [ ] Enter amount (100 BB)
- [ ] Password prompt if expired
- [ ] Transaction signed with user's key
- [ ] Market moves from Pending → Active
- [ ] L2 balance decreases by 100 BB

**Security Checks**:
- [ ] Open browser DevTools
- [ ] Search console for "privateKey", "secretKey", "seed"
- [ ] Should find ZERO matches (keys never logged)
- [ ] Logout and login again
- [ ] Password re-prompted after 15 minutes

---

## 🟡 PHASE 2: Unified Balance Display (HIGH - 1-2 days)

**Problem**: Frontend only shows L2 balance, not L1 balance or locked amounts.

### Current State
```typescript
// Only shows L2 available balance
const balance = await fetch(`${L2_URL}/balance/${address}`)
// Returns: { l2_available: 1000 }
```

### Target State
```typescript
// Show complete balance breakdown
const balance = await fetch(`${L2_URL}/balance/${address}`)
// Returns: {
//   l2_available: 800,   // Can bet with
//   l2_locked: 200,      // In active bets
//   l1_available: 5000,  // Can withdraw to
//   l1_connected: true   // L1 gRPC connection working
// }
```

### Implementation Steps

#### 2.1 Add Unified Balance Component
**File**: `app/components/UnifiedBalance.tsx` (new)

```tsx
'use client'

import { useEffect, useState } from 'react'

interface BalanceData {
  l2Available: number
  l2Locked: number
  l1Available: number
  l1Connected: boolean
}

export default function UnifiedBalance({ address }: { address: string }) {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!address) return
    
    const fetchBalance = async () => {
      const res = await fetch(`http://localhost:1234/balance/${address}`)
      const data = await res.json()
      setBalance({
        l2Available: data.l2_available || 0,
        l2Locked: data.l2_locked || 0,
        l1Available: data.l1_available || 0,
        l1Connected: data.l1_connected || false
      })
      setLoading(false)
    }
    
    fetchBalance()
    const interval = setInterval(fetchBalance, 5000) // Poll every 5s
    return () => clearInterval(interval)
  }, [address])
  
  if (loading) return <div>Loading balance...</div>
  if (!balance) return <div>Balance unavailable</div>
  
  const totalBalance = balance.l2Available + balance.l2Locked + balance.l1Available
  
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Your Balance</h3>
      
      {/* Total */}
      <div className="mb-4 pb-4 border-b border-gray-700">
        <div className="text-3xl font-bold text-prism-cyan">
          {totalBalance.toFixed(2)} BB
        </div>
        <div className="text-sm text-gray-400">Total Balance</div>
      </div>
      
      {/* Breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-400">L2 Available</span>
          <span className="font-semibold">{balance.l2Available.toFixed(2)} BB</span>
        </div>
        
        {balance.l2Locked > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">🔒 L2 Locked (in bets)</span>
            <span className="font-semibold text-yellow-400">{balance.l2Locked.toFixed(2)} BB</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-400">L1 Available</span>
          <span className="font-semibold text-green-400">{balance.l1Available.toFixed(2)} BB</span>
        </div>
        
        {!balance.l1Connected && (
          <div className="text-xs text-red-400 mt-2">
            ⚠️ L1 connection lost - L1 balance may be outdated
          </div>
        )}
      </div>
    </div>
  )
}
```

#### 2.2 Update Wallet Page
**File**: `app/wallet/page.tsx`

**Changes**:
- [ ] Import `<UnifiedBalance />` component
- [ ] Replace current balance display with unified component
- [ ] Show L1 and L2 addresses side-by-side
- [ ] Add "Bridge" tab to move funds between layers

---

#### 2.3 Add Balance Polling Hook
**File**: `hooks/useL2Balance.ts` (new)

```typescript
import { useState, useEffect } from 'react'

interface BalanceData {
  l2Available: number
  l2Locked: number
  l1Available: number
  l1Connected: boolean
}

export function useL2Balance(address: string | null) {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }
    
    const fetchBalance = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_L2_URL}/balance/${address}`)
        if (!res.ok) throw new Error('Failed to fetch balance')
        
        const data = await res.json()
        setBalance({
          l2Available: data.l2_available || 0,
          l2Locked: data.l2_locked || 0,
          l1Available: data.l1_available || 0,
          l1Connected: data.l1_connected || false
        })
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchBalance()
    const interval = setInterval(fetchBalance, 5000)
    return () => clearInterval(interval)
  }, [address])
  
  return { balance, loading, error }
}
```

**Usage**:
```typescript
const { balance, loading, error } = useL2Balance(wallet.l2Address)
```

---

## 🟢 PHASE 3: L1 ↔ L2 Bridge UI (MEDIUM - 3-4 days)

**Problem**: No way to move BB tokens between L1 and L2 layers in the UI.

### Bridge Architecture (Already Built in L1)

```
┌─────────────────────────────────────────────────────────┐
│                    L1 Blockchain                        │
│  ┌──────────────┐         ┌──────────────┐             │
│  │  User Wallet │────────►│  L2_ESCROW   │             │
│  │  L1_XXX...   │  LOCK   │    POOL      │             │
│  └──────────────┘         └──────────────┘             │
│                                   │                     │
│                                   │ Bridge              │
└───────────────────────────────────┼─────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────┐
│                    L2 Markets                           │
│                                   ▼                     │
│  ┌──────────────┐         ┌──────────────┐             │
│  │  User L2     │◄────────│  L2 Credit   │             │
│  │  L2_XXX...   │ UNLOCK  │   Balance    │             │
│  └──────────────┘         └──────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### L1 API Endpoints (Already Working)


```
POST /l2/lock       - Lock tokens for L2 session (deposit)
POST /l2/unlock     - Release tokens from L2 (withdraw)
POST /l2/settle     - Settle L2 session with final balance
GET  /l2/session/{address} - Get active L2 session info
```

### L2 API Endpoints (Already Working)

```
POST /deposit       - Dealer confirms L1 → L2 deposit (credits L2 balance)
POST /withdraw      - User requests L2 → L1 withdrawal
POST /withdraw/complete - Dealer completes withdrawal (sends L1 tx)
GET  /withdrawals/pending - List pending withdrawals
```

### Implementation Steps

#### 3.1 Build Deposit Flow (L1 → L2)
**File**: `app/components/BridgeDeposit.tsx` (new)

**Flow**:
1. User enters amount to deposit (e.g., 1000 BB)
2. Frontend calls L1 API: `POST /l2/lock`
3. L1 moves tokens to `L2_ESCROW_POOL`
4. L1 returns session_id and tx_hash
5. Frontend calls L2 API: `POST /deposit` (dealer operation)
6. L2 credits user's L2 balance
7. User can now bet on markets

**Action Items**:
- [ ] Create `<BridgeDeposit />` component
- [ ] Add form: amount input + "Deposit" button
- [ ] Show L1 balance (check if sufficient)
- [ ] Sign and submit L1 `/l2/lock` transaction
- [ ] Poll L1 transaction status
- [ ] Call L2 `/deposit` to credit balance
- [ ] Show success message with L2 balance

**Code Skeleton**:
```tsx
export default function BridgeDeposit({ wallet }: { wallet: Wallet }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleDeposit = async () => {
    setLoading(true)
    
    // 1. Lock on L1
    const lockRequest = await signL1Transaction({
      to: 'L2_ESCROW_POOL',
      amount: parseFloat(amount)
    })
    
    const lockRes = await fetch('http://localhost:8080/l2/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lockRequest)
    })
    
    const { session_id, tx_hash } = await lockRes.json()
    
    // 2. Credit on L2 (dealer operation - needs dealer signature)
    // In production, this would be done by a dealer service watching L1 events
    // For now, we can call it directly if we have dealer access
    
    setLoading(false)
  }
  
  return (
    <div>
      <h3>Deposit to L2</h3>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (BB)"
      />
      <button onClick={handleDeposit} disabled={loading}>
        {loading ? 'Processing...' : 'Deposit'}
      </button>
    </div>
  )
}
```

---

#### 3.2 Build Withdrawal Flow (L2 → L1)
**File**: `app/components/BridgeWithdraw.tsx` (new)

**Flow**:
1. User enters amount to withdraw (e.g., 500 BB)
2. Frontend calls L2 API: `POST /withdraw` (signed by user)
3. L2 debits user's L2 balance, creates withdrawal request
4. Dealer service watches pending withdrawals
5. Dealer calls L2: `POST /withdraw/complete` with L1 tx_hash
6. L1 transaction sends tokens from escrow back to user
7. User receives BB on L1

**Action Items**:
- [ ] Create `<BridgeWithdraw />` component
- [ ] Add form: amount input + "Withdraw" button
- [ ] Show L2 balance (check if sufficient)
- [ ] Sign and submit L2 `/withdraw` transaction
- [ ] Show pending status
- [ ] Poll for completion (dealer processes it)
- [ ] Show success with L1 tx_hash

**Code Skeleton**:
```tsx
export default function BridgeWithdraw({ wallet }: { wallet: Wallet }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null)
  
  const handleWithdraw = async () => {
    setLoading(true)
    
    // 1. Request withdrawal on L2
    const timestamp = Math.floor(Date.now() / 1000)
    const nonce = `withdraw_${Date.now()}`
    
    const message = JSON.stringify({
      action: 'WITHDRAW_REQUEST',
      nonce: nonce,
      payload: {
        amount: parseFloat(amount),
        from_address: wallet.l2Address
      },
      timestamp: timestamp
    })
    
    const signature = await signMessage(message, wallet.privateKey)
    
    const res = await fetch('http://localhost:1234/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_address: wallet.l2Address,
        amount: parseFloat(amount),
        public_key: wallet.publicKey,
        signature: signature,
        timestamp: timestamp,
        nonce: nonce
      })
    })
    
    const data = await res.json()
    setWithdrawalId(data.withdrawal_id)
    
    // 2. Poll for completion (dealer processes in background)
    // In production, show "Pending" status and check every 10 seconds
    
    setLoading(false)
  }
  
  return (
    <div>
      <h3>Withdraw to L1</h3>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (BB)"
      />
      <button onClick={handleWithdraw} disabled={loading}>
        {loading ? 'Processing...' : 'Withdraw'}
      </button>
      
      {withdrawalId && (
        <div className="text-yellow-400 mt-2">
          ⏳ Withdrawal pending (ID: {withdrawalId})
          <br />
          Dealer will process in 1-3 minutes
        </div>
      )}
    </div>
  )
}
```

---

#### 3.3 Update BridgeInterface Component
**File**: `app/components/BridgeInterface.tsx`

**Changes**:
- [ ] Add tabs: "Deposit (L1 → L2)" and "Withdraw (L2 → L1)"
- [ ] Import `<BridgeDeposit />` and `<BridgeWithdraw />`
- [ ] Show current L1 and L2 balances
- [ ] Add bridge transaction history
- [ ] Show pending withdrawals with status

---

#### 3.4 Add Bridge Tab to Wallet Page
**File**: `app/wallet/page.tsx`

**Changes**:
- [ ] Add "Bridge" tab next to "Transactions"
- [ ] Render `<BridgeInterface />` component
- [ ] Show unified balance (L1 + L2 + Locked)

---

### Testing Checklist for Phase 3

**L1 → L2 Deposit**:
- [ ] User has 1000 BB on L1 (check balance)
- [ ] Click "Bridge" tab → "Deposit"
- [ ] Enter 500 BB
- [ ] Click "Deposit"
- [ ] Password prompt (if expired)
- [ ] L1 transaction signed and submitted
- [ ] Wait 10-30 seconds for confirmation
- [ ] L2 balance increases by 500 BB
- [ ] L1 balance decreases by 500 BB
- [ ] Transaction appears in bridge history

**L2 → L1 Withdrawal**:
- [ ] User has 300 BB on L2
- [ ] Click "Withdraw" tab
- [ ] Enter 200 BB
- [ ] Click "Withdraw"
- [ ] L2 balance immediately decreases by 200 BB
- [ ] Withdrawal shows "Pending" status
- [ ] Wait 1-3 minutes (dealer processes)
- [ ] L1 balance increases by 200 BB
- [ ] Withdrawal status changes to "Complete"
- [ ] L1 tx_hash shown (link to explorer)

---

## 🔵 PHASE 4: Transaction History & Explorer (MEDIUM - 2-3 days)

**Problem**: No way to view L1 transactions, bridge history, or L2 bet history in one place.

### Implementation Steps

#### 4.1 L1 Transaction History
**File**: `app/components/L1TransactionHistory.tsx` (new)

**API**:
```typescript
GET /transactions/{address}
// Returns: [
//   {
//     type: 'TRANSFER',
//     from: 'L1_XXX',
//     to: 'L1_YYY',
//     amount: 100,
//     timestamp: 1737654321,
//     nonce: 'xxx',
//     signature: 'yyy'
//   }
// ]
```

**Features**:
- [ ] Fetch transactions from L1 API
- [ ] Show: Type, From, To, Amount, Date
- [ ] Filter: All / Sent / Received / Bridge
- [ ] Search by address or tx hash
- [ ] Export to CSV

---

#### 4.2 L2 Bet History
**File**: `app/components/L2BetHistory.tsx` (new)

**API**:
```typescript
GET /user/{address}/bets
// Returns: [
//   {
//     bet_id: 'BET_XXX',
//     market_id: 'MKT_YYY',
//     market_title: 'Will Bitcoin reach $100k?',
//     outcome: 0,
//     amount: 100,
//     shares: 95.5,
//     timestamp: 1737654321,
//     status: 'active' | 'won' | 'lost'
//   }
// ]
```

**Features**:
- [ ] Fetch bets from L2 API
- [ ] Show: Market, Outcome, Amount, Shares, Date, Status
- [ ] Filter: Active / Won / Lost
- [ ] Calculate total P&L
- [ ] Link to market page

---

#### 4.3 Unified Transaction Timeline
**File**: `app/history/page.tsx` (new)

**Combines**:
- L1 transfers
- L1 bridge operations (lock/unlock)
- L2 deposits/withdrawals
- L2 bets
- L2 redemptions

**Features**:
- [ ] Merged timeline (sorted by timestamp)
- [ ] Color-coded by type
- [ ] Icons for each operation
- [ ] Expandable details
- [ ] Filter by type
- [ ] Date range picker

---

## 🟢 PHASE 5: Production Readiness (HIGH - 3-4 days)

### 5.1 Error Handling & User Feedback

**Current Issues**:
- Generic error messages
- No retry logic
- No loading states

**Improvements**:
- [ ] Add specific error messages for each failure type
- [ ] Show toast notifications (react-hot-toast)
- [ ] Add retry button on failed transactions
- [ ] Show loading spinners during async operations
- [ ] Disable buttons during loading

**Error Types to Handle**:
```typescript
- Insufficient balance
- Invalid signature
- Password expired
- Network timeout
- L1/L2 API down
- Transaction rejected
- Nonce reused
- Market not found
- Market already resolved
```

---

### 5.2 Security Hardening

**Action Items**:
- [ ] Never log private keys (search codebase for "privateKey", "secretKey")
- [ ] Clear sensitive data from memory after use
- [ ] Add CSRF protection to API routes
- [ ] Rate limit API endpoints (10 req/min per user)
- [ ] Validate all user inputs (XSS, SQL injection)
- [ ] Add Content Security Policy headers
- [ ] Enable HTTPS in production
- [ ] Add Sentry error tracking

---

### 5.3 Performance Optimization

**Action Items**:
- [ ] Add React Query for API caching
- [ ] Implement balance polling (5-second intervals)
- [ ] Add Redis cache for market data
- [ ] Lazy load market cards (pagination)
- [ ] Optimize images (WebP format)
- [ ] Enable Next.js static generation for public pages
- [ ] Add service worker for offline support

---

### 5.4 Testing Suite

**Integration Tests**:
- [ ] User signup → wallet creation → L2 connection
- [ ] L1 → L2 deposit flow
- [ ] Place bet on market
- [ ] L2 → L1 withdrawal flow
- [ ] Market resolution → redeem winnings

**E2E Tests** (Playwright):
- [ ] Full user journey from signup to payout
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile (iOS, Android)
- [ ] Test password expiry and re-prompt
- [ ] Test concurrent users

**Load Tests** (k6):
- [ ] 100 concurrent users browsing markets
- [ ] 50 concurrent users placing bets
- [ ] 10 concurrent users adding liquidity
- [ ] Monitor: Response time, error rate, throughput

---

## 📋 Production Deployment Checklist

### Environment Setup
- [ ] Deploy L1 node (if not already running)
- [ ] Deploy L2 Rust server (port 1234 → production URL)
- [ ] Deploy Next.js frontend (Vercel or Railway)
- [ ] Set up PostgreSQL (Supabase or managed)
- [ ] Configure Redis cache
- [ ] Set up monitoring (Sentry, Prometheus)
- [ ] Configure daily backups

### Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_L1_API_URL=https://l1.blackbook.com
NEXT_PUBLIC_L2_API_URL=https://l2.blackbook.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Backend (.env - server only)
SUPABASE_SERVICE_ROLE_KEY=xxx
DEALER_PRIVATE_KEY=xxx  # For bridge operations
DEALER_PUBLIC_KEY=xxx
```

### DNS & SSL
- [ ] Point domain to production server
- [ ] Enable SSL certificate (Let's Encrypt)
- [ ] Configure Cloudflare (DDoS protection)
- [ ] Set up CDN for static assets

### Monitoring & Alerts
- [ ] Uptime monitoring (BetterStack)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Alert: L1 API down
- [ ] Alert: L2 API down
- [ ] Alert: Withdrawal queue backed up
- [ ] Alert: Bridge wallet low balance (<1000 BB)

---

## 🎯 Success Metrics

### Technical (After Full Integration)
- ✅ User wallet signing: 100% success rate
- ✅ L1 → L2 deposits: <1% failure rate
- ✅ L2 → L1 withdrawals: <1% failure rate
- ✅ Bet placement: <2 seconds average
- ✅ L2 API uptime: >99.9%
- ✅ Private keys: 0 leaks (audit with console search)

### User Experience
- ✅ Onboarding (signup → wallet): <2 minutes
- ✅ Bridge deposit (L1 → L2): <1 minute
- ✅ Bet placement: <5 seconds
- ✅ Withdrawal (L2 → L1): <3 minutes
- ✅ Error recovery: Clear instructions, retry button

---

## 📅 Implementation Timeline

### Week 1: Core Integration
- **Day 1-2**: Enable user wallet L2 signing
- **Day 3**: Fix L2 signature format (alphabetical JSON)
- **Day 4**: Add password re-prompt
- **Day 5**: Test user wallet with real transactions

### Week 2: Balance & Bridge
- **Day 6-7**: Build unified balance display
- **Day 8-9**: Build L1 → L2 deposit flow
- **Day 10-11**: Build L2 → L1 withdrawal flow
- **Day 12**: Test full bridge cycle

### Week 3: History & Polish
- **Day 13-14**: Build transaction history UI
- **Day 15**: Unified transaction timeline
- **Day 16**: Error handling improvements
- **Day 17**: Add loading states and feedback
- **Day 18**: Security audit

### Week 4: Testing & Launch
- **Day 19-20**: Integration testing
- **Day 21**: E2E testing (Playwright)
- **Day 22**: Load testing (k6)
- **Day 23**: Fix critical bugs
- **Day 24-25**: Beta testing with 10 users

### Week 5: Production
- **Day 26**: Deploy to production
- **Day 27**: Monitor for issues
- **Day 28**: Soft launch (invite-only)
- **Day 29**: Public launch
- **Day 30**: Post-launch monitoring

---

## 🚀 After Integration: Product Features

**Once L1/L2 integration is solid, THEN build**:
1. Fiat on-ramp (Stripe deposits)
2. KYC integration (Persona)
3. Email notifications
4. Customer support
5. Terms of Service
6. Mobile optimization
7. Admin dashboard
8. Referral program
9. Social features
10. Marketing & growth

**Priority**: Infrastructure → Product → Growth

---

## ⚠️ Common Pitfalls & Solutions

### Pitfall 1: Wrong Signature Format
**Symptom**: L2 returns "Invalid signature"  
**Cause**: JSON keys not alphabetically sorted  
**Fix**: Use `sortKeysAlphabetically()` helper before signing

### Pitfall 2: Password Expired Mid-Transaction
**Symptom**: Transaction fails with "No password" error  
**Fix**: Check `isPasswordUnlocked()` before each operation

### Pitfall 3: Private Key Leaked in Console
**Symptom**: DevTools shows private keys in logs  
**Fix**: Search codebase for console.log statements, remove key logging

### Pitfall 4: L1 Balance Not Updating
**Symptom**: After deposit, L1 balance still shows old value  
**Fix**: Add polling every 5 seconds, or refetch after transaction

### Pitfall 5: Bridge Withdrawal Stuck
**Symptom**: Withdrawal shows "Pending" forever  
**Fix**: Check dealer service is running and processing withdrawals

---

## 📝 Documentation Needed

- [ ] User Guide: How to create wallet
- [ ] User Guide: How to bridge tokens
- [ ] User Guide: How to place bets
- [ ] Developer Guide: Local setup
- [ ] Developer Guide: API reference
- [ ] Admin Guide: Dealer operations
- [ ] Security Guide: Key management
- [ ] Troubleshooting Guide: Common errors

---

## 🎯 Definition of Done

**L1/L2 Integration Complete When**:
✅ User can create wallet without dev tools  
✅ User can sign L2 transactions with own keys  
✅ User can deposit BB from L1 to L2  
✅ User can trade on L2 markets  
✅ User can withdraw BB from L2 back to L1  
✅ All transactions recorded on-chain  
✅ Unified balance shows L1 + L2 correctly  
✅ Zero private key leaks (verified via audit)  
✅ 99.9% uptime for 7 days  
✅ Load tested with 100+ concurrent users  

**Then and only then**: Ship product features

---

**Next Action**: Start Phase 1 - Enable user wallet signing in Layer2Context

**Reference Documents**:
- `frontend-nextsteps-l1.md` - L1 API reference
- `frontend-nextsteps-l2.md` - L2 API reference + signature format
