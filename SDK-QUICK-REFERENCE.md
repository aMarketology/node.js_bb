# SDK Quick Reference Card

## 🎯 Import Hooks

```tsx
import { useFanCredit } from '@/app/contexts/FanCreditContext'
import { useL2Markets } from '@/app/contexts/L2MarketsContext'
```

## 💰 FanCredit Hook

```tsx
const {
  balance,              // { available, locked, total, address }
  transactions,         // FC transaction history array
  loading,              // boolean
  error,                // string | null
  refreshBalance,       // () => Promise<void>
  refreshTransactions,  // () => Promise<void>
  canEnterContest,      // (entryFee: number) => Promise<boolean>
  formatFC              // (amount: number) => string
} = useFanCredit()
```

### Common Patterns

```tsx
// Display balance
<p>{formatFC(balance?.available || 0)}</p>

// Check if can afford
const canAfford = await canEnterContest(100)

// Show transactions
{transactions.map(tx => (
  <div key={tx.id}>{tx.description}: {formatFC(tx.amount)}</div>
))}
```

## 🎮 L2Markets Hook

```tsx
const {
  contests,           // All contests array
  liveContests,       // Live contests only
  userContests,       // User's contests
  loading,            // boolean
  error,              // string | null
  refreshContests,    // () => Promise<void>
  refreshLiveContests,// () => Promise<void>
  refreshUserContests,// () => Promise<void>
  getContest,         // (id: string) => Promise<Contest>
  enterContest,       // (params) => Promise<boolean>
  canEnterContest,    // (id: string) => Promise<Eligibility>
  formatAmount        // (amount: number, currency: string) => string
} = useL2Markets()
```

### Common Patterns

```tsx
// Display live contests
{liveContests.map(c => (
  <div key={c.contest_id}>
    {c.name} - {formatAmount(c.entry_fee, c.currency)}
  </div>
))}

// Check eligibility
const eligibility = await canEnterContest('contest_123')
if (eligibility.canEnter) { /* can enter */ }

// Enter contest
const success = await enterContest({
  contestId: 'contest_123',
  roster: [1, 2, 3, 4, 5],
  signature: 'optional'
})
```

## 📊 Contest Object

```typescript
{
  contest_id: string
  name?: string
  status: string            // 'LIVE', 'DRAFT', 'LOCKED', 'RESOLVED'
  currency: string          // 'FanCoin' or 'BlackBook'
  entry_fee: number
  max_participants: number
  participants?: any[]
  total_pool?: number
  spotsAvailable?: number   // Computed
  isFull?: boolean          // Computed
  totalPrizePool?: number   // Computed
  currencySymbol?: string   // 'FC' or 'BB'
}
```

## 🎨 Styling Tips

```tsx
// FC (Purple theme)
className="text-purple-400 bg-purple-900/30"

// BB (Green theme)
className="text-green-400 bg-green-900/30"

// Live contests (Cyan theme)
className="text-prism-cyan border-prism-cyan"
```

## ⚡ Auto-Refresh

- **FC Balance**: Every 30s when authenticated
- **Live Contests**: Every 60s automatically
- Manual: Call `refreshBalance()` or `refreshContests()`

## 🔐 Auth Integration

```tsx
import { useAuth } from '@/app/contexts/AuthContext'

const { isAuthenticated, activeWalletData } = useAuth()

// SDKs automatically load when:
// - isAuthenticated = true
// - activeWalletData.l2Address exists
```

## 📝 Complete Example

```tsx
'use client'

import { useFanCredit } from '@/app/contexts/FanCreditContext'
import { useL2Markets } from '@/app/contexts/L2MarketsContext'

export default function MyComponent() {
  const { balance, formatFC, canEnterContest: canAffordFC } = useFanCredit()
  const { liveContests, enterContest, canEnterContest } = useL2Markets()

  async function handleEnter(contestId: string, entryFee: number, currency: string) {
    // Check if FC contest and if can afford
    if (currency === 'FanCoin') {
      const canAfford = await canAffordFC(entryFee)
      if (!canAfford) {
        alert('Insufficient FC')
        return
      }
    }

    // Check general eligibility
    const eligible = await canEnterContest(contestId)
    if (!eligible.canEnter) {
      alert(eligible.reason)
      return
    }

    // Enter
    const success = await enterContest({
      contestId,
      roster: [1, 2, 3, 4, 5]
    })

    alert(success ? 'Entered!' : 'Failed')
  }

  return (
    <div>
      <p>FC: {formatFC(balance?.available || 0)}</p>
      {liveContests.map(c => (
        <button key={c.contest_id} onClick={() => handleEnter(c.contest_id, c.entry_fee, c.currency)}>
          Enter {c.name}
        </button>
      ))}
    </div>
  )
}
```

## 🚀 Pages Using SDKs

- ✅ `/wallet` - FC balance & transactions
- ✅ `/lobby` - Live L2 contests
- 📄 See `SDKExampleComponent.tsx` for full example

## 🌐 Environment Variables

```bash
NEXT_PUBLIC_L2_API_URL=http://localhost:1234
NEXT_PUBLIC_DEALER_ADDRESS=L2_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D
```

## 📚 Full Docs

- **Integration Guide**: `SDK-INTEGRATION-GUIDE.md`
- **Implementation Summary**: `SDK-IMPLEMENTATION-SUMMARY.md`
- **Example Component**: `app/components/SDKExampleComponent.tsx`
