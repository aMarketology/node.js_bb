# BlackBook Markets Integration Guide

Complete integration guide for BlackBook's blockchain-based prediction markets.

**L1 Blockchain API:** `http://localhost:8080` (wallet, transfers, balances)  
**L2 Markets API:** `http://localhost:1234` (prediction markets, prop bets)  
**Next.js App:** `http://localhost:3000` (frontend with real World Cup 2026 events)

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Real Event Data](#real-event-data)
3. [Market Structure](#market-structure)
4. [Fetching Matches & Prop Bets](#fetching-matches--prop-bets)
5. [Creating Custom Prop Bets](#creating-custom-prop-bets)
6. [Betting & Trading](#betting--trading)
7. [Market Resolution](#market-resolution)
8. [Error Handling](#error-handling)

---

## 🔐 Authentication

BlackBook uses **Ed25519 signature-based authentication** matching the L1 blockchain wallet system.

### Signing with Your Wallet

```javascript
import { signMessage, bytesToHex } from '@/lib/blackbook-wallet'

async function authenticateWithWallet(wallet) {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `blackbook-auth:${wallet.address}:${timestamp}`;
  
  // Sign with wallet's private key
  const messageBytes = new TextEncoder().encode(message);
  const signature = signMessage(messageBytes, wallet.secretKey);
  
  // Request session token
  const response = await fetch('http://localhost:1234/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_address: wallet.address,
      timestamp: timestamp,
      signature: bytesToHex(signature),
      public_key: bytesToHex(wallet.publicKey)
    })
  });
  
  const data = await response.json();
  return data.session_token; // Valid for 2.5 minutes
}
```

### Using Session Tokens

```javascript
const sessionToken = await authenticateWithWallet(unlockedWallet);

// Include in all authenticated requests
const headers = {
  'Content-Type': 'application/json',
  'X-Session-Token': sessionToken
};
```

**Note:** Sessions expire after 2.5 minutes. Re-authenticate when you receive `401 Unauthorized`.

---

## ⚽ Real Event Data

All markets are based on **real FIFA World Cup 2026 matches** stored on the blockchain. Events include complete fixture data with venues, teams, and kickoff times.

### Event Data Structure

```typescript
interface Match {
  id: string                    // e.g., "wc2026-001"
  slug: string                  // "mexico-vs-south-africa"
  homeTeam: string              // "Mexico"
  homeTeamCode: string          // "MEX"
  homeTeamFlag: string          // "🇲🇽"
  awayTeam: string              // "South Africa"
  awayTeamCode: string          // "RSA"
  awayTeamFlag: string          // "🇿🇦"
  stage: 'group' | 'round-of-16' | 'quarter-final' | 'semi-final' | 'final'
  group?: string                // "A"
  venue: string                 // "Estadio Azteca"
  city: string                  // "Mexico City"
  kickoff: string               // "2026-06-11T19:00:00Z"
  status: 'upcoming' | 'live' | 'finished'
  // Market data
  homeWinOdds: string           // "0.55" (55% implied probability)
  drawOdds: string              // "0.25"
  awayWinOdds: string           // "0.20"
  volume: string                // "2450000" (BB tokens)
  liquidity: string             // "890000" (BB tokens)
  propBets: PropBet[]           // Array of prop bets
}
```

### Fetching Real Events

**From Next.js API Route:** `GET /api/markets`

```javascript
async function getAllMatches() {
  const response = await fetch('http://localhost:3000/api/markets');
  const data = await response.json();
  
  return data.matches;
  /*
  Returns: {
    matches: [
      {
        id: "wc2026-001",
        slug: "mexico-vs-south-africa",
        homeTeam: "Mexico",
        homeTeamCode: "MEX",
        homeTeamFlag: "🇲🇽",
        awayTeam: "South Africa",
        awayTeamCode: "RSA", 
        awayTeamFlag: "🇿🇦",
        stage: "group",
        group: "A",
        venue: "Estadio Azteca",
        city: "Mexico City",
        kickoff: "2026-06-11T19:00:00Z",
        status: "upcoming",
        homeWinOdds: "0.55",
        drawOdds: "0.25",
        awayWinOdds: "0.20",
        volume: "2450000",
        liquidity: "890000",
        propBets: [...]
      },
      ...
    ],
    count: 104
  }
  */
}
```

**From TypeScript Library:**

```typescript
import { getUpcomingMatches, getFeaturedMatches, getMatchById } from '@/lib/fixtures'

// Get next 10 upcoming matches
const upcoming = getUpcomingMatches(10);

// Get featured matches (high-profile games)
const featured = getFeaturedMatches();

// Get specific match by ID
const match = getMatchById('wc2026-001');
```

---

## 📊 Market Structure

Each match has **multiple betting markets** (prop bets) associated with it.

### Prop Bet Categories

```typescript
interface PropBet {
  id: string                    // "prop-001-1"
  type: 'player' | 'game' | 'special'
  question: string              // "Will Santiago Giménez score?"
  outcomes: string[]            // ["Yes", "No"]
  outcomePrices: string[]       // ["0.35", "0.65"] (probabilities)
  player?: string               // Player name (for player props)
  team?: string                 // Team name
}
```

### Standard Markets (Auto-Generated)

Every World Cup match automatically includes these prop bets:

1. **Match Winner** - Home/Draw/Away
2. **Total Goals** - Over/Under 2.5
3. **Both Teams to Score** - Yes/No
4. **First Half Result** - Home/Draw/Away
5. **Correct Score** - Multiple options (1-0, 2-0, 2-1, etc.)
6. **Total Cards** - Over/Under 4.5
7. **Total Corners** - Over/Under 9.5

### Example: Full Match with Prop Bets

```json
{
  "id": "wc2026-001",
  "slug": "mexico-vs-canada-opening",
  "homeTeam": "Mexico",
  "awayTeam": "Canada",
  "venue": "Estadio Azteca",
  "kickoff": "2026-06-11T18:00:00Z",
  "homeWinOdds": "0.55",
  "drawOdds": "0.25",
  "awayWinOdds": "0.20",
  "propBets": [
    {
      "id": "prop-001-1",
      "type": "player",
      "question": "Will Santiago Giménez score in the first 15 minutes?",
      "outcomes": ["Yes", "No"],
      "outcomePrices": ["0.12", "0.88"],
      "player": "Santiago Giménez",
      "team": "Mexico"
    },
    {
      "id": "prop-001-2",
      "type": "player",
      "question": "Will Alphonso Davies get an assist?",
      "outcomes": ["Yes", "No"],
      "outcomePrices": ["0.35", "0.65"],
      "player": "Alphonso Davies",
      "team": "Canada"
    },
    {
      "id": "prop-001-3",
      "type": "game",
      "question": "Total goals Over/Under 2.5",
      "outcomes": ["Over", "Under"],
      "outcomePrices": ["0.58", "0.42"]
    },
    {
      "id": "prop-001-4",
      "type": "game",
      "question": "Both teams to score?",
      "outcomes": ["Yes", "No"],
      "outcomePrices": ["0.62", "0.38"]
    },
    {
      "id": "prop-001-5",
      "type": "special",
      "question": "Will there be a penalty awarded?",
      "outcomes": ["Yes", "No"],
      "outcomePrices": ["0.28", "0.72"]
    }
  ]
}
```

---

## 🎯 Fetching Matches & Prop Bets

### 1. Get All Matches

**Endpoint:** `GET /api/markets`

```javascript
async function getMatchesWithPropBets() {
  const response = await fetch('http://localhost:3000/api/markets');
  const data = await response.json();
  
  console.log(`Found ${data.count} matches`);
  console.log(`Total prop bets: ${data.matches.reduce((sum, m) => sum + m.propBets.length, 0)}`);
  
  return data.matches;
}
```

### 2. Filter by Stage/Group

```javascript
async function getGroupStageMatches() {
  const response = await fetch('http://localhost:3000/api/markets');
  const { matches } = await response.json();
  
  return matches.filter(m => m.stage === 'group');
}

async function getGroupAMatches() {
  const response = await fetch('http://localhost:3000/api/markets');
  const { matches } = await response.json();
  
  return matches.filter(m => m.group === 'A');
}

async function getKnockoutMatches() {
  const response = await fetch('http://localhost:3000/api/markets');
  const { matches } = await response.json();
  
  return matches.filter(m => ['round-of-16', 'quarter-final', 'semi-final', 'final'].includes(m.stage));
}
```

### 3. Get Match by Slug

**Frontend Route:** `GET /markets/[slug]`

```javascript
// Navigate to specific match page
window.location.href = '/markets/mexico-vs-canada-opening';

// Or use Next.js router
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/markets/wc2026-001');
```

### 4. Filter Prop Bets by Type

```javascript
async function getPlayerProps(matchId) {
  const response = await fetch('http://localhost:3000/api/markets');
  const { matches } = await response.json();
  
  const match = matches.find(m => m.id === matchId);
  return match?.propBets.filter(pb => pb.type === 'player') || [];
}

async function getGameProps(matchId) {
  const response = await fetch('http://localhost:3000/api/markets');
  const { matches } = await response.json();
  
  const match = matches.find(m => m.id === matchId);
  return match?.propBets.filter(pb => pb.type === 'game') || [];
}

async function getSpecialProps(matchId) {
  const response = await fetch('http://localhost:3000/api/markets');
  const { matches } = await response.json();
  
  const match = matches.find(m => m.id === matchId);
  return match?.propBets.filter(pb => pb.type === 'special') || [];
}
```

### 5. Search by Team

```javascript
async function getTeamMatches(teamName) {
  const response = await fetch('http://localhost:3000/api/markets');
  const { matches } = await response.json();
  
  return matches.filter(m => 
    m.homeTeam.toLowerCase().includes(teamName.toLowerCase()) ||
    m.awayTeam.toLowerCase().includes(teamName.toLowerCase())
  );
}

// Example: Get all USA matches
const usaMatches = await getTeamMatches('USA');
```

---

## 📝 Creating Custom Prop Bets

While standard markets are auto-generated, you can create custom prop bets for any World Cup match.

### Create Player Prop

```javascript
async function createPlayerProp(sessionToken, matchId, playerData) {
  const response = await fetch('http://localhost:1234/prop-bets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken
    },
    body: JSON.stringify({
      match_id: matchId,
      type: 'player',
      question: playerData.question,
      outcomes: ['Yes', 'No'],
      player: playerData.player,
      team: playerData.team
    })
  });
  
  return await response.json();
}

// Example: Create Messi goal prop
const prop = await createPlayerProp(sessionToken, 'wc2026-035', {
  question: 'Will Lionel Messi score 2+ goals?',
  player: 'Lionel Messi',
  team: 'Argentina'
});
```

### Create Game Prop

```javascript
async function createGameProp(sessionToken, matchId, question, outcomes) {
  const response = await fetch('http://localhost:1234/prop-bets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken
    },
    body: JSON.stringify({
      match_id: matchId,
      type: 'game',
      question: question,
      outcomes: outcomes
    })
  });
  
  return await response.json();
}

// Example: Create red card prop
const prop = await createGameProp(
  sessionToken,
  'wc2026-015',
  'Will there be a red card in this match?',
  ['Yes', 'No']
);
```

### Create Special/Exotic Prop

```javascript
async function createSpecialProp(sessionToken, matchId, propData) {
  const response = await fetch('http://localhost:1234/prop-bets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken
    },
    body: JSON.stringify({
      match_id: matchId,
      type: 'special',
      question: propData.question,
      outcomes: propData.outcomes
    })
  });
  
  return await response.json();
}

// Example: Penalty shootout prop
const prop = await createSpecialProp(sessionToken, 'wc2026-048', {
  question: 'Will this match go to a penalty shootout?',
  outcomes: ['Yes', 'No']
});

// Example: Hat-trick prop
const prop = await createSpecialProp(sessionToken, 'wc2026-022', {
  question: 'Will any player score a hat-trick?',
  outcomes: ['Yes', 'No']
});
```

---

## 🎲 Betting & Trading

### 1. Get Quote (Read-Only)

**Endpoint:** `POST /quote`

```javascript
async function getQuote(propBetId, outcome, amount) {
  const response = await fetch('http://localhost:1234/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prop_bet_id: propBetId,
      outcome: outcome, // "Yes" or "No" (or other outcome label)
      amount: amount // BB tokens
    })
  });
  
  return await response.json();
  /*
  Returns: {
    tokens: 45.2,
    price_per_token: 0.67,
    fee: 1.2,
    price_impact: 2.3,
    new_price: 0.69
  }
  */
}
```

### 2. Place Bet

**Endpoint:** `POST /predict/session`

```javascript
async function placeBet(sessionToken, propBetId, outcome, amount) {
  const response = await fetch('http://localhost:1234/predict/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken
    },
    body: JSON.stringify({
      prop_bet_id: propBetId,
      outcome: outcome,
      amount: amount
    })
  });
  
  return await response.json();
  /*
  Returns: {
    bet_id: "bet_xyz",
    tokens_received: 45.2,
    avg_price: 0.67,
    fee: 1.2,
    new_odds: { yes: 0.69, no: 0.31 }
  }
  */
}
```

### 3. Example: Bet on Match Winner

```javascript
// Get Mexico vs Canada match
const response = await fetch('http://localhost:3000/api/markets');
const { matches } = await response.json();
const match = matches.find(m => m.id === 'wc2026-001');

// Find the match winner prop bet
const matchWinnerProp = match.propBets.find(pb => pb.question.includes('Who will win'));

// Bet 50 BB on Mexico to win
const bet = await placeBet(sessionToken, matchWinnerProp.id, 'Mexico', 50);
console.log(`Bought ${bet.tokens_received} Mexico tokens @ ${bet.avg_price}`);
```

### 4. Example: Bet on Player Prop

```javascript
// Get player props for match
const playerProps = await getPlayerProps('wc2026-001');

// Find Giménez goal prop
const gimenezProp = playerProps.find(pb => pb.player === 'Santiago Giménez');

// Get quote first
const quote = await getQuote(gimenezProp.id, 'Yes', 20);
console.log(`20 BB buys ${quote.tokens} YES tokens at ${quote.price_per_token} each`);

// Place bet
const bet = await placeBet(sessionToken, gimenezProp.id, 'Yes', 20);
```

### 5. Sell Position

**Endpoint:** `POST /sell/session`

```javascript
async function sellPosition(sessionToken, propBetId, outcome, tokens) {
  const response = await fetch('http://localhost:1234/sell/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken
    },
    body: JSON.stringify({
      prop_bet_id: propBetId,
      outcome: outcome,
      amount: tokens // Number of outcome tokens to sell
    })
  });
  
  return await response.json();
}

// Example: Sell 30 YES tokens
const sale = await sellPosition(sessionToken, 'prop-001-1', 'Yes', 30);
```

### 6. Get User Position

**Endpoint:** `GET /position/:user/:prop_bet_id`

```javascript
async function getPosition(userAddress, propBetId) {
  const response = await fetch(
    `http://localhost:1234/position/${userAddress}/${propBetId}`
  );
  
  return await response.json();
  /*
  Returns: {
    prop_bet_id: "prop-001-1",
    yes_tokens: 50.0,
    no_tokens: 0.0,
    total_invested: 34.5,
    current_value: 45.0,
    unrealized_pnl: 10.5
  }
  */
}
```

---

## ⚖️ Market Resolution

**Only authorized resolvers** can resolve markets after the match concludes.

### Resolve Prop Bet

**Endpoint:** `POST /prop-bets/:id/resolve/session`

```javascript
async function resolvePropBet(sessionToken, propBetId, winningOutcome) {
  const response = await fetch(
    `http://localhost:1234/prop-bets/${propBetId}/resolve/session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        winning_outcome: winningOutcome // "Yes", "No", or other outcome label
      })
    }
  );
  
  return await response.json();
}

// Example: Resolve player prop (Giménez scored)
await resolvePropBet(sessionToken, 'prop-001-1', 'Yes');

// Example: Resolve match winner (Mexico won)
await resolvePropBet(sessionToken, 'prop-001-0', 'Mexico');
```

### Bulk Resolve Match

Resolve all prop bets for a match at once:

```javascript
async function resolveMatch(sessionToken, matchId, results) {
  const response = await fetch(
    `http://localhost:1234/matches/${matchId}/resolve/session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        final_score: results.finalScore, // e.g., "2-1"
        match_winner: results.winner, // "home", "away", or "draw"
        total_goals: results.totalGoals,
        both_scored: results.bothScored,
        first_half_result: results.firstHalfResult,
        total_cards: results.totalCards,
        total_corners: results.totalCorners,
        // Add any player-specific results
        player_results: results.playerResults
      })
    }
  );
  
  return await response.json();
}

// Example: Resolve Mexico vs Canada
await resolveMatch(sessionToken, 'wc2026-001', {
  finalScore: '2-1',
  winner: 'home', // Mexico
  totalGoals: 3,
  bothScored: true,
  firstHalfResult: 'draw',
  totalCards: 5,
  totalCorners: 11,
  playerResults: {
    'Santiago Giménez': { scored: true, assists: 0 },
    'Alphonso Davies': { scored: false, assists: 1 }
  }
});
```

---

## ⚠️ Error Handling

```javascript
async function safeAPICall(apiFunction) {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.response?.status === 401) {
      // Session expired - re-authenticate
      const newToken = await authenticateWithWallet(wallet);
      // Retry with new token
    } else if (error.response?.status === 400) {
      // Bad request - check input validation
      const errorData = await error.response.json();
      console.error('Validation error:', errorData.error);
    } else if (error.response?.status === 404) {
      // Market/prop bet not found
      console.error('Resource does not exist');
    } else if (error.response?.status === 403) {
      // Not authorized (e.g., trying to resolve without permission)
      console.error('Not authorized for this action');
    } else {
      // Other errors
      console.error('API error:', error);
    }
    throw error;
  }
}
```

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check payload format/validation |
| 401 | Unauthorized | Re-authenticate (session expired) |
| 403 | Forbidden | User not authorized for this action |
| 404 | Not Found | Market/prop bet doesn't exist |
| 500 | Server Error | Retry with exponential backoff |

---

## 🎯 Complete Example: World Cup Betting Flow

```javascript
import { unlockWallet } from '@/lib/blackbook-wallet'
import { getMatchById } from '@/lib/fixtures'

// 1. Unlock wallet
const wallet = await unlockWallet(
  password,
  encryptedBlob,
  nonce,
  authSalt,
  vaultSalt
);

// 2. Authenticate with L2 markets
const sessionToken = await authenticateWithWallet(wallet);

// 3. Find upcoming match
const match = getMatchById('wc2026-001'); // Mexico vs Canada
console.log(`${match.homeTeam} vs ${match.awayTeam} at ${match.venue}`);

// 4. Get all prop bets for this match
const response = await fetch('http://localhost:3000/api/markets');
const { matches } = await response.json();
const fullMatch = matches.find(m => m.id === match.id);

console.log(`${fullMatch.propBets.length} betting markets available`);

// 5. Bet on match winner (Mexico)
const matchWinnerProp = fullMatch.propBets.find(pb => pb.type === 'game' && pb.question.includes('win'));
const winnerBet = await placeBet(sessionToken, matchWinnerProp.id, 'Mexico', 100);
console.log(`Bet 100 BB on Mexico @ ${winnerBet.avg_price}`);

// 6. Bet on player prop (Giménez to score)
const playerProps = fullMatch.propBets.filter(pb => pb.type === 'player');
const gimenezProp = playerProps.find(pb => pb.player === 'Santiago Giménez');
const playerBet = await placeBet(sessionToken, gimenezProp.id, 'Yes', 50);
console.log(`Bet 50 BB on Giménez to score @ ${playerBet.avg_price}`);

// 7. Check position
const position = await getPosition(wallet.address, matchWinnerProp.id);
console.log(`Current value: ${position.current_value} BB (PnL: ${position.unrealized_pnl} BB)`);

// 8. After match ends, winners can claim
// (Resolution happens automatically or via authorized resolver)
```

---

## 📚 Additional Resources

- **Real Events:** See [lib/fixtures.ts](lib/fixtures.ts) for complete World Cup 2026 schedule
- **API Routes:** Check [app/api/markets/route.ts](app/api/markets/route.ts) for market data structure
- **Market Pages:** See [app/markets/[slug]/page.tsx](app/markets/[slug]/page.tsx) for frontend integration
- **Wallet SDK:** Use [lib/blackbook-wallet.ts](lib/blackbook-wallet.ts) for signing and authentication
- **Test with:** 104 real World Cup matches, 728+ prop bets across all events

---

**Questions?** Check the codebase for implementation details or open an issue.
