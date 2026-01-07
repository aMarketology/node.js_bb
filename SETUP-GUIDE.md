# Prism Prediction Market - Setup Guide

## 🎨 Prism Theme Complete

Your World Cup 2026 prediction market now features the full **Prism** color palette:
- 🔷 Teal (#00CED1)
- 💛 Gold (#FFD700)  
- ❤️ Red (#FF4757)
- 🧡 Orange (#FF6B35)
- 💜 Purple (#8B5CF6)
- 💗 Pink (#EC4899)
- 💙 Blue (#3B82F6)

## 🏆 Real World Cup 2026 Fixtures

The site now includes **36+ real group stage matches** from the official FIFA World Cup 2026 schedule:
- All 12 groups (A-L)
- 48 competing nations
- 16 host cities across USA, Canada, and Mexico
- Accurate dates (June 11-27, 2026)
- Real venues and stadiums

## 🔗 Next Steps: Blockchain & Database Integration

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create `.env.local` from the example:
   ```bash
   cp .env.local.example .env.local
   ```
4. Add your Supabase credentials to `.env.local`

### 3. Create Database Tables

Run the SQL schema from [lib/supabase.ts](lib/supabase.ts) in your Supabase SQL editor:
- `user_profiles` - User accounts and stats
- `bet_records` - All user bets
- `match_stats` - Live match betting pools

### 4. Implement Prism Blockchain

The blockchain integration is scaffolded in [lib/blockchain.ts](lib/blockchain.ts):

**Key Functions Ready:**
- `connectWallet()` - Connect MetaMask/WalletConnect
- `placeBet()` - Submit bet to blockchain
- `getMarket()` - Read market odds
- `claimWinnings()` - Claim payouts

**TODO:**
1. Deploy your Prism smart contract
2. Update `NEXT_PUBLIC_PRISM_CONTRACT_ADDRESS` in `.env.local`
3. Implement contract interactions (replace TODOs in blockchain.ts)
4. Add Web3 provider (ethers.js or web3.js)

### 5. Connect Components

Create wallet connection UI:

```typescript
// Example usage in a component
import { prismBlockchain } from '@/lib/blockchain'
import { signInWithWallet } from '@/lib/supabase'

async function handleConnect() {
  const address = await prismBlockchain.connectWallet()
  if (address) {
    await signInWithWallet(address)
  }
}
```

## 📊 Data Flow

```
User Action → Blockchain (Prism) → Supabase (History)
     ↓              ↓                    ↓
  UI Update    Smart Contract       Database
```

1. **Place Bet:** Blockchain transaction first
2. **Record:** Save to Supabase after confirmation
3. **Display:** Real-time updates via Supabase subscriptions

## 🎯 Current Features

✅ Prism color theme with gradients  
✅ Real World Cup 2026 fixtures  
✅ 36+ group stage matches  
✅ Dynamic match cards with odds  
✅ Blockchain integration structure  
✅ Supabase database schema  
✅ Authentication framework  

## 🚀 Next Development Priorities

1. **Wallet Connection UI** - Add connect button to Navigation
2. **Bet Modal** - Create betting interface for match cards
3. **User Dashboard** - Display user's bets and winnings
4. **Live Odds** - Real-time odds updates
5. **Leaderboard** - Top predictors
6. **Match Details** - Individual match pages

## 🔮 Prism Smart Contract

You'll need to deploy a contract with these functions:

```solidity
function placeBet(uint256 matchId, uint8 prediction) payable
function getMarket(uint256 matchId) view returns (Market)
function resolveMarket(uint256 matchId, uint8 result) onlyAdmin
function claimWinnings(uint256 betId)
```

## 📱 File Structure

```
app/
├── page.tsx           # Homepage with featured matches
├── layout.tsx         # Root layout
├── globals.css        # Prism styles
└── components/
    ├── Navigation.tsx # Top nav with logo
    └── Footer.tsx     # Footer with color legend

lib/
├── fixtures.ts        # 36+ World Cup matches
├── blockchain.ts      # Prism blockchain integration
└── supabase.ts        # Database & auth
```

## 🎨 Customization

All Prism colors are defined in:
- `tailwind.config.ts` - Tailwind classes
- `app/globals.css` - CSS utilities

Add new colors by extending the palette in both files.

## 🌐 Host Cities

16 stadiums across 3 countries:

**🇺🇸 USA:** Los Angeles, New York/NJ, Dallas, Houston, Atlanta, Philadelphia, Seattle, Kansas City, Miami, Boston, San Francisco

**🇲🇽 Mexico:** Mexico City, Guadalajara, Monterrey

**🇨🇦 Canada:** Toronto, Vancouver

---

**Need Help?** Check the TODO comments in `lib/blockchain.ts` and `lib/supabase.ts` for integration points.

**World Cup 2026 kicks off June 11, 2026! ⚽🏆**
