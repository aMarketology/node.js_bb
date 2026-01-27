# BlackBook Data Architecture

## The Casino Model

Think of your system like a Casino:

| Layer | Casino Analogy | Speed | Purpose |
|-------|---------------|-------|---------|
| **Layer 1 (Base)** | The Vault | Slow, Secure | Holds real cash. Final settlement. |
| **Layer 2 (Redb)** | The Table | Fast | Where chips move. Active gameplay. |
| **Supabase (SQL)** | The Front Desk | Fast queries | Records, history, profiles, Fan Gold. |

---

## What Lives Where

### 1. Supabase (The "Front Desk" & History)

**Role:** Long-term storage, User Identity, and Fan Gold.
**Why:** Cheap, easy to query, connects to Frontend.

| Data Type | Specific Fields | Why Here? |
|-----------|----------------|-----------|
| User Profiles | `username`, `email`, `avatar_url`, `bio` | Standard Web2 data. Too expensive for blockchain. |
| Auth | `password_hash`, `oauth_tokens` | Security. Never put auth tokens on a blockchain. |
| Fan Gold (FG) | `fan_gold_balance` | FG has $0 value. It's just a number (like Reddit Karma). |
| Game History | `contest_history`, `bet_history` | For the "My History" page. L2 dumps here after settlement. |
| Leaderboards | `leaderboard_weekly` view | SQL is great for sorting 100k users by score. |
| Chat/Social | `chat_logs`, `friend_list` | High volume, low value data. |

**Tables:**
- `profiles` - User metadata (NOT live stats)
- `bet_history` - Settled bets only (won/lost/refunded)
- `market_history` - Resolved markets only
- `contest_history` - Settled contests with oracle proofs
- `contest_entry_history` - User picks after settlement
- `fan_gold_transactions` - Social currency ledger

### 2. Layer 2 / Redb (The "Trading Floor")

**Role:** The Hot State. High-speed "RAM" memory.
**Why:** Rust engine needs to read/write in microseconds.

| Data Type | Specific Fields | Why Here? |
|-----------|----------------|-----------|
| Active $BB | `user_id`, `available_bb`, `locked_bb` | "Playable Balance." Changes too fast for L1. |
| Live Contests | `contest_id`, `status: OPEN/LOCKED`, `pool_size` | Engine needs to know RIGHT NOW if game is open. |
| Active Entries | `user_id`, `contest_id`, `selection` | Critical recovery data if server crashes. |
| Oracle State | `mrbeast_current_views`, `last_updated_ts` | Most recent data from YouTube API. |
| Playthrough | `deposited_bb`, `wagered_bb` | Anti-money laundering checks on every bet. |

**Note:** Redb is embedded inside the Rust application. Incredibly fast.

### 3. Layer 1 / Base (The "Vault")

**Role:** Final settlement. Proof of funds.
**Why:** Immutable, secure, verifiable.

| Data Type | Why Here? |
|-----------|-----------|
| Deposits | Real money enters the system |
| Withdrawals | Real money exits the system |
| Vault balances | Cryptographic proof of reserves |

---

## API Data Flow

### Placing a Bet (Active State)

```
User clicks "Bet" 
    ↓
POST /api/bet
    ↓
→ L2 Rust Server (Redb)
    ↓
✅ Bet stored on L2 ONLY
    ↓
Response: { bet_id, tokens_received }
```

**❌ NO Supabase write on bet placement.**

### When Market Resolves (Settlement)

```
L2 Server resolves market
    ↓
Indexer detects MarketResolved event
    ↓
Indexer fetches all bets for that market
    ↓
→ Supabase: bet_history (status: won/lost)
→ Supabase: market_history (status: resolved)
    ↓
✅ Historical record created
```

### Reading Active Bets

```
GET /api/bet?user_address=0x...
    ↓
→ L2 Server: /positions/:address
    ↓
Returns: Active positions from L2
```

### Reading Bet History

```
GET /api/bet/history?user_address=0x...
    ↓
→ Supabase: bet_history table
    ↓
Returns: Settled bets only
```

---

## Key Rules

### ✅ DO

1. **Query L2 for ALL active state**
   - Live balances
   - Open contests
   - Active bets/entries
   - Current odds/prices

2. **Query Supabase for historical data**
   - Past contests
   - Settled bets
   - Leaderboards
   - User profiles

3. **Write to Supabase ONLY after settlement**
   - Indexer syncs after `MarketResolved`
   - Store oracle proof data for fairness

### ❌ DON'T

1. **Don't write active bets to Supabase**
   - They change too fast
   - Violates the architecture

2. **Don't query Supabase for live odds**
   - L2 is the source of truth
   - Supabase data is stale

3. **Don't track live balances in Supabase**
   - L2 tracks playable balance
   - L1 tracks vault balance

---

## Database Tables (After Migration)

### Supabase Schema

```sql
-- Historical bet records (only settled)
bet_history (
  bet_id TEXT UNIQUE,
  user_address TEXT,
  market_id UUID,
  outcome_id UUID,
  amount DECIMAL,
  status TEXT CHECK (status IN ('won', 'lost', 'refunded', 'cancelled')),
  payout_amount DECIMAL,
  settled_at TIMESTAMPTZ
)

-- Historical market records (only resolved)
market_history (
  market_id TEXT UNIQUE,
  question TEXT,
  status TEXT DEFAULT 'resolved',
  resolved_outcome TEXT,
  resolution_timestamp TIMESTAMPTZ,
  oracle_source TEXT
)

-- Settled contest records with fairness proof
contest_history (
  contest_id TEXT UNIQUE,
  title TEXT,
  contest_type TEXT,  -- 'duel', 'roster', 'bingo'
  prize_pool DECIMAL,
  winner_addresses TEXT[],
  oracle_data JSONB,  -- THE PROOF
  oracle_signature TEXT
)

-- User profiles (Web2 data, Fan Gold)
profiles (
  wallet_address TEXT UNIQUE,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  fan_gold_balance BIGINT DEFAULT 0
)

-- Fan Gold ledger (social currency, $0 value)
fan_gold_transactions (
  user_address TEXT,
  amount BIGINT,
  transaction_type TEXT,  -- 'daily_bonus', 'contest_win', 'social_share'
  reason TEXT
)
```

---

## Contest Flow Example

### 1. User Enters Contest (L2)

```
POST /api/contest/enter
    ↓
L2: Deduct entry_fee from available_bb
L2: Store entry in active_entries
    ↓
Response: { entry_id, contest_id }
```

### 2. Contest is Live (L2)

```
GET /api/contest/:id/scores
    ↓
L2: Return current scores from oracle_state
    ↓
Frontend polls every 10 seconds
```

### 3. Contest Settles (L2 → Supabase)

```
L2: Timer hits 0:00
L2: Oracle fetches final data
L2: Calculates winners, distributes payouts
    ↓
Indexer: Detects ContestSettled event
Indexer: Syncs to contest_history + contest_entry_history
    ↓
Supabase: Historical record with oracle_data proof
```

### 4. User Views History (Supabase)

```
GET /api/contest/history?user_address=0x...
    ↓
Supabase: contest_entry_history
    ↓
Shows: Past contests, picks, results, payouts
```

---

## Fairness Proof (Oracle Data)

Every settled contest stores proof that can be verified:

```json
{
  "contest_id": "duel-mrbeast-speed-123",
  "oracle_source": "YouTube Data API v3",
  "timestamp": "2026-01-26T12:00:00Z",
  "data": {
    "mrbeast": {
      "channel_id": "UCX6OQ3DkcSbYuA-VCgAhyw",
      "start_views": 1000000,
      "end_views": 1450200,
      "delta": 450200
    },
    "ishowspeed": {
      "channel_id": "UCX6OQ3DkcSbYuB-VCgAhyz",
      "start_views": 800000,
      "end_views": 1180000,
      "delta": 380000
    }
  },
  "winner": "mrbeast",
  "oracle_signature": "0x..."
}
```

User can click "View Oracle Data" to see this JSON and verify the result.

---

## Migration Notes

The migration `20260126000000_data_architecture_refactor.sql`:

1. **Renames tables:**
   - `bets` → `bet_history`
   - `markets` → `market_history`
   - `market_outcomes` → `market_outcome_history`

2. **Adds constraint:**
   - `bet_history.status` cannot be 'active'

3. **Drops functions:**
   - `increment_market_stats()` - was updating live state
   - `increment_outcome_stats()` - was updating live state
   - `increment_profile_stats()` - was updating live state

4. **Creates new tables:**
   - `contest_history` - Settled contests
   - `contest_entry_history` - User entries
   - `fan_gold_transactions` - Social currency

5. **Creates views:**
   - `leaderboard_weekly` - Aggregates from historical data

---

## Summary

| Operation | Source |
|-----------|--------|
| Check balance | L2 |
| Place bet | L2 |
| View active bets | L2 |
| View live scores | L2 |
| Enter contest | L2 |
| View bet history | Supabase |
| View past contests | Supabase |
| Leaderboard | Supabase |
| User profile | Supabase |
| Fan Gold | Supabase |
| Deposit/Withdraw | L1 |
