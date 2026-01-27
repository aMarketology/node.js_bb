# Prism Prediction Market - Integration Guide

**Created**: January 23, 2026  
**Purpose**: Step-by-step guide to connect production-ready L1/L2 infrastructure to the Next.js frontend  
**End Goal**: Users can create wallets, sign L2 transactions with their own keys, and trade on prediction markets

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Architecture Overview](#architecture-overview)
3. [✅ Phase 1: User Wallet L2 Signing](#phase-1-user-wallet-l2-signing) - **COMPLETED**
4. [✅ Phase 2: Alphabetical JSON Signing](#phase-2-alphabetical-json-signing) - **COMPLETED**
5. [✅ Phase 3: Activity-Based Session Management](#phase-3-activity-based-session-management) - **COMPLETED**
6. [✅ Phase 4: Market Standards & Validation](#phase-4-market-standards--validation) - **COMPLETED**
7. [✅ Phase 5: Live Markets Integration](#phase-5-live-markets-integration) - **COMPLETED**
8. [🔴 Phase 5.5: PRISM Legal Compliance](#phase-55-prism-legal-compliance) - **CRITICAL - IN PROGRESS**
9. [Phase 6: Unified Balance Display](#phase-6-unified-balance-display)
10. [Phase 7: Bridge UI Completion](#phase-7-bridge-ui-completion)
11. [Phase 8: Production Hardening](#phase-8-production-hardening)
12. [Testing Checklist](#testing-checklist)
13. [Troubleshooting Guide](#troubleshooting-guide)

---

## Current State Assessment

### ✅ What's Working (Backend - Production Ready)

| Component | URL | Status | Notes |
|-----------|-----|--------|-------|
| L1 Blockchain | `localhost:8080` | ✅ Ready | Ed25519 signing, unlimited 1:1 BB token to USD supply |
| L2 Markets Server | `localhost:1234` | ✅ Ready | CPMM, signature verification, nonce protection |
| L1 ↔ L2 gRPC | `settlement.proto` | ✅ Ready | Balance queries, soft locks, settlements via gRPC |
| Frontend → L2 REST | HTTP/JSON | ✅ Ready | User betting, market queries (Ed25519 signed) 
| L1 Proxy | `/api/l1-proxy` | ✅ Ready | CORS bypass for L1 requests |
| Supabase | Cloud | ✅ Ready | User auth, vault storage, profiles |

### ✅ What's Working (Frontend - Partial)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Wallet Creation | `lib/blackbook-wallet.ts` | ✅ Ready | BIP39, AES-256-GCM vault |
| Key Derivation | `lib/blackbook-wallet.ts:727` | ✅ Ready | `derivePrivateKeyOnDemand()` complete |
| Password Management | `contexts/AuthContext.tsx:59` | ✅ Ready | 15-min expiry, in-memory storage |
| Vault Session | `contexts/AuthContext.tsx:173` | ✅ Ready | Loads from Supabase |
| PasswordPrompt UI | `components/PasswordPrompt.tsx` | ✅ Ready | Modal component exists |
| Test Accounts | `contexts/AuthContext.tsx` | ✅ Ready | Alice/Bob permanent test wallets |

### ✅ What's Been Fixed (Phases 1-4 Complete)

| Issue | Location | Solution | Status |
|-------|----------|----------|--------|
| User wallet signing | `contexts/CreditPredictionContext.tsx` | On-demand key derivation from vault | ✅ Fixed |
| JSON signature format | All SDKs | `sortKeysAlphabetically()` added | ✅ Fixed |
| Password prompt | `contexts/AuthContext.tsx` | Activity-based session (10min/1hr/$1000) | ✅ Fixed |
| Market standards | `/markets-tests/` | Validation rules & 85 tests passing | ✅ Fixed |

### ⚠️ What's Still In Progress

| Issue | Location | Problem |
|-------|----------|---------|
| Live markets | `app/markets/page.tsx` | Need real L2 market data integration |
| Market validation | Frontend forms | Need to enforce market standards |
| Default wallet | `contexts/AuthContext.tsx:64` | Defaults to `'alice'` instead of `'user'` |
| Bridge withdrawal | `components/BridgeInterface.tsx` | No L2→L1 withdrawal UI |

### Test Accounts (Permanent - Do Not Remove)

```typescript
// These are real accounts with exposed private keys for testing
// They will remain in production forever

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ALICE - Regular User / Bettor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

L1 Address:       L1_52882D768C0F3E7932AAD1813CF8B19058D507A8
L2 Address:       L2_52882D768C0F3E7932AAD1813CF8B19058D507A8

Public Key:       c0e349153cbc75e9529b5f1963205cab783463c6835c826a7587e0e0903c6705
Private Key:      18f2c2e3bcb7a4b5329cfed4bd79bf17df4d47aa1888a6b3d1a1450fb53a8a24


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 BOB - Regular User / Bettor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

L1 Address:       L1_5DB4B525FB40D6EA6BFD24094C2BC24984BAC433
L2 Address:       L2_5DB4B525FB40D6EA6BFD24094C2BC24984BAC433

Public Key:       582420216093fcff65b0eec2ca2c8227dfc2b6b7428110f36c3fc1349c4b2f5a
Private Key:      e4ac49e5a04ef7dfc6e1a838fdf14597f2d514d0029a82cb45c916293487c25b


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎰 DEALER / ORACLE - Market Maker & Resolution Authority
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

L1 Address:       L1_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D
L2 Address:       L2_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D

Public Key:       07943256765557e704e4945aa4d1d56a1b0aac60bd8cc328faa99572aee5e84a
Private Key:      🔒 STORED IN .env (DEALER_PRIVATE_KEY)

```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Frontend)                              │
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │   AuthContext    │    │CreditPrediction  │    │   MarketsContext     │  │
│  │                  │    │    Context       │    │                      │  │
│  │ • vaultSession   │───▶│ • activeWallet   │───▶│ • fetchMarkets()    │  │
│  │ • getPassword()  │    │ • placeBet()     │    │ • marketData         │  │
│  │ • unlockPassword │    │ • bridge()       │    │                      │  │
│  └──────────────────┘    └──────────────────┘    └──────────────────────┘  │
│           │                       │                                          │
│           │              ┌────────▼────────┐                                │
│           │              │ derivePrivate   │                                │
│           └─────────────▶│ KeyOnDemand()   │                                │
│                          │ (blackbook-     │                                │
│                          │  wallet.ts)     │                                │
│                          └────────┬────────┘                                │
│                                   │                                          │
│                          ┌────────▼────────┐                                │
│                          │ Ed25519 Sign    │                                │
│                          │ (tweetnacl)     │                                │
│                          └────────┬────────┘                                │
│                                   │ signature + tx                          │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    │ HTTP/JSON (signed)
                                    ▼
                         ┌──────────────────────┐
                         │   L2 Markets Server  │
                         │    localhost:1234    │
                         │  • POST /buy         │
                         │  • GET /markets      │
                         │  • POST /withdraw    │
                         └──────────┬───────────┘
                                    │
                                    │ gRPC (settlement.proto)
                                    ▼
                         ┌──────────────────────┐
                         │   L1 Blockchain      │
                         │    localhost:8080    │
                         │  • GetBalance()      │
                         │  • SoftLock()        │
                         │  • SettleBet()       │
                         └──────────────────────┘
```

### Key Insight: Frontend-Only Signing

Private keys **NEVER** leave the browser. The flow is:

1. User enters password
2. `derivePrivateKeyOnDemand()` decrypts vault → derives Ed25519 keypair
3. Frontend signs transaction message locally
4. Only the **signature** is sent to L2 API via HTTP/JSON
5. L2 verifies signature using user's **public key**
6. Private key is cleared from memory with `secretKey.fill(0)`

### L1 ↔ L2 Communication: gRPC Protocol

**Important**: L1 and L2 communicate via **gRPC** using `settlement.proto`, not REST APIs.

```protobuf
service L1Settlement {  // L2 calls these methods
  rpc GetBalance(BalanceRequest) returns (BalanceResponse);
  rpc GetVirtualBalance(VirtualBalanceRequest) returns (VirtualBalanceResponse);
  rpc SoftLock(SoftLockRequest) returns (SoftLockResponse);        // Lock funds for bet
  rpc ReleaseLock(ReleaseLockRequest) returns (ReleaseLockResponse); // Cancel bet
  rpc SettleBet(SettleBetRequest) returns (SettleBetResponse);     // Resolve bet
  rpc VerifySignature(VerifySignatureRequest) returns (VerifySignatureResponse);
}

service L2Notifier {  // L1 calls these for push notifications
  rpc OnDeposit(DepositNotification) returns (NotificationAck);
  rpc OnBalanceChange(BalanceChangeNotification) returns (NotificationAck);
}
```

**Frontend** → **L2**: HTTP/JSON (RESTful)
- `POST /buy` - Place bet (Ed25519 signed)
- `GET /markets` - List markets
- `POST /withdraw` - Request withdrawal

**L2** → **L1**: gRPC (settlement.proto)
- `GetBalance()` - Query L1 balance before accepting bet
- `SoftLock()` - Lock user funds when bet placed
- `SettleBet()` - Transfer funds when market resolves

**L1** → **L2**: gRPC (notifications)
- `OnDeposit()` - Notify L2 when user deposits to L1
- `OnBalanceChange()` - Real-time balance updates

---

## ✅ Phase 1: User Wallet L2 Signing - COMPLETED

**Goal**: When `activeWallet === 'user'`, derive real user keys and sign L2 transactions

**Duration**: 2-3 hours  
**Risk**: High (core functionality)  
**Dependencies**: None  
**Status**: ✅ **COMPLETE** - All tests passing (5/5)

### 1.1 Current Problem

**File**: `app/contexts/CreditPredictionContext.tsx` (lines 36-40)

```typescript
// CURRENT CODE - BROKEN
const activeWalletData = activeWallet === 'alice' ? TEST_WALLETS.alice : 
                         activeWallet === 'bob' ? TEST_WALLETS.bob : null
// ↑ Returns NULL for 'user' - no keys available!
```

### 1.2 Required Changes

**File**: `app/contexts/CreditPredictionContext.tsx`

1. Import key derivation function:
```typescript
import { derivePrivateKeyOnDemand, VaultSession } from '@/lib/blackbook-wallet'
```

2. Get auth context functions:
```typescript
const { vaultSession, getPassword, isPasswordUnlocked } = useAuth()
```

3. Create user signer function:
```typescript
const getUserSigner = async (): Promise<{
  signer: (message: string) => Promise<string>,
  address: string,
  publicKey: string
} | null> => {
  if (!vaultSession) return null
  
  const password = getPassword()
  if (!password) {
    // Password expired - need to prompt user
    throw new Error('PASSWORD_REQUIRED')
  }
  
  const { secretKey, publicKey, address } = await derivePrivateKeyOnDemand(
    vaultSession,
    password
  )
  
  const signer = async (message: string): Promise<string> => {
    const messageBytes = new TextEncoder().encode(message)
    const signature = nacl.sign.detached(messageBytes, secretKey)
    secretKey.fill(0) // Clear immediately after signing
    return Buffer.from(signature).toString('hex')
  }
  
  return {
    signer,
    address: address.replace('L1_', 'L2_'),
    publicKey: Buffer.from(publicKey).toString('hex')
  }
}
```

4. Update SDK initialization to handle user wallet:
```typescript
useEffect(() => {
  const initSDK = async () => {
    if (activeWallet === 'user') {
      try {
        const userWallet = await getUserSigner()
        if (userWallet) {
          // Initialize SDK with user's keys
          initializeWithSigner(userWallet.signer, userWallet.address, userWallet.publicKey)
        }
      } catch (error) {
        if (error.message === 'PASSWORD_REQUIRED') {
          setShowPasswordPrompt(true)
        }
      }
    } else {
      // Use test wallet (alice/bob)
      const testWallet = TEST_WALLETS[activeWallet]
      initializeWithTestWallet(testWallet)
    }
  }
  
  initSDK()
}, [activeWallet, vaultSession])
```

### 1.3 Success Criteria

- [ ] Console shows "Initializing L2 SDK for 👤 User" when logged in
- [ ] `activeWallet` is `'user'` after login (not `'alice'`)
- [ ] L2 API accepts user's signature (no 401 errors)
- [ ] Private key never appears in console logs
- [ ] Private key cleared after each signing operation

### 1.4 Files Modified

| File | Changes |
|------|---------|
| `contexts/CreditPredictionContext.tsx` | Add user wallet signer, import derivation function |
| `contexts/AuthContext.tsx` | Export `vaultSession`, `getPassword`, `isPasswordUnlocked` |

---

## ✅ Phase 2: Alphabetical JSON Signing - COMPLETED

**Goal**: L2 Rust server uses `serde_json` which serializes keys alphabetically. Frontend must match.

**Duration**: 1 hour  
**Risk**: Medium (signature verification)  
**Dependencies**: Phase 1  
**Status**: ✅ **COMPLETE** - All tests passing (7/7)

### 2.1 Current Problem

**File**: `sdk/credit-prediction-actions-sdk.js` (lines 103-107)

```javascript
// CURRENT CODE - BROKEN
async signTransaction(tx) {
  const message = JSON.stringify(tx);  // Keys in insertion order, not alphabetical!
  const signature = await this.signer(message);
  return { tx, signature, signer: this.address };
}
```

**Example**:
```javascript
// Frontend sends:
{"timestamp":123,"action":"BUY","payload":{...}}

// L2 Rust expects (alphabetical):
{"action":"BUY","payload":{...},"timestamp":123}

// Signatures don't match → 401 Unauthorized
```

### 2.2 Required Changes

**File**: `sdk/credit-prediction-actions-sdk.js`

Add helper function:
```javascript
/**
 * Recursively sort object keys alphabetically
 * Required for L2 signature verification (Rust serde_json)
 */
function sortKeysAlphabetically(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeysAlphabetically);
  
  return Object.keys(obj)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = sortKeysAlphabetically(obj[key]);
      return sorted;
    }, {});
}
```

Update `signTransaction`:
```javascript
async signTransaction(tx) {
  const sortedTx = sortKeysAlphabetically(tx);
  const message = JSON.stringify(sortedTx);
  const signature = await this.signer(message);
  return { tx: sortedTx, signature, signer: this.address };
}
```

### 2.3 Also Update These SDKs

| File | Function | Line |
|------|----------|------|
| `sdk/markets-sdk.js` | `signTransaction()` | ~103 |
| `sdk/unified-dealer-sdk.js` | `signTransaction()` | ~150 |
| `lib/signature-utils.ts` | Any signing functions | Various |

### 2.4 Success Criteria

- [ ] L2 API returns 200 OK (not 401) for signed requests
- [ ] Console shows sorted JSON in debug logs
- [ ] Test: `{"z":1,"a":2}` becomes `{"a":2,"z":1}` after sorting

### 2.5 Verification Script

```javascript
// Run in browser console to verify
const sortKeysAlphabetically = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeysAlphabetically);
  return Object.keys(obj).sort().reduce((s, k) => {
    s[k] = sortKeysAlphabetically(obj[k]);
    return s;
  }, {});
};

const test = { timestamp: 123, action: 'BUY', payload: { z: 1, a: 2 } };
console.log(JSON.stringify(sortKeysAlphabetically(test)));
// Should output: {"action":"BUY","payload":{"a":2,"z":1},"timestamp":123}
```

---

## ✅ Phase 3: Activity-Based Session Management - COMPLETED

**Goal**: Users log in once per session, password extends on activity, auto-logout after inactivity

**Duration**: 2-3 hours  
**Risk**: Medium (UX flow)  
**Dependencies**: Phase 1, Phase 2  
**Status**: ✅ **COMPLETE** - All tests passing (9/9)

### 3.1 Current Problem

- Current system: Fixed 15-minute password expiry with re-prompt
- No activity tracking - session expires even if user is active
- Password required for every transaction (poor UX)
- No distinction between active session vs inactivity logout

### 3.2 New Session Strategy

**User Experience Flow:**
```
1. User logs in → Enter password → Session starts (10 min active timer)
2. User places bet → Session extends to 10 min from now
3. User adds liquidity → Session extends to 10 min from now
4. User idle for 1 hour → Auto logout (needs password on next visit)
5. Large transaction (>$1000) → Optional password re-confirmation
```

**Session Timers:**
- **Active Session**: 10 minutes (extends on every action)
- **Inactivity Timeout**: 1 hour (logout if no activity)
- **Large Transaction Threshold**: $1000+ (prompt for password)

### 3.3 Required Changes

**File**: `app/contexts/AuthContext.tsx`

1. Update password management refs:
```typescript
const passwordRef = useRef<string | null>(null)
const lastActivityRef = useRef<number | null>(null)  // Track last action time
const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

const ACTIVE_SESSION_MS = 10 * 60 * 1000      // 10 minutes (extends on activity)
const INACTIVITY_LOGOUT_MS = 60 * 60 * 1000   // 1 hour (absolute logout)
const LARGE_TX_THRESHOLD = 1000               // $1000+ requires re-confirmation
```

2. Activity-based session extension:
```typescript
const extendSession = () => {
  lastActivityRef.current = Date.now()
  
  // Clear existing timers
  if (sessionTimerRef.current) {
    clearTimeout(sessionTimerRef.current)
  }
  if (inactivityTimerRef.current) {
    clearTimeout(inactivityTimerRef.current)
  }
  
  // Set new active session timer (10 min)
  sessionTimerRef.current = setTimeout(() => {
    console.log('⏰ Active session expired (10 min of inactivity)')
    // Don't clear password yet - wait for inactivity timeout
  }, ACTIVE_SESSION_MS)
  
  // Set inactivity logout timer (1 hour)
  inactivityTimerRef.current = setTimeout(() => {
    console.log('🚪 Logging out due to inactivity (1 hour)')
    handleLogout()
  }, INACTIVITY_LOGOUT_MS)
}

const isSessionActive = (): boolean => {
  if (!passwordRef.current || !lastActivityRef.current) return false
  const elapsed = Date.now() - lastActivityRef.current
  return elapsed < ACTIVE_SESSION_MS
}

const shouldPromptPassword = (transactionAmount?: number): boolean => {
  // Always prompt if no active session
  if (!isSessionActive()) return true
  
  // Prompt for large transactions
  if (transactionAmount && transactionAmount >= LARGE_TX_THRESHOLD) {
    console.log(`💰 Large transaction ($${transactionAmount}) - requesting password confirmation`)
    return true
  }
  
  // Otherwise, no prompt needed
  return false
}
```

3. Hook into user actions to extend session:
```typescript
const trackActivity = (action: string, amount?: number) => {
  console.log(`📊 Activity tracked: ${action}`, amount ? `($${amount})` : '')
  extendSession()
}
```

4. Export session management functions:
```typescript
export const useAuth = () => {
  // ... existing exports
  return {
    // ... existing
    isSessionActive,
    shouldPromptPassword,
    trackActivity,
    extendSession,
  }
}
```

**File**: `app/contexts/CreditPredictionContext.tsx`

1. Add password prompt state (only for large transactions):
```typescript
const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
const [pendingTransaction, setPendingTransaction] = useState<{
  action: string,
  amount: number,
  callback: () => Promise<void>
} | null>(null)
```

2. Track activity and check if password needed:
```typescript
const { 
  isSessionActive, 
  shouldPromptPassword, 
  trackActivity,
  extendSession 
} = useAuth()

const ensureCanProceed = async (
  action: string, 
  amount?: number
): Promise<boolean> => {
  // Check if password prompt needed
  if (shouldPromptPassword(amount)) {
    // Show password modal for large transactions or expired session
    return new Promise((resolve) => {
      setPendingTransaction({ action, amount: amount || 0, callback: async () => resolve(true) })
      setShowPasswordPrompt(true)
    })
  }
  
  // Session active, no prompt needed - just track activity
  trackActivity(action, amount)
  return true
}

const handlePasswordConfirm = async (password: string): Promise<boolean> => {
  const success = await verifyPassword(password)
  if (success) {
    setShowPasswordPrompt(false)
    extendSession()  // Extend session after successful password entry
    pendingTransaction?.callback()
    setPendingTransaction(null)
  }
  return success
}
```

3. Wrap L2 operations with activity tracking:
```typescript
const placeBet = async (marketId: string, outcome: number, amount: number) => {
  // Check if password needed (only for large amounts or expired session)
  const canProceed = await ensureCanProceed('place_bet', amount)
  if (!canProceed) {
    throw new Error('Transaction cancelled')
  }
  
  // Track activity (extends session)
  trackActivity('place_bet', amount)
  
  // Proceed with transaction
  const userWallet = await getUserSigner()
  // ... rest of bet logic
}

const addLiquidity = async (marketId: string, amount: number) => {
  const canProceed = await ensureCanProceed('add_liquidity', amount)
  if (!canProceed) return
  
  trackActivity('add_liquidity', amount)
  // ... rest of liquidity logic
}

const bridge = async (amount: number) => {
  const canProceed = await ensureCanProceed('bridge', amount)
  if (!canProceed) return
  
  trackActivity('bridge', amount)
  // ... rest of bridge logic
}
```

4. Add PasswordPrompt to provider (only shows for large transactions):
```tsx
return (
  <CreditPredictionContext.Provider value={contextValue}>
    {showPasswordPrompt && (
      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onClose={() => {
          setShowPasswordPrompt(false)
          setPendingTransaction(null)
        }}
        onSubmit={handlePasswordConfirm}
        title={pendingTransaction?.amount >= 1000 
          ? `Confirm Large Transaction ($${pendingTransaction.amount})` 
          : "Session Expired"
        }
        message={pendingTransaction?.amount >= 1000
          ? "Please confirm your password for this large transaction."
          : "Your session has expired. Please re-enter your password to continue."
        }
      />
    )}
    {children}
  </CreditPredictionContext.Provider>
)
```

### 3.4 Success Criteria

- [ ] User logs in once at start of session
- [ ] No password prompts during regular trading (amounts < $1000)
- [ ] Session extends by 10 minutes with each action
- [ ] Password prompt appears for transactions ≥ $1000
- [ ] User auto-logged out after 1 hour of inactivity
- [ ] After logout, user must enter password to resume
- [ ] Console shows activity tracking logs

### 3.5 UX Flow

```
User Flow: Active Session
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Login → Enter Password → Session Active (10 min timer starts)
  │
  ├─ Place $50 bet → ✅ No password (extends to 10 min)
  │
  ├─ Add $200 liquidity → ✅ No password (extends to 10 min)
  │
  ├─ Place $1500 bet → 🔐 Password required (large transaction)
  │      └─ Enter password → ✅ Confirmed (extends to 10 min)
  │
  ├─ Wait 10 min (idle) → ⚠️ Session expires (but still logged in)
  │
  ├─ Place $30 bet → 🔐 Password required (session expired)
  │      └─ Enter password → ✅ Session renewed (10 min)
  │
  └─ Wait 1 hour (idle) → 🚪 Auto logout
         └─ Next visit → Must login with password


Transaction Amount Rules:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
< $1000  → No password (if session active)
≥ $1000  → Password required (always)


Session Timers:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Active Session:  10 min (extends on every action)
Inactivity:      1 hour (absolute logout)
```

### 3.6 Implementation Summary

| Component | Change | Reason |
|-----------|--------|--------|
| `AuthContext` | Add `lastActivityRef`, `trackActivity()` | Track user actions |
| `AuthContext` | Add `extendSession()` | Reset 10-min timer on activity |
| `AuthContext` | Add `isSessionActive()` | Check if within 10-min window |
| `AuthContext` | Add `shouldPromptPassword(amount)` | Only prompt for large tx |
| `CreditPredictionContext` | Wrap all L2 operations | Track activity automatically |
| `PasswordPrompt` | Dynamic title/message | Show reason for prompt |

### 3.7 Benefits Over Old System

| Old (15-min fixed) | New (activity-based) |
|-------------------|---------------------|
| Password expires mid-session | Session extends with activity |
| Prompt every 15 min | Prompt only after 10 min inactivity or large tx |
| Annoying for active users | Seamless for active users |
| No logout mechanism | Auto-logout after 1 hour inactivity |
| One-size-fits-all | Smart based on transaction size |

---

## ✅ Phase 4: Market Standards & Validation - COMPLETED

**Goal**: Define and validate minimum requirements for markets to be live and bettable

**Duration**: 3-4 hours  
**Risk**: Low (validation only)  
**Dependencies**: None  
**Status**: ✅ **COMPLETE** - All standards tests passing (85/85)

### 4.1 Achievements

✅ Created comprehensive `market-standards.md` documentation  
✅ Implemented `market-standards.js` with validation helpers  
✅ Built 85 validation tests in `phase4-market-standards.js`  
✅ All tests passing successfully

### 4.2 Market Requirements Defined

| Requirement | Value | Purpose |
|-------------|-------|---------|
| **Min Liquidity** | $100 BC | Required to activate market |
| **Max Liquidity** | $1,000,000 BC | Per-market cap |
| **Min/Max Bet** | $1 - $10,000 BC | Individual bet limits |
| **Max Position** | 25% of pool | Prevent price manipulation |
| **Outcomes** | 2-10 | Binary minimum, multi-outcome max |
| **Title Length** | 10-200 chars | Clear and concise |
| **Description** | 20-2000 chars | Detailed explanation |
| **Resolution Criteria** | Required | Verifiable source specified |
| **Trading Fee** | 2% | Split 50% LP / 50% platform |
| **Min Duration** | 1 hour | Shortest market lifetime |
| **Max Duration** | 365 days | Longest market lifetime |

### 4.3 Market Lifecycle

```
DRAFT → PENDING → ACTIVE → FROZEN → RESOLVED
  │        │         │         │         │
created  awaiting  trading   trading   payouts
         funding   enabled   halted    complete
```

### 4.4 Validation Functions

The `market-standards.js` module exports:

- `validateMarket(market)` - Check if market meets all requirements
- `canBetOnMarket(market)` - Verify market accepts bets
- `validateBet(amount, market)` - Check bet against limits
- `calculateInitialPool(liquidity, outcomes)` - Compute pool state

### 4.5 Test Coverage

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| Status Constants | 11 | Market states, types, trading types |
| Liquidity Requirements | 4 | Min/max/recommended amounts |
| Timing Requirements | 6 | Duration, timeouts, grace periods |
| Outcome Requirements | 3 | Min/max outcomes, label lengths |
| Content Requirements | 5 | Title/description constraints |
| Betting Limits | 3 | Min/max bet, position limits |
| Fee Structure | 5 | Trading fees, LP/platform split |
| Market Categories | 10 | All 9 categories defined |
| Market Validation | 11 | Comprehensive validation tests |
| Can Bet Validation | 6 | Status/timing checks |
| Bet Validation | 6 | Amount/pool limit checks |
| Pool Initialization | 9 | CPMM formula verification |
| Combined Requirements | 6 | Aggregated constants |
| **Total** | **85** | **100% passing** |

### 4.6 Files Created

| File | Location | Purpose |
|------|----------|---------|
| `market-standards.md` | `/markets-tests/` | Full documentation |
| `market-standards.js` | `/markets-tests/` | Validation logic & constants |
| `phase4-market-standards.js` | `/markets-tests/` | 85 validation tests |

### 4.7 Next Steps

- Integrate validation into market creation UI
- Enforce standards on L2 server market acceptance
- Add real-time validation feedback in forms
- Display requirements prominently in market creation flow

---

## Phase 5: Live Markets Integration

**Goal**: Connect frontend to real L2 market data and enforce validation standards

**Duration**: 4-6 hours  
**Risk**: Medium (API integration)  
**Dependencies**: Phases 1-4 complete  
**Status**: ✅ **COMPLETE - 3-Layer Defense Implemented**

### 5.1 Achievements

✅ Market standards defined and tested (85/85 tests passing)  
✅ MarketsSDK ready with all methods  
✅ **3-layer filtering defense implemented**  
✅ Markets page shows only active markets with ≥$100 BB liquidity  
✅ Market detail pages redirect unfunded markets  
✅ API proxy filters at server edge (99% payload reduction)  
⚠️ No validation on market creation forms (deferred to Phase 6)

### 5.2 Implemented: 3-Layer Filtering Defense

To ensure only tradeable markets are displayed, filtering now occurs at three layers:

**LAYER 1: API Proxy** ([app/api/markets/route.ts](app/api/markets/route.ts))
- Filters at server edge before sending to client
- Checks: `!resolved && liquidity >= 100`
- Impact: Reduces payload from ~350 markets → ~3 markets (99% reduction)

**LAYER 2: SDK** ([sdk/markets-sdk.js](sdk/markets-sdk.js))
- Defensive client-side filtering
- Checks: `!resolved && liquidity >= 100`
- Impact: Safety net if API proxy bypassed

**LAYER 3: Frontend** ([app/markets/page.tsx](app/markets/page.tsx))
- Final safety net before display
- Checks: `!resolved && liquidity >= 100`
- Impact: Prevents any unfunded markets from rendering

**Console Output Example:**
```
🔍 API Proxy: Filtered 354 → 3 active markets (≥100 BB liquidity)
🛡️ SDK Filter: 3 → 3 active markets (≥100 BB liquidity)
✅ Frontend: Loaded 3 active markets with liquidity (filtered from 3 total)
```

### 5.3 Market Creation Form Validation (Deferred to Phase 6)

**File**: `app/markets/page.tsx`

Replace static data with live L2 API calls:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useMarkets } from '@/app/contexts/MarketsContext'
import { MARKET_REQUIREMENTS } from '@/markets-tests/market-standards'

export default function MarketsPage() {
  const { getAllMarkets, getActiveMarkets, isReady } = useMarkets()
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')

  useEffect(() => {
    if (!isReady) return
    
    const loadMarkets = async () => {
      try {
        const data = filter === 'active' 
          ? await getActiveMarkets()
          : await getAllMarkets()
        setMarkets(data)
      } catch (error) {
        console.error('Failed to load markets:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadMarkets()
    const interval = setInterval(loadMarkets, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [filter, isReady])

  return (
    <div>
      {/* Market grid with live data */}
      {markets.map(market => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  )
}
```

### 5.3 Market Creation Form Validation

**New File**: `app/components/CreateMarketForm.tsx`

```typescript
import { useState } from 'react'
import { validateMarket, MARKET_REQUIREMENTS } from '@/markets-tests/market-standards'

export default function CreateMarketForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    outcomes: ['', ''],
    closes_at: '',
    resolution_criteria: '',
    category: 'crypto',
    initial_liquidity: 100
  })
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate against standards
    const validation = validateMarket({
      ...formData,
      id: 'temp-id', // Will be generated server-side
      outcomes: formData.outcomes.map((label, index) => ({ index, label }))
    })
    
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    
    // Submit to L2 API
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_L2_API_URL}/market/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      // Handle response...
    } catch (error) {
      console.error('Market creation failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with real-time validation */}
      <div>
        <label>Title ({MARKET_REQUIREMENTS.MIN_TITLE_LENGTH}-{MARKET_REQUIREMENTS.MAX_TITLE_LENGTH} chars)</label>
        <input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          minLength={MARKET_REQUIREMENTS.MIN_TITLE_LENGTH}
          maxLength={MARKET_REQUIREMENTS.MAX_TITLE_LENGTH}
        />
      </div>
      
      <div>
        <label>Initial Liquidity (min ${MARKET_REQUIREMENTS.MIN_LIQUIDITY} BC)</label>
        <input
          type="number"
          value={formData.initial_liquidity}
          onChange={(e) => setFormData({ ...formData, initial_liquidity: parseInt(e.target.value) })}
          min={MARKET_REQUIREMENTS.MIN_LIQUIDITY}
        />
      </div>

      {errors.length > 0 && (
        <div className="errors">
          {errors.map((err, i) => <p key={i}>{err}</p>)}
        </div>
      )}

      <button type="submit">Create Market</button>
    </form>
  )
}
```

### 5.4 Success Criteria

- [ ] Markets page loads real data from L2 API
- [ ] Market cards show live prices, volume, liquidity
- [ ] Create market form validates against standards
- [ ] Markets below $100 liquidity stay in "pending" status
- [ ] Markets with invalid data are rejected client-side
- [ ] Real-time market updates every 10 seconds

---

## 🔴 Phase 5.5: PRISM Legal Compliance - CRITICAL

**Goal**: Make PRISM contests legally compliant as Skill Games with full transparency and fraud prevention

**Duration**: 6-8 hours  
**Risk**: HIGH (legal/compliance)  
**Dependencies**: Phase 5 complete, Supabase `prism` table created  
**Status**: 🔴 **IN PROGRESS**

### 5.5.1 The Problem: Contests Are Not Legally Defensible

Current gaps that make contests legally risky:

| Issue | Risk | Solution |
|-------|------|----------|
| No lock time enforcement | **FRAUD** (past-posting) | Server-side timestamp validation |
| No scoring rules visible | Not a "skill game" | Display all rules before entry |
| No oracle proof | Disputes unresolvable | Store raw API snapshots |
| Immediate settlement | Data instability | Cool-down period (15-60 min) |
| No tiebreaker rules | Ambiguous payouts | Published rules in footer |

### 5.5.2 Required Schema Changes

**File**: `scripts/seed-prism-contests.sql`

Add these columns to `prism` table:

```sql
-- Lock/Settle Timestamps (Unix epoch for precision)
ALTER TABLE prism ADD COLUMN lock_timestamp BIGINT;           -- Unix epoch (e.g., 1738490000)
ALTER TABLE prism ADD COLUMN settle_timestamp BIGINT;         -- Unix epoch for settlement
ALTER TABLE prism ADD COLUMN buffer_minutes INTEGER DEFAULT 5; -- Pre-event lock buffer
ALTER TABLE prism ADD COLUMN lock_type TEXT DEFAULT 'scheduled'; -- 'scheduled', 'event_start', 'upload_window'

-- Settlement Configuration
ALTER TABLE prism ADD COLUMN cooldown_minutes INTEGER DEFAULT 30; -- Wait before grading
ALTER TABLE prism ADD COLUMN oracle_snapshot JSONB;              -- Raw API response (proof)
ALTER TABLE prism ADD COLUMN oracle_fetched_at TIMESTAMPTZ;      -- When snapshot was taken
ALTER TABLE prism ADD COLUMN oracle_signature TEXT;              -- Dealer signs the snapshot

-- Scoring & Tiebreakers
ALTER TABLE prism ADD COLUMN scoring_rules JSONB;                -- e.g., {"view": 1, "like": 5}
ALTER TABLE prism ADD COLUMN tiebreaker_rules JSONB DEFAULT '{"method": "split_equal"}'::jsonb;
-- Options: {"method": "split_equal"} or {"method": "secondary_metric", "metric": "shots_on_target"}

-- Entry Immutability
ALTER TABLE prism_entries ADD COLUMN entry_timestamp BIGINT;     -- Unix epoch of entry
ALTER TABLE prism_entries ADD COLUMN entry_signature TEXT;       -- User's signature (proof)
ALTER TABLE prism_entries ADD COLUMN locked BOOLEAN DEFAULT false; -- Locked after lock_timestamp
```

### 5.5.3 Server-Side Lock Enforcement

**File**: `app/api/prism/enter/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { contest_id, user_id, picks, signature } = await req.json()
  
  // 1. Fetch contest lock time
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: contest, error } = await supabase
    .from('prism')
    .select('lock_timestamp, buffer_minutes, status')
    .eq('id', contest_id)
    .single()
  
  if (error || !contest) {
    return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
  }
  
  // 2. CRITICAL: Past-posting check
  const nowUnix = Math.floor(Date.now() / 1000)
  const effectiveLock = contest.lock_timestamp - (contest.buffer_minutes * 60)
  
  if (nowUnix >= effectiveLock) {
    return NextResponse.json({ 
      error: 'ENTRY_LOCKED',
      message: 'Contest entries have closed',
      locked_at: effectiveLock,
      current_time: nowUnix
    }, { status: 400 })
  }
  
  // 3. Verify user signature
  // ... signature verification logic
  
  // 4. Insert entry with timestamp proof
  const { data: entry, error: entryError } = await supabase
    .from('prism_entries')
    .insert({
      contest_id,
      user_id,
      picks,
      entry_timestamp: nowUnix,
      entry_signature: signature,
      locked: false
    })
    .select()
    .single()
  
  if (entryError) {
    return NextResponse.json({ error: entryError.message }, { status: 500 })
  }
  
  return NextResponse.json({ 
    success: true, 
    entry,
    time_until_lock: effectiveLock - nowUnix 
  })
}
```

### 5.5.4 Settlement Engine with Cool-Down

**File**: `app/api/prism/settle/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { contest_id } = await req.json()
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // 1. Fetch contest
  const { data: contest } = await supabase
    .from('prism')
    .select('*')
    .eq('id', contest_id)
    .single()
  
  if (!contest) {
    return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
  }
  
  // 2. Check cool-down period
  const nowUnix = Math.floor(Date.now() / 1000)
  const settleAfter = contest.settle_timestamp + (contest.cooldown_minutes * 60)
  
  if (nowUnix < settleAfter) {
    return NextResponse.json({ 
      error: 'COOLDOWN_ACTIVE',
      message: `Wait ${Math.ceil((settleAfter - nowUnix) / 60)} more minutes`,
      settle_after: settleAfter
    }, { status: 400 })
  }
  
  // 3. Fetch oracle data
  const oracleSnapshot = await fetchOracleData(contest)
  
  // 4. Store raw snapshot as proof
  await supabase
    .from('prism')
    .update({
      oracle_snapshot: oracleSnapshot,
      oracle_fetched_at: new Date().toISOString(),
      oracle_signature: signOracleData(oracleSnapshot)
    })
    .eq('id', contest_id)
  
  // 5. Calculate scores
  const { data: entries } = await supabase
    .from('prism_entries')
    .select('*')
    .eq('contest_id', contest_id)
  
  const scored = entries.map(e => ({
    ...e,
    final_score: calculateScore(e.picks, oracleSnapshot, contest.scoring_rules)
  }))
  
  // 6. Rank and apply tiebreaker
  const ranked = applyTiebreakerRules(scored, contest.tiebreaker_rules)
  
  // 7. Distribute payouts
  const payouts = applyPayoutStructure(ranked, contest.prize_pool, contest.payout_structure)
  
  // 8. Update entries with final scores and payouts
  for (const payout of payouts) {
    await supabase
      .from('prism_entries')
      .update({ 
        score: payout.final_score, 
        payout: payout.amount,
        locked: true 
      })
      .eq('id', payout.entry_id)
  }
  
  // 9. Mark contest as settled
  await supabase
    .from('prism')
    .update({ status: 'settled' })
    .eq('id', contest_id)
  
  return NextResponse.json({ 
    success: true,
    settled_at: nowUnix,
    payouts: payouts.map(p => ({ user_id: p.user_id, amount: p.amount, rank: p.rank }))
  })
}

// Helper functions
async function fetchOracleData(contest: any) {
  // Fetch from YouTube API, Sportradar, etc. based on contest.oracle_source
  if (contest.oracle_source?.includes('YouTube')) {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${contest.game_data.video_id}&part=statistics&key=${process.env.YOUTUBE_API_KEY}`
    )
    return await response.json()
  }
  // ... other oracle sources
}

function signOracleData(data: any): string {
  // Sign with dealer private key
  const message = JSON.stringify(data)
  // ... Ed25519 signing
  return 'signature_hex'
}

function calculateScore(picks: any, oracle: any, rules: any): number {
  // Apply scoring rules to picks based on oracle data
  let score = 0
  // ... scoring logic
  return score
}

function applyTiebreakerRules(entries: any[], rules: any): any[] {
  const sorted = entries.sort((a, b) => b.final_score - a.final_score)
  
  // Handle ties based on rules
  if (rules.method === 'split_equal') {
    // Group by score, split prizes
  } else if (rules.method === 'secondary_metric') {
    // Use secondary metric to break ties
  }
  
  return sorted.map((e, i) => ({ ...e, rank: i + 1 }))
}
```

### 5.5.5 Frontend: The "Contract" Display

**Update**: `app/contest/[id]/page.tsx`

Add a "Contest Rules" section that displays ALL required information BEFORE user can enter:

```tsx
{/* LEGAL COMPLIANCE: The "Contract" */}
<div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
    📋 Contest Rules & Terms
  </h2>
  
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
    {/* Entry Info */}
    <div>
      <span className="text-gray-500">Entry Fee</span>
      <p className="text-lg font-bold">{contest.entry_fee} $BB</p>
    </div>
    <div>
      <span className="text-gray-500">Prize Pool</span>
      <p className="text-lg font-bold text-green-400">{contest.prize_pool} $BB</p>
    </div>
    
    {/* Timing */}
    <div>
      <span className="text-gray-500">Entries Lock</span>
      <p className="font-semibold text-yellow-400">
        {new Date(contest.lock_timestamp * 1000).toLocaleString()}
      </p>
    </div>
    <div>
      <span className="text-gray-500">Results Final</span>
      <p className="font-semibold">
        {new Date((contest.settle_timestamp + contest.cooldown_minutes * 60) * 1000).toLocaleString()}
      </p>
    </div>
  </div>
  
  {/* Scoring Rules - CRITICAL */}
  <div className="mt-4 pt-4 border-t border-gray-700">
    <h3 className="font-semibold mb-2">📊 Scoring Rules</h3>
    <div className="bg-gray-900/50 rounded p-3 font-mono text-sm">
      {Object.entries(contest.scoring_rules || {}).map(([key, value]) => (
        <div key={key}>{key}: {value} pts</div>
      ))}
    </div>
  </div>
  
  {/* Data Source */}
  <div className="mt-4 pt-4 border-t border-gray-700">
    <h3 className="font-semibold mb-2">🔮 Oracle / Data Source</h3>
    <p className="text-gray-400">{contest.oracle_source}</p>
    {contest.status === 'settled' && contest.oracle_snapshot && (
      <button 
        onClick={() => setShowOracleProof(true)}
        className="mt-2 text-cyan-400 hover:underline text-sm"
      >
        View Oracle Proof →
      </button>
    )}
  </div>
  
  {/* Tiebreaker */}
  <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
    <strong>Tiebreaker:</strong> {
      contest.tiebreaker_rules?.method === 'split_equal' 
        ? 'In case of tie, prizes are split equally among tied players.'
        : `Secondary metric: ${contest.tiebreaker_rules?.metric}`
    }
  </div>
</div>
```

### 5.5.6 Lock Types for Different Events

| Lock Type | Use Case | Implementation |
|-----------|----------|----------------|
| `scheduled` | "Contest locks at 12:00 PM" | `lock_timestamp` = exact time |
| `event_start` | "Locks 5 min before kickoff" | `lock_timestamp` = kickoff - `buffer_minutes` |
| `upload_window` | "MrBeast Saturday Upload" | `lock_timestamp` = Friday 11:59 PM, settle_timestamp = Sunday 12:00 AM |

### 5.5.7 Success Criteria

- [ ] Schema updated with all compliance fields
- [ ] `POST /api/prism/enter` rejects entries after `lock_timestamp`
- [ ] Contest page displays ALL required fields before entry
- [ ] `POST /api/prism/settle` waits for cool-down period
- [ ] Oracle snapshot stored as JSONB proof
- [ ] Tiebreaker rules displayed in footer
- [ ] "View Oracle Proof" button shows raw API response on settled contests

### 5.5.8 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `scripts/seed-prism-contests.sql` | MODIFY | Add compliance columns |
| `app/api/prism/enter/route.ts` | CREATE | Server-side lock enforcement |
| `app/api/prism/settle/route.ts` | CREATE | Settlement with cool-down |
| `app/contest/[id]/page.tsx` | MODIFY | Display contract fields |
| `app/components/OracleProofModal.tsx` | CREATE | Show raw oracle data |
| `lib/oracle-sdk.ts` | CREATE | Fetch YouTube/Sportradar data |

---

## Phase 6: Unified Balance Display

**Goal**: Show L1 + L2 balances in a single unified view

**Duration**: 2-3 hours  
**Risk**: Low (display only)  
**Dependencies**: Phase 1-5 complete

### 6.1 Current Problem

- Wallet page only shows L2 balance
- No visibility into L1 balance
- No indication of locked amounts (in active bets)
- User confused about total holdings

### 4.2 L2 Balance API Response

```typescript
GET /balance/{address}

// Response:
{
  "l2_available": 800,    // Can bet with
  "l2_locked": 200,       // In active positions
  "l1_available": 5000,   // On L1 chain
  "l1_connected": true    // gRPC connection status
}
```

### 4.3 Required Changes

**New File**: `app/components/UnifiedBalance.tsx`

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
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_L2_API_URL}/balance/${address}`
        )
        const data = await res.json()
        setBalance({
          l2Available: data.l2_available || 0,
          l2Locked: data.l2_locked || 0,
          l1Available: data.l1_available || 0,
          l1Connected: data.l1_connected || false
        })
      } catch (error) {
        console.error('Failed to fetch balance:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchBalance()
    const interval = setInterval(fetchBalance, 5000) // Poll every 5s
    return () => clearInterval(interval)
  }, [address])
  
  if (loading) return <BalanceSkeleton />
  if (!balance) return <BalanceError />
  
  const total = balance.l2Available + balance.l2Locked + balance.l1Available
  
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-white">Your Balance</h3>
      
      {/* Total */}
      <div className="mb-6 pb-4 border-b border-gray-700">
        <div className="text-3xl font-bold text-cyan-400">
          {total.toLocaleString()} BB
        </div>
        <div className="text-sm text-gray-400">Total Balance</div>
      </div>
      
      {/* Breakdown */}
      <div className="space-y-3">
        <BalanceRow 
          label="L2 Available" 
          value={balance.l2Available} 
          color="text-green-400"
          tooltip="Ready to bet on prediction markets"
        />
        
        {balance.l2Locked > 0 && (
          <BalanceRow 
            label="L2 Locked" 
            value={balance.l2Locked} 
            color="text-yellow-400"
            icon="🔒"
            tooltip="Locked in active positions"
          />
        )}
        
        <BalanceRow 
          label="L1 Available" 
          value={balance.l1Available} 
          color="text-blue-400"
          tooltip="On L1 blockchain - bridge to L2 to bet"
        />
      </div>
      
      {!balance.l1Connected && (
        <div className="mt-4 text-xs text-red-400 flex items-center gap-1">
          <span>⚠️</span>
          <span>L1 connection lost - balance may be outdated</span>
        </div>
      )}
    </div>
  )
}
```

### 6.4 Integration Points

| File | Change |
|------|--------|
| `app/wallet/page.tsx` | Import and render `<UnifiedBalance />` |
| `app/components/Navigation.tsx` | Add mini balance indicator |
| `app/markets/[slug]/page.tsx` | Show available L2 balance for betting |

### 6.5 Success Criteria

- [ ] Total balance shows L1 + L2 combined
- [ ] Locked amount visible when user has active positions
- [ ] Balance updates every 5 seconds
- [ ] Shows warning if L1 connection lost
- [ ] Matches actual balances in L1/L2 APIs

---

## Phase 7: Bridge UI Completion

**Goal**: Enable deposits (L1→L2) and withdrawals (L2→L1) in the UI

**Duration**: 4-6 hours  
**Risk**: Medium (involves real token movement)  
**Dependencies**: Phase 1-6 complete

### 7.1 Bridge Architecture

```
DEPOSIT (L1 → L2):
1. User calls L1 /l2/lock (locks BB in escrow)
2. L1 returns session_id
3. Dealer service detects lock, calls L2 /deposit
4. L2 credits user's balance

WITHDRAWAL (L2 → L1):
1. User calls L2 /withdraw (debits L2 balance)
2. L2 creates pending withdrawal record
3. Dealer service processes pending withdrawals
4. Dealer calls L1 to transfer from escrow to user
5. Dealer calls L2 /withdraw/complete with L1 tx_hash
```

### 5.2 Required Components

**File**: `app/components/BridgeDeposit.tsx`

```tsx
export default function BridgeDeposit({ wallet, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'signing' | 'locking' | 'crediting' | 'complete' | 'error'>('idle')
  
  const handleDeposit = async () => {
    setStatus('signing')
    
    // 1. Sign L1 lock transaction
    const lockTx = await signL1Transaction({
      action: 'L2_LOCK',
      from: wallet.l1Address,
      amount: parseFloat(amount),
      timestamp: Math.floor(Date.now() / 1000)
    })
    
    setStatus('locking')
    
    // 2. Submit to L1
    const lockRes = await fetch('/api/l1-proxy', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: '/l2/lock',
        data: lockTx
      })
    })
    
    const { session_id } = await lockRes.json()
    
    setStatus('crediting')
    
    // 3. Wait for dealer to credit L2 (poll for balance change)
    await pollForL2Credit(wallet.l2Address, parseFloat(amount))
    
    setStatus('complete')
    onSuccess?.()
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Deposit to L2</h3>
      
      <div>
        <label className="text-sm text-gray-400">Amount (BB)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-gray-800 rounded px-4 py-2 mt-1"
          placeholder="Enter amount"
        />
      </div>
      
      <button
        onClick={handleDeposit}
        disabled={status !== 'idle' || !amount}
        className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded font-semibold"
      >
        {status === 'idle' && 'Deposit to L2'}
        {status === 'signing' && 'Signing transaction...'}
        {status === 'locking' && 'Locking on L1...'}
        {status === 'crediting' && 'Crediting L2 balance...'}
        {status === 'complete' && '✓ Complete'}
        {status === 'error' && 'Failed - Retry'}
      </button>
    </div>
  )
}
```

**File**: `app/components/BridgeWithdraw.tsx`

```tsx
export default function BridgeWithdraw({ wallet, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'requesting' | 'pending' | 'complete'>('idle')
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null)
  
  const handleWithdraw = async () => {
    setStatus('requesting')
    
    // 1. Request withdrawal on L2
    const withdrawTx = await signL2Transaction({
      action: 'WITHDRAW_REQUEST',
      from_address: wallet.l2Address,
      amount: parseFloat(amount),
      timestamp: Math.floor(Date.now() / 1000),
      nonce: `withdraw_${Date.now()}`
    })
    
    const res = await fetch(`${L2_URL}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withdrawTx)
    })
    
    const { withdrawal_id } = await res.json()
    setWithdrawalId(withdrawal_id)
    setStatus('pending')
    
    // 2. Poll for completion (dealer processes async)
    await pollForWithdrawalComplete(withdrawal_id)
    
    setStatus('complete')
    onSuccess?.()
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Withdraw to L1</h3>
      
      {/* Amount input */}
      <input ... />
      
      {/* Submit button */}
      <button onClick={handleWithdraw} ...>
        {status === 'pending' ? `Pending (ID: ${withdrawalId})` : 'Withdraw'}
      </button>
      
      {status === 'pending' && (
        <div className="text-yellow-400 text-sm">
          ⏳ Dealer processing withdrawal... (typically 1-3 minutes)
        </div>
      )}
    </div>
  )
}
```

### 5.3 Update BridgeInterface

**File**: `app/components/BridgeInterface.tsx`

- Add tabs: "Deposit" and "Withdraw"
- Import and render `<BridgeDeposit />` and `<BridgeWithdraw />`
- Show transaction history
- Add pending withdrawals list

### 5.4 Success Criteria

- [ ] User can deposit 100 BB from L1 to L2
- [ ] L1 balance decreases, L2 balance increases
- [ ] User can request withdrawal from L2 to L1
- [ ] Withdrawal shows "Pending" status
- [ ] After dealer processes, L1 balance increases
- [ ] Transaction history shows both deposits and withdrawals

---

## Phase 8: Production Hardening

**Goal**: Security audit, error handling, performance optimization

**Duration**: 1-2 days  
**Risk**: Low (non-functional improvements)  
**Dependencies**: Phase 1-5 complete

### 6.1 Security Checklist

- [ ] **Private key logging**: Search codebase for `console.log` containing `privateKey`, `secretKey`, `seed`
- [ ] **Memory clearing**: Verify `secretKey.fill(0)` called after every signing operation
- [ ] **Password storage**: Confirm password only in `useRef`, not `useState` or localStorage
- [ ] **XSS protection**: Sanitize all user inputs displayed in UI
- [ ] **CSRF tokens**: Add to API routes if not already present

### 6.2 Error Handling

| Error | User-Friendly Message |
|-------|----------------------|
| `Invalid signature` | "Transaction failed. Please try again." |
| `Insufficient balance` | "Not enough BB. You need {required} BB but have {available} BB." |
| `Password expired` | "Session expired. Please enter your password." |
| `Network timeout` | "Connection lost. Check your internet and retry." |
| `Market closed` | "This market is no longer accepting bets." |

### 6.3 Performance Optimizations

- [ ] Add React Query for API caching
- [ ] Implement optimistic updates for balance
- [ ] Lazy load market cards (pagination)
- [ ] Add service worker for offline support
- [ ] Compress images to WebP format

### 6.4 Monitoring Setup

- [ ] Sentry for error tracking
- [ ] Vercel Analytics for performance
- [ ] BetterStack for uptime monitoring
- [ ] Alerts: API down, withdrawal queue > 10, low escrow balance

---

## Testing Checklist

### Unit Tests

- [ ] `sortKeysAlphabetically()` handles nested objects
- [ ] `derivePrivateKeyOnDemand()` returns valid Ed25519 keypair
- [ ] Password expiry after 15 minutes
- [ ] Vault decryption with correct password
- [ ] Vault decryption fails with wrong password

### Integration Tests

- [ ] User signup → wallet creation → vault saved to Supabase
- [ ] User login → vault loaded → password stored in memory
- [ ] Place bet → password check → sign → L2 accepts
- [ ] Bridge deposit → L1 lock → L2 credit
- [ ] Bridge withdrawal → L2 request → dealer process → L1 receive

### E2E Tests (Playwright)

```typescript
test('full user journey', async ({ page }) => {
  // 1. Sign up
  await page.goto('/signup')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'SecurePass123!')
  await page.click('button:has-text("Sign Up")')
  
  // 2. Create wallet
  await page.waitForSelector('text=Create Wallet')
  await page.click('button:has-text("Create Wallet")')
  await page.waitForSelector('text=Your recovery phrase')
  // ... backup mnemonic
  
  // 3. Bridge deposit
  await page.goto('/wallet')
  await page.click('text=Bridge')
  await page.fill('[name="amount"]', '100')
  await page.click('button:has-text("Deposit")')
  await page.waitForSelector('text=Complete')
  
  // 4. Place bet
  await page.goto('/markets/bitcoin-100k')
  await page.click('button:has-text("Yes")')
  await page.fill('[name="amount"]', '10')
  await page.click('button:has-text("Place Bet")')
  await page.waitForSelector('text=Bet placed')
  
  // 5. Verify balance updated
  await page.goto('/wallet')
  const balance = await page.textContent('.l2-available')
  expect(parseFloat(balance)).toBe(90)
})
```

### Load Tests (k6)

```javascript
import http from 'k6/http'

export const options = {
  vus: 100,
  duration: '5m',
}

export default function () {
  // Simulate browsing markets
  http.get('http://localhost:1234/markets')
  
  // Simulate balance checks
  http.get('http://localhost:1234/balance/L2_abc123')
}
```

---

## Troubleshooting Guide

### "Invalid signature" from L2

**Cause**: JSON keys not alphabetically sorted  
**Fix**: Verify `sortKeysAlphabetically()` is applied before signing  
**Debug**: Log message before signing, verify key order

### "No wallet keys available"

**Cause**: `activeWallet === 'user'` but `getUserSigner()` returned null  
**Fix**: Check `vaultSession` exists and password is available  
**Debug**: Log `vaultSession`, `isPasswordUnlocked()` values

### Password modal never appears

**Cause**: `isPasswordUnlocked()` always returns true  
**Fix**: Check password expiry timer (15 min)  
**Debug**: Log `passwordTimestampRef.current` vs current time

### L2 balance not updating after deposit

**Cause**: Dealer service not running or slow  
**Fix**: Check dealer service logs, verify L1 lock confirmed  
**Debug**: Check L2 `/balance/{address}` directly

### "Network timeout" on L1 proxy

**Cause**: L1 server not running or unreachable  
**Fix**: Verify L1 is running on port 8080  
**Debug**: `curl http://localhost:8080/health`

---

## Environment Variables

```bash
# .env.local (Frontend)
NEXT_PUBLIC_L1_API_URL=http://localhost:8080
NEXT_PUBLIC_L2_API_URL=http://localhost:1234
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## Milestones Summary

| Phase | Duration | Blocker? | Success Metric |
|-------|----------|----------|----------------|
| 1. User Wallet Signing | 2-3 hours | ✅ CRITICAL | L2 accepts user signatures |
| 2. Alphabetical JSON | 1 hour | ✅ CRITICAL | Signature verification passes |
| 3. Password Prompt | 2-3 hours | ⚠️ HIGH | Modal appears when expired |
| 4. Unified Balance | 2-3 hours | ⬜ MEDIUM | Shows L1+L2+Locked |
| 5. Bridge UI | 4-6 hours | ⬜ MEDIUM | Deposit/withdraw works |
| 6. Production Hardening | 1-2 days | ⬜ LOW | Zero key leaks |

**Total Estimated Time**: 2-3 days for core functionality (Phases 1-3)

---

## Definition of Done

The Prism Prediction Market is **production ready** when:

1. ✅ User can sign up and create wallet without dev tools
2. ✅ User signs L2 transactions with their own keys (not Alice/Bob)
3. ✅ Password prompt appears when session expires
4. ✅ Unified balance shows L1 + L2 + Locked amounts
5. ✅ Bridge deposit (L1→L2) works end-to-end
6. ✅ Bridge withdrawal (L2→L1) works end-to-end
7. ✅ Zero private key leaks (verified via code audit)
8. ✅ All transactions recorded on-chain
9. ✅ 99.9% uptime for 7 days
10. ✅ Load tested with 100+ concurrent users

---

**Next Step**: Begin Phase 1 - Fix user wallet signing in `CreditPredictionContext.tsx`
