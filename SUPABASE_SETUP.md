# Supabase Integration Setup Guide

## 🚀 Phase 1: The Plumbing (Do This First)

### Step 1: Install Dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### Step 2: Generate TypeScript Types

This auto-generates perfect TypeScript types from your database schema.

```bash
# Login to Supabase CLI
npx supabase login

# Generate types (replace with your project ID)
npx supabase gen types typescript --project-id "YOUR_PROJECT_ID" --schema public > lib/database.types.ts
```

**Note:** I've already created a base `lib/database.types.ts` file. After running the migration, regenerate this file to get the exact types.

### Step 3: Set Up Environment Variables

Create or update `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 4: Run the Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/20260126100000_contest_system.sql`
3. Copy the entire file and paste it into the SQL Editor
4. Click "Run"

This creates:
- ✅ `contests_metadata` table (4 seed contests)
- ✅ `contest_entries` table
- ✅ `game_history` table
- ✅ `badges` table
- ✅ `leaderboard_weekly` view
- ✅ RLS policies for security
- ✅ Adds `fan_gold_balance` (1000 FG default) to profiles

### Step 5: Verify Tables

In Supabase Dashboard → Table Editor, you should see:
- `contests_metadata` with 4 rows (MrBeast vs IShowSpeed, EPL Fantasy, etc.)
- `contest_entries` empty (will fill as users enter)
- `game_history` empty
- `badges` empty

---

## 🔌 Phase 2: Integration (What I've Already Done)

### ✅ Created Files

1. **[utils/supabase/server.ts](../utils/supabase/server.ts)** - Server Component client
2. **[utils/supabase/client.ts](../utils/supabase/client.ts)** - Client Component client
3. **[lib/database.types.ts](../lib/database.types.ts)** - TypeScript types
4. **[app/login/page.tsx](../app/login/page.tsx)** - Auth page (Google + Email)
5. **[app/auth/callback/route.ts](../app/auth/callback/route.ts)** - OAuth callback handler

### ✅ Updated Pages

1. **[app/lobby/page.tsx](../app/lobby/page.tsx)** - Now fetches from `contests_metadata` table
   - Replaced mock data with Supabase query
   - Filters by status (upcoming, live)
   - Orders by lock time

2. **Ready for Integration:**
   - `/identity/[username]` - Fetch profile by username
   - `/my-contests` - Fetch user's contest entries
   - `/contest/[id]` - Fetch contest details + leaderboard

---

## 🧪 Phase 3: Testing the Integration

### Test 1: Can You See the Login Page?

```bash
npm run dev
# Visit http://localhost:3000/login
```

✅ You should see:
- "Continue with Google" button
- Email/Password tabs
- "1,000 Fan Gold" welcome message

### Test 2: Sign Up a New User

1. Click "Sign Up" tab
2. Enter email + password
3. Check your email for confirmation link
4. Click confirm
5. You should redirect to `/lobby`

**Expected Result:** 
- New row in `auth.users` table
- New row in `profiles` table with `fan_gold_balance = 1000`

### Test 3: Can You See Real Contests?

Visit `/lobby` after logging in.

✅ You should see 4 contests:
- MrBeast vs IShowSpeed (10 $BB)
- EPL Fantasy (20 $BB)
- Beast Games Bingo (5 $BB)
- Kai Cenat vs xQc (100 FG - FREE)

**Debugging:**
```javascript
// Open browser console on /lobby page
// You should NOT see any Supabase errors
```

### Test 4: Check Your Profile Data

```sql
-- Run this in Supabase SQL Editor
SELECT user_id, email, fan_gold_balance, bb_balance FROM profiles;
```

✅ You should see:
- Your email
- `fan_gold_balance = 1000`
- `bb_balance = 0`

---

## 📋 Next Steps: Page-by-Page Integration

### Priority 1: `/lobby` ✅ DONE
Already integrated! Fetching from Supabase.

### Priority 2: `/identity/[username]`

**Action:** Update to fetch profile by username.

```typescript
// app/identity/[username]/page.tsx
const { data: profile } = await supabase
  .from('profiles')
  .select('*, badges(*), contest_entries(*)')
  .eq('username', username)
  .single()
```

### Priority 3: `/my-contests`

**Action:** Fetch user's contest entries.

```typescript
// app/my-contests/page.tsx
const { data: entries } = await supabase
  .from('contest_entries')
  .select('*, contests_metadata(*)')
  .eq('user_id', user.id)
  .order('entered_at', { ascending: false })
```

### Priority 4: `/contest/[id]` Entry Flow

**Action:** Implement contest entry with Fan Gold deduction.

```typescript
// When user clicks "Enter Contest"
async function enterContest(contestId: string, pick: any) {
  // 1. Deduct Fan Gold/BB from profile
  // 2. Insert row into contest_entries
  // 3. Increment contests_metadata.current_participants
  // 4. Add fan_gold_transactions row
}
```

---

## 🔒 Security Notes

### RLS Policies Enabled

- ✅ Users can only view their own entries
- ✅ Anyone can view contests (public)
- ✅ Users can only insert entries for themselves
- ✅ Service role bypasses all policies (for admin operations)

### Auth Flow

1. User signs up → Supabase creates `auth.users` row
2. Trigger creates `profiles` row with 1,000 FG
3. User logs in → JWT token stored in cookie
4. All queries use user's JWT → RLS enforces access

---

## 🐛 Troubleshooting

### "Failed to fetch contests"
- Check `.env.local` has correct Supabase URL/keys
- Verify migration ran successfully (check Table Editor)
- Check browser console for Supabase errors

### "User is not authenticated"
- Make sure you're logged in (visit `/login`)
- Check cookies are enabled
- Try logging out and back in

### "Profile not found"
- After signing up, profile should auto-create
- Check `profiles` table in Supabase
- May need to manually insert if trigger failed

### "RLS policy violation"
- This means security is working!
- Check the policy matches your query
- Use service role client for admin operations

---

## 📚 Database Schema Reference

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User accounts | `user_id`, `fan_gold_balance`, `bb_balance` |
| `contests_metadata` | Contest definitions | `contest_id`, `title`, `entry_fee`, `status` |
| `contest_entries` | User entries | `entry_id`, `contest_id`, `user_id`, `pick`, `status` |
| `game_history` | Historical stats | `game_id`, `user_id`, `result`, `amount_won` |
| `badges` | User achievements | `badge_id`, `user_id`, `badge_name` |
| `fan_gold_transactions` | FG ledger | `transaction_id`, `user_id`, `amount`, `type` |

### Views

| View | Purpose |
|------|---------|
| `leaderboard_weekly` | Top users by winnings (last 7 days) |

---

## ✅ Success Checklist

After following this guide, you should have:

- [ ] All dependencies installed
- [ ] `.env.local` configured
- [ ] Migration executed successfully
- [ ] 4 seed contests visible in Table Editor
- [ ] Login page working (`/login`)
- [ ] Lobby page showing real contests (`/lobby`)
- [ ] New users auto-receive 1,000 Fan Gold
- [ ] TypeScript types generated from schema

**Ready for Phase 2?** Start integrating `/identity` and `/my-contests` pages!

---

## 🆘 Need Help?

1. Check Supabase Dashboard → Logs
2. Check browser console for errors
3. Verify RLS policies in Table Editor → Policies tab
4. Test queries in SQL Editor first
