# 🎯 Frontend Integration Guide: BlackBook L2

> **Last Updated:** January 2026  
> **L2 Version:** v3 Production  
> **Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [SDK Selection Guide](#sdk-selection-guide)
3. [Quick Start](#quick-start)
4. [Core Integration Steps](#core-integration-steps)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Signature Format Guide](#signature-format-guide)
7. [Security Considerations](#security-considerations)
8. [Example Flows](#example-flows)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BLACKBOOK ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐         │
│   │   FRONTEND   │◄──────►│    L2 API    │◄──────►│   L1 (gRPC)  │         │
│   │   (Next.js)  │        │  Port: 1234  │        │  Port: 50051 │         │
│   └──────────────┘        └──────────────┘        └──────────────┘         │
│          │                       │                        │                 │
│          ▼                       ▼                        ▼                 │
│   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐         │
│   │   Supabase   │        │    redb      │        │  BlackCoin   │         │
│   │  (Metadata)  │        │ (L2 Ledger)  │        │   ($BC)      │         │
│   └──────────────┘        └──────────────┘        └──────────────┘         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Currency Flow:
  L1: $BC (BlackCoin) ──► Bridge ──► L2: $BB (BlackBook Credits)
```

### Token Economics
- **L1 Token**: `$BC` (BlackCoin) - Main chain asset
- **L2 Token**: `$BB` (BlackBook Credits) - Layer 2 betting credits
- **Exchange Rate**: 1:1 (1 $BC = 1 $BB)
- **Bridge**: Trustless L1↔L2 with dealer verification

---

## 📦 SDK Selection Guide

| SDK | Purpose | Use When |
|-----|---------|----------|
| **`credit-prediction-actions-sdk.js`** | Full-featured production SDK | Building complete betting UI |
| **`markets-sdk.js`** | Market data & trading only | Need only market functionality |
| **`unified-dealer-sdk.js`** | Dealer/Oracle operations | Building admin panel |

### ✅ Recommended: `credit-prediction-actions-sdk.js`

```javascript
import { CreditPredictionSDK } from '@/sdk/credit-prediction-actions-sdk.js';

const sdk = new CreditPredictionSDK({
  l2Url: 'http://localhost:1234',  // L2 API
  address: userL2Address,          // User's L2 address (L2_XXXX...)
  publicKey: userPublicKey,        // Ed25519 public key (hex)
  signer: async (msg) => sign(msg) // Your signing function
});
```

### Alternative: `markets-sdk.js` (Lightweight)

```javascript
import { MarketsSDK } from '@/sdk/markets-sdk.js';

const markets = new MarketsSDK({
  l2Url: 'http://localhost:1234',
  address: userL2Address,
  signer: async (msg) => sign(msg)
});
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install @noble/ed25519 @noble/hashes @supabase/supabase-js
```

### 2. Ed25519 Signature Setup

```javascript
import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

// Configure ed25519 for sync operations
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

// Helper functions
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sign(message, privateKeyHex) {
  const sig = await ed25519.sign(
    new TextEncoder().encode(message),
    hexToBytes(privateKeyHex)
  );
  return bytesToHex(sig);
}
```

### 3. Initialize SDK

```javascript
const sdk = new CreditPredictionSDK({
  l2Url: process.env.NEXT_PUBLIC_L2_URL || 'http://localhost:1234',
  address: wallet.l2Address,
  publicKey: wallet.publicKey,
  signer: async (msg) => sign(msg, wallet.privateKey)
});
```

---

## 🔧 Core Integration Steps

### Step 1: Wallet Connection

```javascript
// User's wallet contains:
const wallet = {
  l1Address: 'L1_52882D768C0F3E7932AAD1813CF8B19058D507A8',
  l2Address: 'L2_52882D768C0F3E7932AAD1813CF8B19058D507A8', // Same base!
  publicKey: 'c0e349153cbc75e9529b5f1963205cab783463c6835c826a7587e0e0903c6705',
  privateKey: '...' // NEVER store in frontend for production
};
```

### Step 2: Check Balances

```javascript
// L2 Balance
const res = await fetch(`${L2_URL}/balance/${wallet.l2Address}`);
const data = await res.json();
console.log('L2 Available:', data.l2_available);
console.log('L2 Locked:', data.l2_locked);
console.log('L1 Available:', data.l1_available);
```

### Step 3: Load Markets

```javascript
// Get active markets
const markets = await fetch(`${L2_URL}/markets?status=active`);
const { markets: activeMarkets } = await markets.json();

// Get single market details
const market = await fetch(`${L2_URL}/market/${marketId}`);
const details = await market.json();
```

### Step 4: Place a Bet

```javascript
const timestamp = Math.floor(Date.now() / 1000);
const nonce = `bet_${Date.now()}_${Math.random().toString(36).slice(2)}`;

// CRITICAL: Message format must match Rust's serde_json (alphabetical keys)
const message = JSON.stringify({
  action: 'BUY',
  nonce: nonce,
  payload: {
    amount: 100,
    market_id: 'MKT_xxx',
    outcome: 0,  // 0 = first outcome, 1 = second, etc.
    user: wallet.l2Address
  },
  timestamp: timestamp
});

const signature = await sign(message, wallet.privateKey);

const res = await fetch(`${L2_URL}/buy`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user: wallet.l2Address,
    market_id: 'MKT_xxx',
    outcome: 0,
    amount: 100,
    public_key: wallet.publicKey,
    signature: signature,
    timestamp: timestamp,
    nonce: nonce
  })
});

const result = await res.json();
// { success: true, bet_id: 'BET_xxx', shares: 95.5, cost: 100, new_balance: 900 }
```

### Step 5: Request Withdrawal

```javascript
const timestamp = Math.floor(Date.now() / 1000);
const nonce = `withdraw_${Date.now()}`;

const message = JSON.stringify({
  action: 'WITHDRAW_REQUEST',
  nonce: nonce,
  payload: {
    amount: 500,
    from_address: wallet.l2Address
  },
  timestamp: timestamp
});

const signature = await sign(message, wallet.privateKey);

const res = await fetch(`${L2_URL}/withdraw`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from_address: wallet.l2Address,
    amount: 500,
    public_key: wallet.publicKey,
    signature: signature,
    timestamp: timestamp,
    nonce: nonce
  })
});
```

---

## 📡 API Endpoints Reference

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server status & L1 connectivity |
| GET | `/ledger` | Visual dashboard (HTML) |
| GET | `/balance/:address` | L1+L2 balance for address |
| GET | `/markets?status=` | List markets (active/closed/resolved) |
| GET | `/market/:id` | Single market details |
| GET | `/user/:address/bets` | User's bet history |
| GET | `/l1/balance/:address` | L1 balance only |

### User Endpoints (Signature Required)

| Method | Endpoint | Action | Required Fields |
|--------|----------|--------|-----------------|
| POST | `/buy` | Buy shares | user, market_id, outcome, amount |
| POST | `/sell` | Sell position | user, bet_id |
| POST | `/withdraw` | Request withdrawal | from_address, amount |
| POST | `/redeem` | Redeem winning bet | user, bet_id |
| POST | `/market` | Create market | creator, title, outcomes, liquidity |

### Dealer-Only Endpoints

| Method | Endpoint | Action |
|--------|----------|--------|
| POST | `/deposit` | Confirm L1→L2 deposit |
| POST | `/withdraw/complete` | Complete L2→L1 withdrawal |
| POST | `/resolve` | Resolve market with winner |
| POST | `/claim-liquidity` | Claim remaining pool |
| GET | `/withdrawals/pending` | List pending withdrawals |

---

## 🔐 Signature Format Guide

### Message Structure (CRITICAL)

All signed messages **MUST** follow this exact JSON structure with **alphabetically sorted keys**:

```javascript
{
  "action": "ACTION_NAME",
  "nonce": "unique_string",
  "payload": {
    // Action-specific fields (ALPHABETICALLY SORTED)
  },
  "timestamp": 1737654321
}
```

### Action Reference

| Action | Payload Fields |
|--------|----------------|
| `BUY` | `amount`, `market_id`, `outcome`, `user` |
| `SELL` | `bet_id`, `user` |
| `WITHDRAW_REQUEST` | `amount`, `from_address` |
| `REDEEM` | `bet_id`, `user` |
| `CREATE_MARKET` | `closes_at`, `creator`, `liquidity`, `outcomes`, `title` |
| `RESOLVE` | `market_id`, `winning_outcome` |
| `DEALER_CONFIRM_DEPOSIT` | `amount`, `from_address`, `l1_tx_hash` |
| `WITHDRAW_COMPLETE` | `l1_tx_hash`, `withdrawal_id` |

### ⚠️ Common Signature Mistakes

1. **Wrong key order** - Keys must be alphabetical
2. **Missing nonce** - Every request needs unique nonce
3. **Expired timestamp** - Must be within 5 minutes of server time
4. **Float precision** - Use `.0` for whole numbers (100.0 not 100)

---

## 🛡️ Security Considerations

### Address Security
```
L1_52882D768C0F3E7932AAD1813CF8B19058D507A8  ←→  L2_52882D768C0F3E7932AAD1813CF8B19058D507A8
     └────────────────────────────────────────────────┘
                    SAME BASE ADDRESS
```

- **Withdrawals always go to the owner's L1 address**
- Cross-wallet withdrawals are **physically impossible**
- L2 address is derived from L1 address (same base, different prefix)

### Replay Protection
- Every request requires a **unique nonce**
- Timestamps must be within **5 minutes** of server time
- Used nonces are stored and rejected

### Private Key Handling
```javascript
// ❌ NEVER do this in production
const privateKey = 'abc123...'; // Hardcoded

// ✅ Use secure wallet integration
const signature = await wallet.signMessage(message);
```

---

## 📖 Example Flows

### Flow 1: New User Deposits

```
1. User has $BC on L1
2. Dealer initiates deposit (POST /deposit)
   - Verifies L1 balance via gRPC
   - Credits $BB to user's L2 address
3. User can now bet on L2
```

### Flow 2: Complete Betting Cycle

```javascript
// 1. Get balance
const balance = await fetch('/balance/L2_...');

// 2. Load markets
const markets = await fetch('/markets?status=active');

// 3. Place bet
const bet = await fetch('/buy', { ... });

// 4. Market resolves (dealer/oracle)
// POST /resolve by dealer

// 5. Redeem winnings
const redeem = await fetch('/redeem', { ... });

// 6. Withdraw to L1
const withdraw = await fetch('/withdraw', { ... });
// Dealer completes: POST /withdraw/complete
```

### Flow 3: React Hook Example

```javascript
// hooks/useL2Balance.js
import { useState, useEffect } from 'react';

export function useL2Balance(address) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    
    const fetchBalance = async () => {
      const res = await fetch(`${L2_URL}/balance/${address}`);
      const data = await res.json();
      setBalance({
        l2Available: data.l2_available,
        l2Locked: data.l2_locked,
        l1Available: data.l1_available,
        l1Connected: data.l1_connected
      });
      setLoading(false);
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [address]);

  return { balance, loading };
}
```

---

## 🔗 Environment Variables

```env
# .env.local
NEXT_PUBLIC_L2_URL=http://localhost:1234
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Server-side only (for dealer operations)
DEALER_PRIVATE_KEY=xxx
DEALER_PUBLIC_KEY=07943256765557e704e4945aa4d1d56a1b0aac60bd8cc328faa99572aee5e84a
```

---

## ✅ Integration Checklist

- [ ] Ed25519 signing configured
- [ ] SDK initialized with correct URL
- [ ] Wallet address format correct (L2_XXX)
- [ ] Message signing follows alphabetical key order
- [ ] Nonce generation is unique per request
- [ ] Timestamp within 5-minute window
- [ ] Error handling for failed signatures
- [ ] Balance polling implemented
- [ ] Market list filtering working
- [ ] Bet placement tested
- [ ] Withdrawal flow tested

---

## 🆘 Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid signature` | Wrong message format | Check alphabetical key order |
| `Address mismatch` | Public key doesn't derive to address | Verify keypair |
| `Invalid/reused nonce` | Duplicate request or clock skew | Generate new nonce |
| `Insufficient balance` | Not enough $BB | Check L2 balance first |
| `Market not found` | Invalid market ID | Verify market exists |
| `Market resolved` | Betting closed | Check market status |

---

## 📞 Support

- **Dashboard**: `http://localhost:1234/ledger`
- **Health Check**: `http://localhost:1234/health`
- **Test Accounts**: See `TEST_ACCOUNTS.txt`

---

*"May the Force always be with you."* ⚔️
