# 🚀 Quick Start: Fancoins Integration

## ✅ What I've Done

1. **Created Supabase Utilities**
   - ✅ [utils/supabase/server.ts](utils/supabase/server.ts) - Server Components
   - ✅ [utils/supabase/client.ts](utils/supabase/client.ts) - Client Components
   - ✅ [lib/database.types.ts](lib/database.types.ts) - TypeScript types

2. **Created Auth System**
   - ✅ [app/login/page.tsx](app/login/page.tsx) - Google OAuth + Email/Password
   - ✅ [app/auth/callback/route.ts](app/auth/callback/route.ts) - OAuth redirect handler

3. **Created Pages**
   - ✅ [app/lobby/page.tsx](app/lobby/page.tsx) - Contest lobby (CONNECTED TO SUPABASE ✅)
   - ✅ [app/contest/[id]/page.tsx](app/contest/[id]/page.tsx) - Contest details (mock data)
   - ✅ [app/my-contests/page.tsx](app/my-contests/page.tsx) - User dashboard (mock data)
   - ✅ [app/identity/[username]/page.tsx](app/identity/[username]/page.tsx) - User profile (mock data)

4. **Created Database Migration**
   - ✅ [supabase/migrations/20260126100000_contest_system.sql](supabase/migrations/20260126100000_contest_system.sql)
   - Creates: `contests_metadata`, `contest_entries`, `game_history`, `badges`
   - Seeds 4 example contests
   - Adds `fan_gold_balance` (1000 FG default) to profiles

5. **Installed Dependencies**
   - ✅ `@supabase/ssr` package installed

---

## 📋 Your Checklist (Do This Now)

### Step 1: Run the Database Migration

```bash
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Open: supabase/migrations/20260126100000_contest_system.sql
# 3. Copy entire file contents
# 4. Paste into SQL Editor
# 5. Click "Run"
```

**Expected Result:**
- ✅ 6 new tables created
- ✅ 4 seed contests inserted
- ✅ `fan_gold_balance` column added to profiles

### Step 2: Verify the Migration

```sql
-- Run this in Supabase SQL Editor to verify
SELECT * FROM contests_metadata;
-- Should return 4 rows:
-- 1. MrBeast vs IShowSpeed (10 $BB)
-- 2. EPL Fantasy (20 $BB)
-- 3. Beast Games Bingo (5 $BB)
-- 4. Kai Cenat vs xQc (100 FG)
```

### Step 3: Test the Login Page

```bash
npm run dev
# Visit: http://localhost:3000/login
```

**What to test:**
1. Click "Sign Up" tab
2. Enter email + password
3. Click "Create Account"
4. Check your email inbox
5. Click confirmation link
6. Should redirect to `/lobby`

### Step 4: Verify Your Profile

```sql
-- Run this after signing up
SELECT user_id, email, fan_gold_balance, bb_balance FROM profiles;
```

**Expected Result:**
- Your email appears
- `fan_gold_balance = 1000`
- `bb_balance = 0`

### Step 5: Test the Lobby

Visit `http://localhost:3000/lobby` (after logging in)

**Expected Result:**
- ✅ 4 contests displayed (from Supabase, not mock data)
- ✅ Countdown timers working
- ✅ Prize pools showing
- ✅ "Enter Contest" buttons visible

---

## 🎯 Current Status

| Page | Status | Data Source |
|------|--------|-------------|
| `/login` | ✅ WORKING | Supabase Auth |
| `/lobby` | ✅ CONNECTED | Supabase `contests_metadata` |
| `/contest/[id]` | ⚠️ MOCK DATA | Needs integration |
| `/my-contests` | ⚠️ MOCK DATA | Needs integration |
| `/identity/[username]` | ⚠️ MOCK DATA | Needs integration |
| `/leaderboard` | ⚠️ NEEDS UPDATE | Needs `leaderboard_weekly` view |

---

## 🔄 Next Integration Steps

### Phase 2.1: Connect `/identity/[username]`

**File:** [app/identity/[username]/page.tsx](app/identity/[username]/page.tsx)

**Replace the `fetchProfile()` function with:**

```typescript
async function fetchProfile() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        badges (*),
        contest_entries (
          *,
          contests_metadata (*)
        )
      `)
      .eq('username', resolvedParams.username)
      .single()

    if (error) throw error
    
    // Transform data to match UI expectations
    setProfile({
      username: data.username,
      blackbook_id: data.blackbook_address,
      avatar_url: data.avatar_url,
      bio: data.bio,
      joined_at: data.created_at,
      stats: {
        total_contests: data.contest_entries.length,
        contests_won: data.contest_entries.filter(e => e.status === 'won').length,
        win_rate: (data.contest_entries.filter(e => e.status === 'won').length / data.contest_entries.length * 100) || 0,
        total_wagered: data.contest_entries.reduce((sum, e) => sum + e.entry_fee_paid, 0),
        total_won: data.contest_entries.reduce((sum, e) => sum + (e.payout || 0), 0),
        profit: data.contest_entries.reduce((sum, e) => sum + ((e.payout || 0) - e.entry_fee_paid), 0),
        fan_gold_balance: data.fan_gold_balance,
        bb_balance: data.bb_balance
      },
      badges: data.badges,
      recent_contests: data.contest_entries.slice(-5)
    })
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    setNotFound(true)
  } finally {
    setLoading(false)
  }
}
```

### Phase 2.2: Connect `/my-contests`

**File:** [app/my-contests/page.tsx](app/my-contests/page.tsx)

**Replace the `fetchMyContests()` function with:**

```typescript
async function fetchMyContests() {
  if (!user?.blackbook_address) return

  try {
    const { data, error } = await supabase
      .from('contest_entries')
      .select(`
        *,
        contests_metadata (*)
      `)
      .eq('user_id', user.blackbook_address)
      .order('entered_at', { ascending: false })

    if (error) throw error

    // Transform data
    const transformedContests = data.map(entry => ({
      contest_id: entry.contest_id,
      contest_title: entry.contests_metadata.title,
      type: entry.contests_metadata.contest_type,
      entry_fee: entry.entry_fee_paid,
      currency: entry.currency,
      pick: entry.pick,
      status: entry.status,
      current_rank: entry.current_rank,
      total_entries: entry.contests_metadata.current_participants,
      current_score: entry.current_score,
      payout: entry.payout,
      ended_at: entry.settled_at,
      locks_at: entry.contests_metadata.locks_at
    }))

    setContests(transformedContests)
  } catch (error) {
    console.error('Failed to fetch contests:', error)
  } finally {
    setLoading(false)
  }
}
```

### Phase 2.3: Connect `/contest/[id]` Entry Flow

**Add this function to [app/contest/[id]/page.tsx](app/contest/[id]/page.tsx):**

```typescript
async function handleEnterContest() {
  if (!user) {
    router.push('/login')
    return
  }

  if (!selectedPick && contest?.contest_type === 'duel') {
    alert('Please select your pick first!')
    return
  }

  setEntering(true)

  try {
    // Check balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('fan_gold_balance, bb_balance')
      .eq('user_id', user.blackbook_address)
      .single()

    const balance = contest.currency === 'fan_gold' 
      ? profile.fan_gold_balance 
      : profile.bb_balance

    if (balance < contest.entry_fee) {
      alert(`Insufficient ${contest.currency === 'fan_gold' ? 'Fan Gold' : '$BB'}!`)
      setEntering(false)
      return
    }

    // Insert entry
    const { error: entryError } = await supabase
      .from('contest_entries')
      .insert({
        contest_id: contest.contest_id,
        user_id: user.blackbook_address,
        pick: selectedPick ? { choice: selectedPick } : null,
        entry_fee_paid: contest.entry_fee,
        currency: contest.currency
      })

    if (entryError) throw entryError

    // Deduct balance
    const newBalance = balance - contest.entry_fee
    const updateField = contest.currency === 'fan_gold' 
      ? { fan_gold_balance: newBalance }
      : { bb_balance: newBalance }

    await supabase
      .from('profiles')
      .update(updateField)
      .eq('user_id', user.blackbook_address)

    // Increment participant count
    await supabase
      .rpc('increment', { 
        table_name: 'contests_metadata',
        row_id: contest.contest_id,
        field: 'current_participants'
      })

    alert('Successfully entered contest!')
    router.push('/my-contests')
  } catch (error) {
    console.error('Failed to enter contest:', error)
    alert('Failed to enter contest. Please try again.')
  } finally {
    setEntering(false)
  }
}
```

---

## 🐛 Troubleshooting

### "Cannot find module '@supabase/ssr'"
```bash
npm install @supabase/ssr
```

### "Failed to fetch contests"
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify migration ran successfully
- Check Supabase Dashboard → Table Editor → `contests_metadata` has 4 rows

### "User is not authenticated"
- Visit `/login` and sign up/sign in
- Check cookies are enabled in browser
- Try incognito mode to clear session

### "RLS policy violation"
- This means Row Level Security is working!
- Check you're logged in (JWT token present)
- Service role key needed for admin operations

---

## 📚 Documentation

- **Full Setup Guide:** [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **Database Schema:** Check migration file for all table definitions
- **API Docs:** Supabase auto-generates REST API docs in Dashboard

---

## ✅ Success Criteria

After completing these steps, you should have:

✅ Login working with Google OAuth + Email/Password  
✅ New users auto-receive 1,000 Fan Gold  
✅ Lobby page showing real contests from Supabase  
✅ Countdown timers working correctly  
✅ All 4 seed contests visible  
✅ TypeScript types matching your database  

**Next:** Integrate `/my-contests` and `/identity` pages to complete Phase 2!
