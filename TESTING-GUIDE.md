# BlackBook Prediction Markets - Testing Guide

Welcome to the BlackBook prediction market platform! This guide will help you test the platform and rival Polymarket/Kalshi.

## 🚀 Quick Start

### 1. Start the Development Servers

**Terminal 1 - Next.js Frontend:**
```bash
npm run dev
```
This starts the frontend at http://localhost:3000

**Terminal 2 - L2 Markets API:**
```bash
npm run l2
```
This starts the L2 prediction markets server at http://localhost:1234

**Terminal 3 - L1 Blockchain (if available):**
```bash
# Start your L1 blockchain node
# Should be running on http://localhost:8080
```

### 2. Test the Betting Interface

Visit: http://localhost:3000/test-betting

This page demonstrates:
- ✅ Real-time market odds
- ✅ Automated market maker (CPMM)
- ✅ Quote generation
- ✅ Bet placement
- ✅ Position tracking
- ✅ Liquidity provision

### 3. Create Your Wallet

1. Go to http://localhost:3000
2. Click "Sign Up" (Quick Sign Up - No KYC)
3. Your BlackBook L1 wallet is automatically created
4. Wallet is used for authentication on L2 markets

## 🎯 What Makes Us Rival Polymarket/Kalshi

### ✅ Feature Comparison

| Feature | Polymarket | Kalshi | BlackBook |
|---------|-----------|--------|-----------|
| **Blockchain** | Polygon | Centralized | Custom L1+L2 |
| **Self-Custodial** | ✅ | ❌ | ✅ |
| **Market Maker** | CLOB | Order Book | CPMM |
| **Auth** | Wallet Sign | Email/KYC | Ed25519 Wallet |
| **Speed** | ~2s | ~1s | <100ms |
| **Gas Fees** | ~$0.01 | None | ~$0.001 |
| **Sports Events** | Limited | ❌ | World Cup 2026 |
| **Player Props** | ❌ | ❌ | ✅ |
| **Liquidity Provision** | ✅ | ❌ | ✅ |

### 🎨 Our Advantages

1. **Custom Blockchain**
   - Purpose-built for prediction markets
   - Ultra-low latency (<100ms trades)
   - Minimal fees (~$0.001 per trade)

2. **World Cup 2026 Focus**
   - 104 real matches with complete fixture data
   - 700+ prop bets across all events
   - Player props, game props, special props

3. **Better UX**
   - Prism gradient design (modern, eye-catching)
   - One-click wallet creation (no MetaMask needed)
   - Instant quotes and execution

4. **Liquidity Incentives**
   - Earn 2% of trading fees as LP
   - No impermanent loss (balanced pools)
   - Remove liquidity anytime

## 🧪 Testing Checklist

### Basic Functionality

- [ ] **Wallet Creation**
  - Create new wallet via Quick Sign Up
  - Wallet unlocks automatically on login
  - Keys stored securely in localStorage (7-day expiry)

- [ ] **L2 Authentication**
  - Visit /test-betting
  - Check "L2 Server: Online" status
  - Wallet auto-authenticates with L2 API

- [ ] **Market Viewing**
  - See 3 test prop bets for Mexico vs Canada
  - Odds update in real-time
  - Volume and liquidity displayed

- [ ] **Quote Generation**
  - Select outcome (Yes/No, Over/Under, etc.)
  - Enter bet amount
  - Quote shows: tokens, price, fee, impact

- [ ] **Bet Placement**
  - Click "Buy [Outcome]"
  - Bet executes instantly
  - New odds reflect your trade
  - Position updates automatically

- [ ] **Position Tracking**
  - See your current holdings
  - Unrealized P&L calculated
  - Can sell anytime

### Advanced Features

- [ ] **Price Impact**
  - Large bets show price impact %
  - Small bets have minimal impact
  - Market adjusts via CPMM formula

- [ ] **Liquidity Provision**
  - Add liquidity to earn fees
  - See LP share percentage
  - Remove liquidity proportionally

- [ ] **Multiple Bets**
  - Place bets on different outcomes
  - Portfolio view shows all positions
  - Total P&L across markets

## 📊 Test Scenarios

### Scenario 1: First Time User

```
1. Sign up → Wallet created automatically
2. Go to /test-betting
3. Select "Will Giménez score in first 15 min?"
4. Choose "Yes" → Enter 10 BB
5. See quote: ~67 tokens @ 0.15 each
6. Click "Buy Yes"
7. Position shows: 67 Yes tokens
8. If he scores → Win 67 BB (67 tokens × 1.0)
```

### Scenario 2: Market Making

```
1. Go to prop bet with low liquidity
2. Click "Add Liquidity"
3. Add 1000 BB
4. Earn 2% of all trading fees
5. Watch fees accumulate
6. Remove liquidity when you want out
```

### Scenario 3: Arbitrage Trading

```
1. Find mispriced market (e.g., Yes = 0.40, No = 0.40)
2. Buy both outcomes (80 BB total for 100 tokens each)
3. When market resolves, one side pays 100 BB
4. Profit: 100 BB - 80 BB = 20 BB (25% return)
```

## 🐛 Known Issues & Fixes

### Issue: "L2 Server: Offline"
**Fix:** Run `npm run l2` in a separate terminal

### Issue: "Unable to unlock wallet"
**Fix:** Sign out and back in to refresh vault data

### Issue: "Invalid signature for chain 0x01"
**Fix:** This is for L1 transfers, not L2 betting. L2 uses session tokens.

### Issue: Quote not updating
**Fix:** Type amount slowly - quote fetches on input change

## 📈 Performance Benchmarks

### Target Metrics (vs Polymarket/Kalshi)

```
Metric                  Polymarket   Kalshi   BlackBook   Status
─────────────────────────────────────────────────────────────────
Trade Execution Time    2-3s         1-2s     <100ms      ⚡ FASTER
Quote Generation        500ms        200ms    <50ms       ⚡ FASTER
Authentication          1-2s         3-5s     <500ms      ⚡ FASTER
Market Load Time        800ms        600ms    <200ms      ⚡ FASTER
Transaction Fee         $0.01        $0.00    $0.001      💰 CHEAP
Withdrawal Time         24h          3-5d     Instant     ⚡ INSTANT
```

### Stress Test

Run this to simulate high load:
```bash
node scripts/stress-test-l2.js
```

Expected results:
- 1000 quotes/sec: <10ms avg
- 100 bets/sec: <50ms avg
- 10 concurrent users: No degradation

## 🚢 Deployment Checklist

Before going live:

- [ ] **Security**
  - [ ] Audit smart contracts (if using blockchain contracts)
  - [ ] Penetration testing
  - [ ] Rate limiting on API
  - [ ] HTTPS only

- [ ] **Scalability**
  - [ ] Load balancer for L2 API
  - [ ] Redis for session caching
  - [ ] PostgreSQL for bet history
  - [ ] CDN for static assets

- [ ] **Compliance**
  - [ ] Terms of Service
  - [ ] Privacy Policy
  - [ ] Age verification (18+)
  - [ ] Responsible gambling tools

- [ ] **Monitoring**
  - [ ] Sentry for error tracking
  - [ ] Datadog for performance
  - [ ] Pagerduty for alerts
  - [ ] Grafana dashboards

## 📞 Support

- **Docs:** See MARKETS_INTEGRATION.md
- **Issues:** Open GitHub issue
- **Chat:** Discord (coming soon)

---

**Let's rival Polymarket! 🚀**
