# Dealer Admin Interface

## Overview
The Dealer Admin Panel (`/dealer`) provides full administrative access to the market lifecycle, allowing activation, management, and resolution of prediction markets.

## Architecture

### Authentication
- Uses **dealer private key** from `process.env.DEALER_PRIVATE_KEY`
- Stored securely in `.env` file (server-side only)
- Accessed via `/api/dealer/credentials` API route
- SDK initialized with dealer credentials on page load

### API Routes

#### 1. `/api/dealer/credentials` (GET)
Returns dealer private key and L2 address from environment variables.

**Response:**
```json
{
  "privateKey": "hex_encoded_private_key",
  "address": "L2_ADDRESS"
}
```

**Security:** Only accessible server-side, never exposed to client.

#### 2. `/api/dealer/pending-markets` (GET)
Returns Supabase markets that haven't been activated on L2 yet.

**Response:**
```json
{
  "pending": [/* array of pending markets */],
  "total": 354,        // Total markets in Supabase
  "activated": 7       // Markets already on L2
}
```

**Logic:**
1. Fetch all markets from Supabase
2. Fetch all markets from L2 blockchain
3. Filter to only markets NOT on L2 yet

## Features

### 1. Market Statistics Dashboard
- **Total Markets**: All markets in Supabase database
- **Activated on L2**: Markets with ≥100 BB liquidity on blockchain
- **Pending Activation**: Markets awaiting dealer funding

### 2. Pending Markets Management
**View unfunded Supabase markets:**
- Title, teams, closing date, creation date
- Shows first 20 pending markets
- Click "Activate" to fund on L2

**Activation Process:**
1. Select market from pending list
2. Set initial liquidity (minimum 100 BB)
3. Click "Activate Market"
4. SDK calls `createMarket()` on L2 blockchain
5. Market becomes tradeable with specified liquidity

### 3. Active Markets Management
**View L2-funded markets:**
- Market title, status, liquidity, volume
- Real-time data from L2 blockchain

**Admin Actions:**
- **Pause**: Temporarily disable trading
- **Resume**: Re-enable trading after pause
- **Resolve**: Declare winning outcome (home/away/draw)

### 4. Action Feedback
- Success/error messages for all operations
- Real-time loading states
- Console logging for debugging

## SDK Methods Used

### Market Activation
```javascript
await sdk.createMarket({
  id: market.id,
  title: market.title,
  description: market.description,
  closes_at: market.closes_at,
  initial_liquidity: 1000,  // BB amount
  home_team: market.home_team,
  away_team: market.away_team
})
```

### Market Resolution
```javascript
await sdk.resolveMarket(marketId, outcome)  // outcome: 'home', 'away', 'draw'
```

### Market Pause/Resume
```javascript
await sdk.pauseMarket(marketId)
await sdk.resumeMarket(marketId)
```

### Get Active Markets
```javascript
const markets = await sdk.getActiveEvents()  // Returns markets with ≥100 BB liquidity
```

## Current Market Status (Example)

**Supabase Database:**
- Total: 354 markets (mostly 2026 World Cup matches)

**L2 Blockchain:**
- Active: 7 markets (test markets with liquidity)
  - E2E Test
  - Bet Test
  - Test Match
  - UFC Test
  - Integration Test
  - Stress Test
  - Liquidity Test

**Pending:**
- 347 markets awaiting dealer activation

## Usage Flow

### Activating a World Cup Market
1. Navigate to `/dealer`
2. Scroll to "Pending Markets" section
3. Find market (e.g., "Argentina vs Brazil - 2026 FIFA World Cup")
4. Click "Activate" button
5. Modal opens:
   - Review market details
   - Set initial liquidity (e.g., 1000 BB)
   - Click "Activate Market"
6. SDK creates market on L2 with specified liquidity
7. Market appears in "Active Markets" section
8. Market becomes visible on `/markets` page for users

### Resolving a Market
1. Navigate to `/dealer`
2. Scroll to "Active Markets" section
3. Find market to resolve
4. Click "Resolve" button
5. Enter winning outcome: "home", "away", or "draw"
6. SDK resolves market on L2
7. Winning bettors can claim payouts

## Security Notes

- **Private Key Protection**: Never commit `.env` file to git
- **Server-Side Only**: Credentials API route uses `export const dynamic = 'force-dynamic'`
- **Admin Access**: No authentication currently - consider adding access control
- **Rate Limiting**: Consider adding rate limits to prevent abuse

## Environment Variables Required

```env
DEALER_PRIVATE_KEY=your_hex_encoded_private_key_here
DEALER_L2_ADDRESS=L2_A75E13F6DEED980C85ADF2D011E72B2D2768CE8D
```

## Next Steps

### Recommended Enhancements
1. **Add authentication**: Password protect dealer page
2. **Batch activation**: Activate multiple markets at once
3. **Liquidity management**: Add/remove liquidity from existing markets
4. **Market editing**: Update closes_at, descriptions, etc.
5. **Analytics**: Track activation history, resolution stats
6. **Audit log**: Record all dealer actions with timestamps

### Testing Checklist
- [ ] Initialize dealer SDK with env credentials
- [ ] Load pending markets from Supabase
- [ ] Activate market with 1000 BB liquidity
- [ ] Verify market appears on `/markets` page
- [ ] Place test bet on activated market
- [ ] Pause market (trading should stop)
- [ ] Resume market (trading should restart)
- [ ] Resolve market with winning outcome
- [ ] Verify payouts distributed correctly

## Troubleshooting

### "Failed to get dealer credentials"
- Check `.env` file exists in project root
- Verify `DEALER_PRIVATE_KEY` is set
- Restart Next.js dev server to reload env vars

### "Market activation failed"
- Check dealer has sufficient BB balance on L2
- Verify market ID doesn't already exist on L2
- Check closes_at is in the future
- Review console logs for specific error

### "Pending markets not loading"
- Check Supabase connection (NEXT_PUBLIC_SUPABASE_URL)
- Verify markets table exists and has data
- Check L2 node is accessible (https://l2node.prism.bet/markets)

### "Active markets not displaying"
- Verify markets have ≥100 BB liquidity (MIN_ACTIVE_LIQUIDITY)
- Check L2 node connection
- Review SDK getActiveEvents() response in console
