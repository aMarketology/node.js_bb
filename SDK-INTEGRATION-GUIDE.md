# SDK Integration Guide

This guide shows how to use the FanCredit and L2Markets SDKs in your components.

## Context Providers

Both SDKs are wrapped in React Context providers and added to the app in `ClientLayout.tsx`:

```tsx
<FanCreditProvider>
  <L2MarketsProvider>
    {children}
  </L2MarketsProvider>
</FanCreditProvider>
```

## Using FanCredit SDK

### Import the hook
```tsx
import { useFanCredit } from '@/app/contexts/FanCreditContext'
```

### In your component
```tsx
function MyComponent() {
  const { 
    balance,           // Current FC balance
    transactions,      // Transaction history
    loading,           // Loading state
    error,             // Error message
    refreshBalance,    // Manually refresh
    canEnterContest,   // Check if can afford entry
    formatFC           // Format FC amounts
  } = useFanCredit()

  // Display balance
  if (balance) {
    console.log('Available FC:', balance.available)
    console.log('Locked FC:', balance.locked)
    console.log('Total FC:', balance.total)
  }

  // Check if user can enter a contest
  const checkEntry = async () => {
    const canEnter = await canEnterContest(100) // 100 FC entry fee
    if (canEnter) {
      console.log('User has sufficient balance')
    }
  }

  // Display formatted FC
  return <div>{formatFC(balance?.available || 0)}</div>
}
```

### Available Methods
- `balance` - FanCredit balance object with available, locked, and total
- `transactions` - Array of FC transaction history
- `loading` - Boolean indicating if data is loading
- `error` - Error message string or null
- `refreshBalance()` - Manually refresh the FC balance
- `refreshTransactions()` - Manually refresh transaction history
- `canEnterContest(entryFee)` - Check if user can afford a contest entry
- `formatFC(amount)` - Format FC amount for display (e.g., "1,234 FC")

## Using L2Markets SDK

### Import the hook
```tsx
import { useL2Markets } from '@/app/contexts/L2MarketsContext'
```

### In your component
```tsx
function MyComponent() {
  const {
    contests,           // All contests
    liveContests,       // Only live contests
    userContests,       // User's entered contests
    loading,            // Loading state
    error,              // Error message
    refreshContests,    // Refresh all contests
    getContest,         // Get single contest
    enterContest,       // Enter a contest
    canEnterContest,    // Check eligibility
    formatAmount        // Format currency amounts
  } = useL2Markets()

  // Display live contests
  return (
    <div>
      {liveContests.map(contest => (
        <div key={contest.contest_id}>
          <h3>{contest.name}</h3>
          <p>Entry Fee: {formatAmount(contest.entry_fee, contest.currency)}</p>
          <p>Status: {contest.status}</p>
          <p>Participants: {contest.participants?.length}/{contest.max_participants}</p>
        </div>
      ))}
    </div>
  )
}
```

### Entering a Contest
```tsx
async function handleEnterContest() {
  // Check if user can enter first
  const eligibility = await canEnterContest('contest_123')
  
  if (!eligibility.canEnter) {
    console.log('Cannot enter:', eligibility.reason)
    return
  }

  // Enter the contest with a roster
  const success = await enterContest({
    contestId: 'contest_123',
    roster: [1, 2, 3, 4, 5], // Player IDs
    signature: 'optional_signature'
  })

  if (success) {
    console.log('Successfully entered contest!')
  }
}
```

### Available Methods
- `contests` - Array of all contests
- `liveContests` - Array of only live/open contests
- `userContests` - Array of contests the user has entered
- `loading` - Boolean indicating if data is loading
- `error` - Error message string or null
- `refreshContests()` - Refresh all contests
- `refreshLiveContests()` - Refresh only live contests
- `refreshUserContests()` - Refresh user's contests
- `getContest(contestId)` - Get details of a specific contest
- `enterContest(params)` - Enter a contest
- `canEnterContest(contestId)` - Check if user can enter a contest
- `formatAmount(amount, currency)` - Format amount with currency symbol

## Complete Example: Contest Entry Component

```tsx
'use client'

import { useState } from 'react'
import { useL2Markets } from '@/app/contexts/L2MarketsContext'
import { useFanCredit } from '@/app/contexts/FanCreditContext'

export default function ContestEntry({ contestId }: { contestId: string }) {
  const { enterContest, canEnterContest, getContest } = useL2Markets()
  const { balance: fcBalance, canEnterContest: canAffordFC } = useFanCredit()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleEnter() {
    setLoading(true)
    setMessage('')

    try {
      // Get contest details
      const contest = await getContest(contestId)
      if (!contest) {
        setMessage('Contest not found')
        return
      }

      // Check eligibility
      const eligibility = await canEnterContest(contestId)
      if (!eligibility.canEnter) {
        setMessage(`Cannot enter: ${eligibility.reason}`)
        return
      }

      // Check FC balance if it's an FC contest
      if (contest.currency === 'FanCoin') {
        const hasBalance = await canAffordFC(contest.entry_fee)
        if (!hasBalance) {
          setMessage('Insufficient FanCredit balance')
          return
        }
      }

      // Enter the contest
      const success = await enterContest({
        contestId: contestId,
        roster: [1, 2, 3, 4, 5], // Your roster selection logic here
      })

      if (success) {
        setMessage('Successfully entered contest!')
      } else {
        setMessage('Failed to enter contest')
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button 
        onClick={handleEnter}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Entering...' : 'Enter Contest'}
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  )
}
```

## Direct SDK Usage (Advanced)

If you need direct access to the SDK instances (not recommended for most use cases):

```tsx
import { useFanCredit } from '@/app/contexts/FanCreditContext'
import { useL2Markets } from '@/app/contexts/L2MarketsContext'

function AdvancedComponent() {
  const { sdk: fcSDK } = useFanCredit()
  const { sdk: marketsSDK } = useL2Markets()

  // Now you have direct access to all SDK methods
  async function doSomething() {
    if (fcSDK && marketsSDK) {
      const wallet = await fcSDK.getWallet('L2_ADDRESS')
      const templates = await marketsSDK.getTemplates()
      // ... more advanced operations
    }
  }
}
```

## Environment Variables

Make sure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_L2_API_URL=http://localhost:1234
NEXT_PUBLIC_DEALER_ADDRESS=L2_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## Auto-refresh

Both SDKs automatically refresh data:
- **FanCredit**: Refreshes balance every 30 seconds when authenticated
- **L2Markets**: Refreshes live contests every 60 seconds

You can also manually refresh anytime using the provided methods.

## Examples in the Codebase

See these files for real-world usage:
- [app/wallet/page.tsx](../app/wallet/page.tsx) - FanCredit balance display
- [app/lobby/page.tsx](../app/lobby/page.tsx) - Live contests listing
