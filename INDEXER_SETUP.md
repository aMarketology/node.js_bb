# 🚀 L2 Indexer Setup Guide

Complete step-by-step guide to get your **Hybrid-DeFi** indexer running.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Supabase project created
- [ ] L1 server running (localhost:8080)
- [ ] L2 server running (localhost:1234)

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and project name
4. Wait for database to provision (~2 minutes)

### 1.2 Get API Credentials

1. Navigate to **Settings** → **API**
2. Copy these values:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY

⚠️ **CRITICAL**: Never expose `service_role` key to client!

### 1.3 Enable Real-time

1. Navigate to **Database** → **Replication**
2. Enable replication for these tables:
   - ✅ profiles
   - ✅ markets
   - ✅ market_outcomes
   - ✅ bets
3. Click "Save"

---

## Step 2: Database Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
cd supabase
supabase db push
```

### Option B: Manual (Supabase Studio)

1. Navigate to **SQL Editor** in Supabase dashboard
2. Create new query
3. Copy contents of `supabase/migrations/20260125000000_create_indexer_tables.sql`
4. Paste and click "Run"
5. Repeat for `20260125000001_create_helper_functions.sql`

### Verify Migration

Run this query in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('markets', 'bets', 'profiles', 'market_outcomes', 'l2_events', 'indexer_state');
```

You should see all 6 tables.

---

## Step 3: Environment Variables

### 3.1 Create `.env.local`

```bash
# Copy the example
cp .env.example .env.local
```

### 3.2 Fill in Values

Edit `.env.local`:

```bash
# Supabase (from Step 1.2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# L2 Server
NEXT_PUBLIC_L2_API_URL=http://localhost:1234
L2_API_URL=http://localhost:1234

# L1 Server
NEXT_PUBLIC_L1_API_URL=http://localhost:8080
L1_API_URL=http://localhost:8080

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Indexer (optional)
INDEXER_POLL_INTERVAL=5000
```

### 3.3 Verify

```bash
# Check that .env.local exists and is not in git
cat .env.local
git status  # Should show ".env.local" in .gitignore
```

---

## Step 4: Install Dependencies

```bash
npm install
```

New packages added:
- `@supabase/auth-helpers-nextjs` - Supabase client
- `node-fetch` - HTTP client
- `tsx` - TypeScript execution

---

## Step 5: Test Database Connection

Create a test script `test-supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  console.log('Testing Supabase connection...')
  
  // Test 1: Query indexer state
  const { data, error } = await supabase
    .from('indexer_state')
    .select('*')
    .eq('id', 1)
    .single()
  
  if (error) {
    console.error('❌ Failed:', error)
    return
  }
  
  console.log('✅ Supabase connected!')
  console.log('Indexer state:', data)
}

test()
```

Run:
```bash
node test-supabase.js
```

Expected output:
```
Testing Supabase connection...
✅ Supabase connected!
Indexer state: { id: 1, last_synced_block: 0, ... }
```

---

## Step 6: Initial Data Sync

Sync existing L2 markets to Supabase:

```bash
# Start Next.js server (if not already running)
npm run dev

# In another terminal, trigger sync
curl -X POST http://localhost:3000/api/sync-l2
```

Expected response:
```json
{
  "success": true,
  "message": "Synced 45 markets (0 errors)",
  "stats": {
    "total": 45,
    "synced": 45,
    "errors": 0
  }
}
```

Verify in Supabase:
```sql
SELECT COUNT(*) FROM markets;
SELECT * FROM markets LIMIT 5;
```

---

## Step 7: Start the Indexer

Open a new terminal and run:

```bash
npm run indexer
```

Expected output:
```
═══════════════════════════════════════════════════════════════
  L2 EVENT INDEXER - STARTING
═══════════════════════════════════════════════════════════════
L2 API: http://localhost:1234
Supabase: https://xxxxx.supabase.co
Poll Interval: 5000ms
───────────────────────────────────────────────────────────────
🔄 Starting L2 event sync...
📍 Last synced block: 0
📥 Found 0 new events
✅ No new events
✅ Indexer started successfully
```

### Keep it Running

The indexer should keep running in the background. It will:
- Poll L2 every 5 seconds
- Detect new events (MarketCreated, BetPlaced, etc.)
- UPSERT to Supabase
- Log each operation

---

## Step 8: Verify Real-time Updates

### 8.1 Open Two Browser Windows

1. Window 1: http://localhost:3000/markets
2. Window 2: http://localhost:3000/markets

### 8.2 Trigger a Market Update

In terminal:
```bash
# Manually update a market in Supabase
curl -X POST http://localhost:3000/api/sync-l2 \
  -H "Content-Type: application/json" \
  -d '{"market_id": "existing-market-id", "force_resync": true}'
```

### 8.3 Watch Both Windows

Both browser windows should update **instantly** (no refresh needed).

You should see:
- 🔴 LIVE: Market updated (in top banner)
- Market card updates with new stats

---

## Step 9: Production Checklist

Before deploying to production:

- [ ] Use production Supabase project
- [ ] Enable Supabase real-time on production
- [ ] Set strong `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Use production L1/L2 URLs
- [ ] Set `INDEXER_POLL_INTERVAL=3000` (3 seconds)
- [ ] Deploy indexer as separate service
- [ ] Set up health check monitoring
- [ ] Enable database backups
- [ ] Add error alerting (e.g., Sentry)
- [ ] Test failover scenarios

---

## Troubleshooting

### Issue: "Failed to load indexer state"

**Cause**: Migrations not applied

**Fix**:
```bash
# Re-run migrations
cd supabase
supabase db push

# Or manually in SQL Editor
```

---

### Issue: "Failed to fetch markets from L2"

**Cause**: L2 server not running

**Fix**:
```bash
# Check L2 status
curl http://localhost:1234/markets

# Start L2 server if needed
```

---

### Issue: Real-time not working

**Cause**: Replication not enabled

**Fix**:
1. Go to Supabase → Database → Replication
2. Enable for: profiles, markets, market_outcomes, bets
3. Save changes
4. Restart Next.js dev server

---

### Issue: "SUPABASE_SERVICE_ROLE_KEY not defined"

**Cause**: `.env.local` not loaded

**Fix**:
```bash
# Verify file exists
ls -la .env.local

# Check contents
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY

# Restart server
npm run dev
```

---

### Issue: Indexer stops after error

**Cause**: Unhandled exception

**Fix**:
1. Check indexer logs for error message
2. Fix the issue (usually connection or data format)
3. Restart indexer: `npm run indexer`
4. For production, use PM2 or similar for auto-restart

---

## Monitoring

### Check Indexer Status

```bash
curl http://localhost:3000/api/sync-l2
```

Response tells you:
- Last synced block number
- Total events processed
- Current status (running/error)
- Table counts

### Check Supabase Dashboard

Navigate to **Database** → **Tables** and check:
- `markets` → Should have all L2 markets
- `bets` → Should grow as users bet
- `l2_events` → Raw event log
- `indexer_state` → Sync progress

### Logs to Watch

```bash
# Indexer logs
npm run indexer
# Watch for: ✅ Market created, ✅ Bet placed

# Next.js logs
npm run dev
# Watch for: 🔴 LIVE: Market updated

# Supabase logs
# Go to dashboard → Logs → check for errors
```

---

## Next Steps

✅ **Indexer is running!**

Now you can:
1. Place bets via UI → See real-time odds updates
2. Create markets → Instantly appear for all users
3. Monitor leaderboard → Track top bettors
4. Build analytics → Query Supabase for stats

Your **Hybrid-DeFi** stack is complete! 🎉

---

## Architecture Diagram

```
┌─────────────┐
│   Browser   │  User places bet
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Next.js UI │  Calls /api/bet
└──────┬──────┘
       │
       ▼
┌─────────────┐         ┌──────────────┐
│   L2 (Bet)  │ ──────> │   Indexer    │  Listens for events
└─────────────┘  Emits  └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   Supabase   │  UPSERT data
                         └──────┬───────┘
                                │
                                │ Real-time
                                ▼
                         ┌──────────────┐
                         │ All Browsers │  Live update
                         └──────────────┘
```

**You've built the gold standard.** 🌈
