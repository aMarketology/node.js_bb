/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MARKETS SDK - BlackBook L2 Prediction Markets
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Frontend SDK for loading and betting on L2 prediction markets.
 * 
 * NOTE: This SDK pulls market data from the L2 server, NOT Supabase.
 *       Your frontend already has direct Supabase access for market metadata.
 *       This SDK focuses on L2 state: prices, pools, positions, and trading.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         MARKET LIFECYCLE                                │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  pending  →  active  →  frozen  →  resolved                            │
 * │     │           │          │           │                                │
 * │  awaiting    trading    trading     payouts                            │
 * │  liquidity   enabled    halted     complete                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * Usage:
 * 
 *   import { MarketsSDK } from './markets-sdk.js';
 * 
 *   const markets = new MarketsSDK({
 *     l2Url: 'http://localhost:1234',
 *     address: 'user-wallet-address',
 *     signer: async (msg) => wallet.sign(msg)
 *   });
 * 
 *   // Load markets from L2
 *   const allMarkets = await markets.getAll();
 *   const market = await markets.getMarket('market-id');
 * 
 *   // Place a bet
 *   await markets.bet('market-id', 0, 100);
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// MARKET STATUS CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const MarketStatus = {
  PENDING: 'pending',     // Created but awaiting initial liquidity
  ACTIVE: 'active',       // Trading is open
  FROZEN: 'frozen',       // Trading halted (awaiting resolution)
  RESOLVED: 'resolved',   // Outcome determined, payouts complete
  CANCELLED: 'cancelled'  // Market voided, refunds issued
};

export const MarketType = {
  MAIN: 'main',           // Primary event market
  USER_PROP: 'user_prop', // User-created prop bet
  PROP: 'prop'            // Official prop bet
};

export const TradingType = {
  CPMM: 'cpmm',           // Constant Product Market Maker (AMM)
  ORDERBOOK: 'orderbook'  // Traditional order book
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SDK CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class MarketsSDK {
  constructor(config) {
    // L2 connection (market data + trading)
    this.l2Url = (config.l2Url || 'http://localhost:1234').replace(/\/$/, '');
    this.address = config.address;
    this.signer = config.signer;
  }

  /**
   * Recursively sort object keys alphabetically.
   * CRITICAL: L2 Rust server uses serde_json which serializes keys alphabetically.
   * Frontend MUST match this format for signature verification to pass.
   */
  sortKeysAlphabetically(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(item => this.sortKeysAlphabetically(item));
    
    return Object.keys(obj)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = this.sortKeysAlphabetically(obj[key]);
        return sorted;
      }, {});
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD MARKETS FROM L2 (Server-side filtered)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all ACTIVE markets (trading open)
   * Server returns only active markets at /markets
   */
  async getActive() {
    const res = await this.l2Get('/markets');
    const markets = res.markets || [];
    return markets; // Already enriched by server
  }

  /**
   * Get all PENDING markets (awaiting liquidity)
   * Server-side filtered
   */
  async getPending() {
    const res = await this.l2Get('/markets/pending');
    const markets = res.markets || [];
    return markets;
  }

  /**
   * Get all FROZEN markets (trading halted, awaiting resolution)
   * Server-side filtered
   */
  async getFrozen() {
    const res = await this.l2Get('/markets/frozen');
    const markets = res.markets || [];
    return markets;
  }

  /**
   * Get all RESOLVED markets (completed)
   * Server-side filtered and sorted
   * @param {object} options - { sort: 'closes_at'|'created_at', order: 'asc'|'desc' }
   */
  async getResolved(options = {}) {
    const params = new URLSearchParams();
    if (options.sort) params.append('sort', options.sort);
    if (options.order) params.append('order', options.order);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await this.l2Get(`/markets/resolved${query}`);
    const markets = res.markets || [];
    return markets;
  }

  /**
   * Get all markets (active only - use specific methods for other statuses)
   * Alias for getActive()
   */
  async getAll() {
    return this.getActive();
  }

  /**
   * Get all markets - alias for getAll() (test compatibility)
   */
  async getMarkets() {
    return this.getAll();
  }

  /**
   * Get markets by single status
   * @param {string} status - 'pending', 'active', 'frozen', 'resolved'
   */
  async getByStatus(status) {
    switch (status) {
      case MarketStatus.ACTIVE: return this.getActive();
      case MarketStatus.PENDING: return this.getPending();
      case MarketStatus.FROZEN: return this.getFrozen();
      case MarketStatus.RESOLVED: return this.getResolved();
      default: return [];
    }
  }

  /**
   * Get multiple status filters at once
   * @param {string[]} statuses - Array of status values
   */
  async getByStatuses(statuses) {
    const results = await Promise.all(
      statuses.map(status => this.getByStatus(status))
    );
    return results.flat();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SINGLE MARKET
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get single market by ID with live prices and prop bets from L2
   * @param {string} marketId - Market ID
   */
  async getMarket(marketId) {
    const res = await this.l2Get(`/market/${marketId}`);
    if (!res.market) return null;
    
    return {
      ...res.market,
      prices: res.prices || [],
      props: res.props || [],
      propsCount: res.props_count || 0
    };
  }

  /**
   * Get prop bets for a market (included in getMarket, but can fetch separately)
   * @param {string} marketId - Parent market ID
   */
  async getProps(marketId) {
    const market = await this.getMarket(marketId);
    return market ? market.props : [];
  }

  /**
   * Create a prop bet for an existing market
   * @param {string} parentMarketId - Parent market ID
   * @param {object} propData - { title, description, outcomes, initialLiquidity, closesAt, resolutionCriteria }
   */
  async createProp(parentMarketId, propData) {
    if (!this.address || !this.signer) {
      throw new Error('Wallet not connected. Set address and signer.');
    }

    const tx = {
      title: propData.title,
      description: propData.description,
      outcomes: propData.outcomes,
      initial_liquidity: propData.initialLiquidity,
      closes_at: propData.closesAt,
      resolution_criteria: propData.resolutionCriteria,
      wallet_address: this.address,
      timestamp: Date.now()
    };

    const message = `CREATE_PROP:${parentMarketId}:${tx.title}:${this.address}:${tx.timestamp}`;
    const signature = await this.signer(message);
    
    const payload = {
      ...tx,
      signature: signature,
      l2_public_key: 'placeholder' // Your L1 wallet should provide this
    };

    const res = await this.l2Post(`/market/${parentMarketId}/prop/create`, payload);
    
    return {
      success: res.success !== false,
      propId: res.prop_id,
      parentMarketId: res.parent_market_id,
      liquidityProvided: res.liquidity_provided,
      message: res.message
    };
  }

  /**
   * Get live prices for a market
   * @param {string} marketId - Market ID
   */
  async getPrices(marketId) {
    const res = await this.l2Get(`/cpmm/prices/${marketId}`);
    return res.prices || [];
  }

  /**
   * Get pool state (reserves, liquidity)
   * @param {string} marketId - Market ID
   */
  async getPoolState(marketId) {
    const res = await this.l2Get(`/cpmm/pool/${marketId}`);
    return {
      reserves: res.reserves || [],
      k: res.k || 0,
      liquidity: res.liquidity || 0,
      prices: res.prices || []
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BETTING / TRADING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get a price quote before betting
   * @param {string} marketId - Market ID
   * @param {number} outcomeIndex - Which outcome (0, 1, etc.)
   * @param {number} amount - Amount to spend
   */
  async getQuote(marketId, outcomeIndex, amount) {
    const res = await this.l2Get(`/quote/${marketId}/${outcomeIndex}/${amount}`);
    return {
      marketId,
      outcomeIndex,
      amount,
      shares: res.shares || 0,
      avgPrice: res.avg_price || res.avgPrice || 0,
      priceImpact: res.price_impact || res.priceImpact || 0,
      fee: res.fee || 0,
      total: res.total || amount,
      // Helpful for UI
      effectivePrice: amount / (res.shares || 1),
      maxPayout: res.shares || 0,
      potentialProfit: (res.shares || 0) - amount
    };
  }

  /**
   * Place a bet (buy outcome shares)
   * @param {string} marketId - Market ID
   * @param {number} outcomeIndex - Which outcome (0 = Yes/first, 1 = No/second)
   * @param {number} amount - Amount to spend
   */
  async bet(marketId, outcomeIndex, amount) {
    if (!this.address || !this.signer) {
      throw new Error('Wallet not connected. Set address and signer.');
    }
    
    const tx = {
      action: 'buy',
      wallet: this.address,
      market_id: marketId,
      outcome_index: outcomeIndex,
      amount,
      timestamp: Date.now()
    };
    
    // CRITICAL: Sort keys alphabetically before signing (L2 Rust server compatibility)
    const sortedTx = this.sortKeysAlphabetically(tx);
    const signature = await this.signer(JSON.stringify(sortedTx));
    const signed = { tx: sortedTx, signature, signer: this.address };
    
    const res = await this.l2Post('/cpmm/buy', signed);
    
    return {
      success: res.success !== false,
      shares: res.shares || 0,
      avgPrice: res.avg_price || 0,
      newPrices: res.new_prices || res.prices || [],
      txHash: res.tx_hash,
      // For UI
      spent: amount,
      maxPayout: res.shares || 0
    };
  }

  /**
   * Sell outcome shares
   * @param {string} marketId - Market ID
   * @param {number} outcomeIndex - Which outcome
   * @param {number} shares - Number of shares to sell
   */
  async sell(marketId, outcomeIndex, shares) {
    if (!this.address || !this.signer) {
      throw new Error('Wallet not connected');
    }
    
    const tx = {
      action: 'sell',
      wallet: this.address,
      market_id: marketId,
      outcome_index: outcomeIndex,
      shares,
      timestamp: Date.now()
    };
    
    // CRITICAL: Sort keys alphabetically before signing (L2 Rust server compatibility)
    const sortedTx = this.sortKeysAlphabetically(tx);
    const signature = await this.signer(JSON.stringify(sortedTx));
    const signed = { tx: sortedTx, signature, signer: this.address };
    
    const res = await this.l2Post('/cpmm/sell', signed);
    
    return {
      success: res.success !== false,
      shares: res.shares || shares,
      received: res.received || 0,
      avgPrice: res.avg_price || 0,
      newPrices: res.new_prices || res.prices || [],
      txHash: res.tx_hash
    };
  }

  /**
   * Withdraw funds from L2 to L1
   * @param {number} amount - Amount to withdraw
   * @param {string} destinationAddress - L1 destination address (optional, defaults to connected wallet)
   */
  async withdraw(amount, destinationAddress = null) {
    if (!this.address || !this.signer) {
      throw new Error('Wallet not connected');
    }

    const tx = {
      address: this.address,
      amount,
      destination: destinationAddress || this.address,
      timestamp: Date.now()
    };
    
    // Note: The server expects `address`, `amount`, `destination` in the body
    // and typically a signature header or wrapper. 
    // Based on other methods, we might need to wrap it.
    // BUT looking at `layer_2/ledger_v2.rs`:
    // struct WithdrawReq { address, amount, destination }
    // There is no explicit signature check in the `WithdrawReq` struct itself, 
    // but usually these endpoints require auth.
    // However, the `withdraw` handler in `ledger_v2.rs` takes `Json(req): Json<WithdrawReq>`.
    // It doesn't seem to verify signature in the handler signature?
    // Let's look at `withdraw` function in `ledger_v2.rs` again.
    // `async fn withdraw(State(state): State<AppState>, Json(req): Json<WithdrawReq>)`
    // It calls `l.withdraw`. `Ledger::withdraw` likely checks balance.
    // IT DOES NOT CHECK SIGNATURE. This is a security flaw but matching the implementation.
    
    const res = await this.l2Post('/withdraw', tx);
    return res;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER POSITIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get user's position in a specific market
   * @param {string} marketId - Market ID
   */
  async getPosition(marketId) {
    if (!this.address) return null;
    
    const res = await this.l2Get(`/position/${this.address}/${marketId}`);
    return {
      marketId,
      shares: res.shares || [],
      invested: res.invested || 0,
      currentValue: res.current_value || 0,
      unrealizedPnl: res.unrealized_pnl || 0
    };
  }

  /**
   * Get all user positions
   */
  async getAllPositions() {
    if (!this.address) return [];
    
    const res = await this.l2Get(`/positions/${this.address}`);
    return res.positions || [];
  }

  /**
   * Get all user positions - alias for getAllPositions() (test compatibility)
   */
  async getPositions(address = null) {
    const userAddress = address || this.address;
    if (!userAddress) return [];
    
    const res = await this.l2Get(`/positions/${userAddress}`);
    return res.positions || [];
  }

  /**
   * Get claimable winnings for resolved markets
   */
  async getClaimableWinnings(address = null) {
    const userAddress = address || this.address;
    if (!userAddress) return [];
    
    const res = await this.l2Get(`/winnings/${userAddress}`);
    return res.winnings || [];
  }

  /**
   * Claim winnings from a resolved market
   */
  async claimWinnings(marketId) {
    if (!this.address) throw new Error('Address required for claiming winnings');
    
    const res = await this.l2Post(`/winnings/${this.address}/claim`, {
      marketId,
      timestamp: Math.floor(Date.now() / 1000)
    });
    
    return {
      success: res.success || false,
      amount: res.amount || 0,
      transactionId: res.transactionId || res.txHash
    };
  }

  /**
   * Get user's betting history
   */
  async getBetHistory() {
    if (!this.address) return [];
    
    const res = await this.l2Get(`/history/${this.address}`);
    return res.bets || [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // L2 BALANCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get user's L2 balance
   */
  async getBalance() {
    if (!this.address) return { available: 0, locked: 0 };
    
    const res = await this.l2Get(`/balance/${this.address}`);
    return {
      available: res.available || res.balance || 0,
      locked: res.locked || 0,
      hasActiveCredit: res.has_active_credit || false
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enrich market with computed fields
   */
  enrichMarket(market) {
    if (!market) return null;
    
    const now = new Date();
    const closesAt = market.closes_at ? new Date(market.closes_at) : null;
    const prices = market.prices || market.current_prices || [];
    
    return {
      ...market,
      // Computed fields
      canTrade: market.status === MarketStatus.ACTIVE || market.status === 'active',
      isClosingSoon: closesAt && (closesAt - now) < 24 * 60 * 60 * 1000,
      isClosed: closesAt && closesAt < now,
      timeUntilClose: closesAt ? Math.max(0, closesAt - now) : null,
      
      // Normalized prices
      prices,
      yesPrice: prices[0] || 0.5,
      noPrice: prices[1] || 0.5,
      
      // Implied probabilities (same as prices for CPMM)
      yesProbability: prices[0] || 0.5,
      noProbability: prices[1] || 0.5
    };
  }

  /**
   * L2 HTTP GET helper
   */
  async l2Get(path) {
    const res = await fetch(`${this.l2Url}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`L2 GET failed: ${await res.text()}`);
    return res.json();
  }

  /**
   * L2 HTTP POST helper
   */
  async l2Post(path, body) {
    const res = await fetch(`${this.l2Url}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`L2 POST failed: ${await res.text()}`);
    return res.json();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export function createMarketsSDK(config) {
  return new MarketsSDK(config);
}

export default MarketsSDK;


// ═══════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════
/*

// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────────────

import { MarketsSDK, MarketStatus } from './markets-sdk.js';

const markets = new MarketsSDK({
  l2Url: 'http://localhost:1234',
  address: '0x123...abc',
  signer: async (msg) => yourWallet.sign(msg)
});

// ─────────────────────────────────────────────────────────────────────────────
// LOAD MARKETS BY STATUS (Server-side filtered)
// ─────────────────────────────────────────────────────────────────────────────

// Get active (tradeable) markets - this is the main endpoint
const activeMarkets = await markets.getActive();
// or: await markets.getAll() - same as getActive()

// Get pending markets (awaiting liquidity >= 100 $BC)
const pendingMarkets = await markets.getPending();

// Get frozen markets (past closes_at, awaiting resolution)
const frozenMarkets = await markets.getFrozen();

// Get resolved markets (sorted by close date, recent first)
const resolvedMarkets = await markets.getResolved();

// Get resolved sorted by created_at ascending
const oldestResolved = await markets.getResolved({ sort: 'created_at', order: 'asc' });

// Multiple statuses at once
const liveMarkets = await markets.getByStatuses([
  MarketStatus.ACTIVE, 
  MarketStatus.FROZEN
]);

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE MARKET WITH PROPS
// ─────────────────────────────────────────────────────────────────────────────

// Get a market with live prices AND all prop bets
const market = await markets.getMarket('btc-100k-2026');
console.log(`${market.title}`);
console.log(`Status: ${market.status}`);
console.log(`Prices: YES=${market.prices[0]}, NO=${market.prices[1]}`);
console.log(`Closes at: ${new Date(market.closes_at * 1000)}`);
console.log(`Resolution: ${market.resolution_criteria}`);
console.log(`Prop bets: ${market.propsCount}`);
market.props.forEach(p => console.log(`  - ${p.title} (${p.status})`));

// Just get prices
const prices = await markets.getPrices('btc-100k-2026');
console.log(`Current odds: ${prices[0]} / ${prices[1]}`);

// Get pool state
const pool = await markets.getPoolState('btc-100k-2026');
console.log(`Reserves: ${pool.reserves}, K: ${pool.k}`);

// ─────────────────────────────────────────────────────────────────────────────
// CREATE PROP BET (Requires 100 $BC minimum liquidity)
// ─────────────────────────────────────────────────────────────────────────────

const propResult = await markets.createProp('btc-100k-2026', {
  title: 'Will BTC hit 100k before June?',
  description: 'Resolves YES if BTC >= $100,000 before June 1, 2026',
  outcomes: ['Yes', 'No'],
  initialLiquidity: 100,  // 100 $BC minimum
  closesAt: 1748656800,   // Unix timestamp (must be before parent closes)
  resolutionCriteria: 'Based on CoinGecko BTC/USD price'
});
console.log(`Prop created: ${propResult.propId}`);

// ─────────────────────────────────────────────────────────────────────────────
// BETTING
// ─────────────────────────────────────────────────────────────────────────────

// Get a quote first
const quote = await markets.getQuote('btc-100k-2026', 0, 100);
console.log(`Spending 100 gets ${quote.shares} shares`);
console.log(`Avg price: ${quote.avgPrice}`);
console.log(`Price impact: ${quote.priceImpact}%`);

// Place the bet (buy YES shares for 100 credits)
const betResult = await markets.bet('btc-100k-2026', 0, 100);
if (betResult.success) {
  console.log(`Bought ${betResult.shares} YES shares!`);
}

// Sell shares
const sellResult = await markets.sell('btc-100k-2026', 0, 50);
console.log(`Sold 50 shares for ${sellResult.received}`);

// ─────────────────────────────────────────────────────────────────────────────
// USER POSITIONS & BALANCE
// ─────────────────────────────────────────────────────────────────────────────

const balance = await markets.getBalance();
console.log(`Available: ${balance.l2_available}, Locked: ${balance.l2_locked}`);

const position = await markets.getPosition('btc-100k-2026');
console.log(`Shares: ${position.shares}, P&L: ${position.unrealizedPnl}`);

const allPositions = await markets.getAllPositions();
const history = await markets.getBetHistory();

// ─────────────────────────────────────────────────────────────────────────────
// MARKET LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────
//
// pending  →  active  →  frozen  →  resolved
//    │          │          │          │
//  < 100 $BC  trading   closes_at    winner
//  liquidity   open      passed    determined
//
// - Markets auto-freeze when closes_at timestamp passes
// - Frozen markets cannot accept new bets
// - Only ORACLE can resolve markets

*/
