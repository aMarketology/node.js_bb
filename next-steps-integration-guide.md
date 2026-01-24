# Prism Prediction Market - Integration Guide

**Created**: January 23, 2026  
**Purpose**: Step-by-step guide to connect production-ready L1/L2 infrastructure to the Next.js frontend  
**End Goal**: Users can create wallets, sign L2 transactions with their own keys, and trade on prediction markets

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Architecture Overview](#architecture-overview)
3. [Phase 1: User Wallet L2 Signing](#phase-1-user-wallet-l2-signing)
4. [Phase 2: Alphabetical JSON Signing](#phase-2-alphabetical-json-signing)
5. [Phase 3: Password Prompt Integration](#phase-3-password-prompt-integration)
6. [Phase 4: Unified Balance Display](#phase-4-unified-balance-display)
7. [Phase 5: Bridge UI Completion](#phase-5-bridge-ui-completion)
8. [Phase 6: Production Hardening](#phase-6-production-hardening)
9. [Testing Checklist](#testing-checklist)
10. [Troubleshooting Guide](#troubleshooting-guide)

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

### ❌ What's Broken (The Integration Gap)

| Issue | Location | Problem |
|-------|----------|---------|
| User wallet signing | `contexts/CreditPredictionContext.tsx:36` | Returns `null` for `activeWallet === 'user'` |
| JSON signature format | `sdk/credit-prediction-actions-sdk.js:103` | Not alphabetically sorted (L2 rejects) |
| Password prompt | `contexts/CreditPredictionContext.tsx` | Not integrated before L2 writes |
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

## Phase 1: User Wallet L2 Signing

**Goal**: When `activeWallet === 'user'`, derive real user keys and sign L2 transactions

**Duration**: 2-3 hours  
**Risk**: High (core functionality)  
**Dependencies**: None

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

## Phase 2: Alphabetical JSON Signing

**Goal**: L2 Rust server uses `serde_json` which serializes keys alphabetically. Frontend must match.

**Duration**: 1 hour  
**Risk**: Medium (signature verification)  
**Dependencies**: Phase 1

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

## Phase 3: Activity-Based Session Management

**Goal**: Users log in once per session, password extends on activity, auto-logout after inactivity

**Duration**: 2-3 hours  
**Risk**: Medium (UX flow)  
**Dependencies**: Phase 1, Phase 2

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

## Phase 4: Unified Balance Display

**Goal**: Show L1 + L2 balances in a single unified view

**Duration**: 2-3 hours  
**Risk**: Low (display only)  
**Dependencies**: Phase 1-3 complete

### 4.1 Current Problem

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

### 4.4 Integration Points

| File | Change |
|------|--------|
| `app/wallet/page.tsx` | Import and render `<UnifiedBalance />` |
| `app/components/Navigation.tsx` | Add mini balance indicator |
| `app/markets/[slug]/page.tsx` | Show available L2 balance for betting |

### 4.5 Success Criteria

- [ ] Total balance shows L1 + L2 combined
- [ ] Locked amount visible when user has active positions
- [ ] Balance updates every 5 seconds
- [ ] Shows warning if L1 connection lost
- [ ] Matches actual balances in L1/L2 APIs

---

## Phase 5: Bridge UI Completion

**Goal**: Enable deposits (L1→L2) and withdrawals (L2→L1) in the UI

**Duration**: 4-6 hours  
**Risk**: Medium (involves real token movement)  
**Dependencies**: Phase 1-4 complete

### 5.1 Bridge Architecture

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

## Phase 6: Production Hardening

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
