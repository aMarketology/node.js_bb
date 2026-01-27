/**
 * ============================================================================
 * L2 MARKETS SDK - Frontend Integration for BlackBook Prediction Markets
 * ============================================================================
 * 
 * Complete frontend SDK for prediction market functionality:
 * 
 * 🎯 EVENTS & MARKETS:
 *   - Browse all markets and events
 *   - View parent events with prop bets
 *   - Real-time price updates
 *   - Market search and filtering
 * 
 * 🎲 BETTING:
 *   - Get quotes before betting
 *   - Place bets with slippage protection
 *   - Sell positions back to pool
 *   - View current odds
 * 
 * 📊 PROP BETS:
 *   - View official prop bets
 *   - Create custom prop bets (drafts)
 *   - Fund other users' drafts
 *   - Track prop bet status
 * 
 * 👤 USER PORTFOLIO:
 *   - View all positions
 *   - Track P&L (profit/loss)
 *   - Betting history
 *   - Balance management
 * 
 * 💧 LIQUIDITY:
 *   - Add liquidity to markets
 *   - Remove liquidity
 *   - View LP positions
 * 
 * 🔧 ADMIN/DEALER (ORACLE ONLY):
 *   - Update market settings
 *   - Set settlement dates
 *   - Activate/pause markets
 *   - Resolve markets
 * 
 * USAGE (React/Next.js):
 * ```javascript
 * import { L2MarketsSDK } from '@/integration/l2-markets-sdk';
 * 
 * // Initialize (no auth needed for reading)
 * const sdk = new L2MarketsSDK('http://localhost:1234');
 * 
 * // Browse markets (no auth)
 * const markets = await sdk.getMarkets();
 * const event = await sdk.getEvent('worldcup_kor_cze');
 * 
 * // Connect wallet for betting
 * await sdk.connect(privateKey, address);
 * 
 * // Place a bet
 * const quote = await sdk.getQuote(marketId, 0, 100);
 * await sdk.placeBet(marketId, 0, 100);
 * ```
 */

const nacl = require('tweetnacl');

// ============================================================================
// L2 MARKETS SDK CLASS
// ============================================================================

class L2MarketsSDK {
  constructor(l2Url = 'http://localhost:1234') {
    this.l2Url = l2Url;
    this.address = null;
    this.privateKey = null;
    this.publicKey = null;
    this.sessionToken = null;
    this.sessionExpiry = 0;
    this.nonce = Date.now();
    
    // Event listeners for real-time updates
    this._priceListeners = new Map();
    this._pollIntervals = new Map();
  }

  // ==========================================================================
  // CONNECTION & AUTHENTICATION
  // ==========================================================================

  /**
   * Connect wallet for authenticated actions (betting, creating props)
   * @param {Buffer|string} privateKey - Ed25519 private key (32 bytes or hex)
   * @param {string} address - L2 wallet address
   */
  async connect(privateKey, address) {
    this.address = address;
    this.privateKey = typeof privateKey === 'string' 
      ? Buffer.from(privateKey, 'hex') 
      : privateKey;
    
    // Derive public key
    const keypair = nacl.sign.keyPair.fromSecretKey(
      new Uint8Array([...this.privateKey, ...new Uint8Array(32)])
    );
    this.publicKey = Buffer.from(keypair.publicKey).toString('hex');
    
    // Skip authentication for local dev (no /auth endpoint yet)
    if (this.l2Url.includes('localhost')) {
      console.log('🔧 Skipping L2 authentication for local dev');
      return {
        address: this.address,
        connected: true,
        sessionExpires: 'N/A (local dev)'
      };
    }
    
    // Authenticate and get session
    await this.authenticate();
    
    return {
      address: this.address,
      connected: true,
      sessionExpires: new Date(this.sessionExpiry * 1000).toISOString()
    };
  }

  /**
   * Authenticate and get session token (2.5 min validity)
   */
  async authenticate() {
    if (!this.privateKey || !this.address) {
      throw new Error('Wallet not connected. Call connect() first.');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const message = `${this.address}:${timestamp}`;
    const signature = this._sign(message);

    const response = await fetch(`${this.l2Url}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: this.address,
        public_key: this.publicKey,
        signature,
        timestamp,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Authentication failed: ${response.status}`);
    }

    const result = await response.json();
    this.sessionToken = result.session_token;
    this.sessionExpiry = result.expires_at;

    return result;
  }

  /**
   * Check if connected and session is valid
   */
  isConnected() {
    const now = Math.floor(Date.now() / 1000);
    return this.sessionToken && now < this.sessionExpiry - 10;
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.address = null;
    this.privateKey = null;
    this.publicKey = null;
    this.sessionToken = null;
    this.sessionExpiry = 0;
    
    // Stop all price listeners
    this._pollIntervals.forEach(interval => clearInterval(interval));
    this._pollIntervals.clear();
    this._priceListeners.clear();
  }

  // ==========================================================================
  // MARKETS - Browse & View
  // ==========================================================================

  /**
   * Get all active markets
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of markets
   */
  async getMarkets(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    if (filters.limit) params.set('limit', filters.limit);

    const response = await fetch(`${this.l2Url}/markets?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch markets: ${response.status}`);
    
    const data = await response.json();
    return (data.markets || []).map(m => this._formatMarket(m));
  }

  /**
   * Get a single market by ID
   * @param {string} marketId - Market ID
   * @returns {Promise<Object>} Market details with prices
   */
  async getMarket(marketId) {
    const response = await fetch(`${this.l2Url}/markets/${marketId}`);
    if (!response.ok) throw new Error(`Market not found: ${marketId}`);
    
    const data = await response.json();
    return this._formatMarket(data.market || data);
  }

  /**
   * Get current prices for a market
   * @param {string} marketId - Market ID
   * @returns {Promise<Object>} Current prices and pool info
   */
  async getPrices(marketId) {
    const response = await fetch(`${this.l2Url}/markets/${marketId}/prices`);
    if (!response.ok) throw new Error(`Failed to fetch prices: ${response.status}`);
    
    const data = await response.json();
    return {
      marketId,
      outcomes: data.prices?.map((p, i) => ({
        index: i,
        label: p.label || `Outcome ${i}`,
        price: p.price,
        probability: (p.price * 100).toFixed(1) + '%',
        odds: p.price > 0 ? (1 / p.price).toFixed(2) + 'x' : 'N/A',
        volume: p.total_volume_bb || 0,
      })) || [],
      pool: data.pool ? {
        tvl: data.pool.tvl,
        feesCollected: data.pool.fees_collected,
      } : null,
      feeRate: data.fee_rate || 0.02,
    };
  }

  /**
   * Search markets by title/description
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching markets
   */
  async searchMarkets(query) {
    return this.getMarkets({ search: query });
  }

  /**
   * Get featured/trending markets
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Top markets by volume
   */
  async getFeaturedMarkets(limit = 10) {
    const markets = await this.getMarkets({ limit: 100 });
    return markets
      .filter(m => m.status === 'Active')
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, limit);
  }

  // ==========================================================================
  // EVENTS - Parent Events with Prop Bets
  // ==========================================================================

  /**
   * Get a parent event with all its prop bets
   * @param {string} eventId - Parent event ID
   * @returns {Promise<Object>} Event with main market and all props
   */
  async getEvent(eventId) {
    // Get the parent market
    const parent = await this.getMarket(eventId);
    
    // Get all child markets (prop bets)
    const allMarkets = await this.getMarkets();
    const propBets = allMarkets.filter(m => m.parentEventId === eventId);
    
    // Separate official props and user props
    const officialProps = propBets.filter(p => p.category === 'official_prop');
    const userProps = propBets.filter(p => p.category === 'user_prop');
    
    return {
      event: parent,
      mainMarket: parent,
      officialProps: officialProps.sort((a, b) => a.displayOrder - b.displayOrder),
      userProps,
      totalProps: propBets.length,
      totalVolume: parent.totalVolume + propBets.reduce((sum, p) => sum + p.totalVolume, 0),
    };
  }

  /**
   * Get all parent events (main markets without parent)
   * @returns {Promise<Array>} List of parent events
   */
  async getEvents() {
    const markets = await this.getMarkets();
    return markets.filter(m => !m.parentEventId && m.category === 'main');
  }

  /**
   * Get events by category (sports, politics, crypto, etc.)
   * @param {string} category - Event category
   * @returns {Promise<Array>} Matching events
   */
  async getEventsByCategory(category) {
    const events = await this.getEvents();
    return events.filter(e => 
      e.tags?.includes(category) || 
      e.marketCategory === category
    );
  }

  // ==========================================================================
  // EVENTS BY STATUS - Pending, Active, Resolved
  // ==========================================================================

  // Minimum liquidity required for a market to be considered "Active" (tradeable)
  static MIN_ACTIVE_LIQUIDITY = 100;  // 100 BB minimum to be live

  /**
   * Get all events organized by status
   * @returns {Promise<Object>} Events grouped by pending/active/resolved
   */
  async getEventsByStatus() {
    const markets = await this.getMarkets();
    const now = Math.floor(Date.now() / 1000);
    
    const pending = [];   // Draft/proposed OR insufficient liquidity - NOT tradeable
    const active = [];    // Live markets with liquidity - TRADEABLE
    const frozen = [];    // Betting closed, awaiting resolution
    const resolved = [];  // Completed with winner declared
    
    for (const market of markets) {
      // Skip child markets (prop bets) - only organize parent events
      if (market.parentEventId) continue;
      
      // Check if market has sufficient liquidity to be tradeable
      const hasLiquidity = market.liquidity >= L2MarketsSDK.MIN_ACTIVE_LIQUIDITY;
      const hasCPMM = market.cpmmEnabled;
      const isTradeable = hasLiquidity && hasCPMM;
      
      if (market.isResolved) {
        resolved.push(market);
      } else if (market.bettingClosesAt && now >= market.bettingClosesAt) {
        frozen.push(market);
      } else if (!isTradeable || market.status === 'Proposed' || market.status === 'Draft' || market.eventStatus === 'Draft') {
        // No liquidity OR draft status = pending
        pending.push(market);
      } else {
        // Has liquidity + CPMM = active and tradeable
        active.push(market);
      }
    }
    
    return {
      pending: pending.sort((a, b) => b.createdAt - a.createdAt),
      active: active.sort((a, b) => b.totalVolume - a.totalVolume),
      frozen: frozen.sort((a, b) => a.bettingClosesAt - b.bettingClosesAt),
      resolved: resolved.sort((a, b) => b.createdAt - a.createdAt),
      summary: {
        pending: pending.length,
        active: active.length,
        frozen: frozen.length,
        resolved: resolved.length,
        total: pending.length + active.length + frozen.length + resolved.length,
      }
    };
  }

  /**
   * Get only pending/draft events (not yet live)
   * @returns {Promise<Array>} Pending events
   */
  async getPendingEvents() {
    const { pending } = await this.getEventsByStatus();
    return pending;
  }

  /**
   * Get only active events (accepting bets)
   * @returns {Promise<Array>} Active events
   */
  async getActiveEvents() {
    const { active } = await this.getEventsByStatus();
    return active;
  }

  /**
   * Get only frozen events (betting closed, awaiting resolution)
   * @returns {Promise<Array>} Frozen events
   */
  async getFrozenEvents() {
    const { frozen } = await this.getEventsByStatus();
    return frozen;
  }

  /**
   * Get only resolved events (completed)
   * @returns {Promise<Array>} Resolved events
   */
  async getResolvedEvents() {
    const { resolved } = await this.getEventsByStatus();
    return resolved;
  }

  /**
   * Get event with status info and all prop bets organized by status
   * @param {string} eventId - Parent event ID
   * @returns {Promise<Object>} Full event details with organized props
   */
  async getEventWithStatus(eventId) {
    const parent = await this.getMarket(eventId);
    const allMarkets = await this.getMarkets();
    const now = Math.floor(Date.now() / 1000);
    
    // Get all props for this event
    const props = allMarkets.filter(m => m.parentEventId === eventId);
    
    // Use the formatted status from _formatMarket (includes liquidity check)
    const parentStatus = parent.status.toLowerCase();
    
    // Organize props by their status
    const propsByStatus = {
      pending: props.filter(p => p.status === 'Pending'),
      active: props.filter(p => p.status === 'Active'),
      frozen: props.filter(p => p.status === 'Frozen'),
      resolved: props.filter(p => p.status === 'Resolved'),
    };
    
    // Separate by type
    const officialProps = props.filter(p => p.category === 'official_prop');
    const userProps = props.filter(p => p.category === 'user_prop');
    
    return {
      event: {
        ...parent,
        eventStatus: parentStatus,
        timeUntilFreeze: parent.bettingClosesAt 
          ? Math.max(0, parent.bettingClosesAt - now) 
          : null,
      },
      status: parentStatus,
      propsByStatus,
      officialProps: officialProps.sort((a, b) => a.displayOrder - b.displayOrder),
      userProps,
      summary: {
        totalProps: props.length,
        pendingProps: propsByStatus.pending.length,
        activeProps: propsByStatus.active.length,
        frozenProps: propsByStatus.frozen.length,
        resolvedProps: propsByStatus.resolved.length,
        totalVolume: parent.totalVolume + props.reduce((sum, p) => sum + p.totalVolume, 0),
        totalLiquidity: parent.liquidity + props.reduce((sum, p) => sum + (p.liquidity || 0), 0),
      }
    };
  }

  /**
   * Get events dashboard with all status counts and featured events
   * @returns {Promise<Object>} Dashboard data
   */
  async getEventsDashboard() {
    const byStatus = await this.getEventsByStatus();
    
    return {
      counts: byStatus.summary,
      featured: byStatus.active.slice(0, 5),  // Top 5 by volume
      recentlyAdded: byStatus.active
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5),
      closingSoon: byStatus.active
        .filter(e => e.bettingClosesAt)
        .sort((a, b) => a.bettingClosesAt - b.bettingClosesAt)
        .slice(0, 5),
      awaitingResolution: byStatus.frozen.slice(0, 10),
      recentlyResolved: byStatus.resolved.slice(0, 5),
    };
  }

  // ==========================================================================
  // MARKET LIFECYCLE - Funding, Activation, Resolution
  // ==========================================================================

  /**
   * Get markets that need funding (liquidity < MIN_ACTIVE_LIQUIDITY)
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Markets needing funding with funding details
   */
  async getMarketsNeedingFunding(limit = 20) {
    const { pending } = await this.getEventsByStatus();
    
    return pending
      .filter(m => m.liquidity < L2MarketsSDK.MIN_ACTIVE_LIQUIDITY)
      .map(m => ({
        ...m,
        currentLiquidity: m.liquidity || 0,
        neededForActivation: L2MarketsSDK.MIN_ACTIVE_LIQUIDITY - (m.liquidity || 0),
        percentFunded: ((m.liquidity || 0) / L2MarketsSDK.MIN_ACTIVE_LIQUIDITY * 100).toFixed(1) + '%',
      }))
      .slice(0, limit);
  }

  /**
   * Get low liquidity markets (active but below optimal)
   * @param {number} optimalLiquidity - Optimal liquidity threshold (default 1000)
   * @returns {Promise<Array>} Active markets with low liquidity
   */
  async getLowLiquidityMarkets(optimalLiquidity = 1000) {
    const { active } = await this.getEventsByStatus();
    
    return active
      .filter(m => m.liquidity < optimalLiquidity)
      .map(m => ({
        ...m,
        currentLiquidity: m.liquidity || 0,
        optimalLiquidity,
        liquidityGap: optimalLiquidity - (m.liquidity || 0),
        percentOfOptimal: ((m.liquidity || 0) / optimalLiquidity * 100).toFixed(1) + '%',
      }))
      .sort((a, b) => a.liquidity - b.liquidity);
  }

  /**
   * Check if a market can be activated (has sufficient liquidity)
   * @param {string} marketId - Market ID to check
   * @returns {Promise<Object>} Activation status
   */
  async checkMarketActivation(marketId) {
    const market = await this.getMarket(marketId);
    const canActivate = market.liquidity >= L2MarketsSDK.MIN_ACTIVE_LIQUIDITY;
    
    return {
      marketId,
      title: market.title,
      status: market.status,
      currentLiquidity: market.liquidity || 0,
      requiredLiquidity: L2MarketsSDK.MIN_ACTIVE_LIQUIDITY,
      canActivate,
      neededToActivate: canActivate ? 0 : L2MarketsSDK.MIN_ACTIVE_LIQUIDITY - (market.liquidity || 0),
      cpmmEnabled: market.cpmmEnabled,
      isTradeable: market.isTradeable,
    };
  }

  /**
   * Get markets closing soon (for frontend countdown/alerts)
   * @param {number} hoursUntilClose - Hours until betting closes
   * @returns {Promise<Array>} Markets closing within timeframe
   */
  async getMarketsClosingSoon(hoursUntilClose = 24) {
    const { active } = await this.getEventsByStatus();
    const now = Math.floor(Date.now() / 1000);
    const cutoffTime = now + (hoursUntilClose * 3600);
    
    return active
      .filter(m => m.bettingClosesAt && m.bettingClosesAt <= cutoffTime)
      .map(m => ({
        ...m,
        hoursUntilClose: ((m.bettingClosesAt - now) / 3600).toFixed(1),
        minutesUntilClose: Math.floor((m.bettingClosesAt - now) / 60),
        isUrgent: (m.bettingClosesAt - now) < 3600,  // Less than 1 hour
      }))
      .sort((a, b) => a.bettingClosesAt - b.bettingClosesAt);
  }

  /**
   * Get recently resolved markets (for settlement notifications)
   * @param {number} hoursAgo - Hours since resolution
   * @returns {Promise<Array>} Recently resolved markets
   */
  async getRecentlyResolvedMarkets(hoursAgo = 24) {
    const { resolved } = await this.getEventsByStatus();
    const cutoffTime = Math.floor(Date.now() / 1000) - (hoursAgo * 3600);
    
    return resolved
      .filter(m => m.resolvedAt && m.resolvedAt >= cutoffTime)
      .map(m => ({
        ...m,
        hoursAgoResolved: ((Math.floor(Date.now() / 1000) - m.resolvedAt) / 3600).toFixed(1),
      }))
      .sort((a, b) => b.resolvedAt - a.resolvedAt);
  }

  /**
   * Get market statistics summary
   * @returns {Promise<Object>} Overall market stats
   */
  async getMarketStats() {
    const byStatus = await this.getEventsByStatus();
    const allMarkets = [...byStatus.pending, ...byStatus.active, ...byStatus.frozen, ...byStatus.resolved];
    
    const totalLiquidity = allMarkets.reduce((sum, m) => sum + (m.liquidity || 0), 0);
    const totalVolume = allMarkets.reduce((sum, m) => sum + (m.totalVolume || 0), 0);
    const totalBets = allMarkets.reduce((sum, m) => sum + (m.betCount || 0), 0);
    
    return {
      marketCounts: byStatus.summary,
      totalLiquidity,
      totalVolume,
      totalBets,
      averageLiquidity: allMarkets.length ? (totalLiquidity / allMarkets.length).toFixed(2) : 0,
      averageVolume: allMarkets.length ? (totalVolume / allMarkets.length).toFixed(2) : 0,
      activeLiquidity: byStatus.active.reduce((sum, m) => sum + (m.liquidity || 0), 0),
      activeVolume: byStatus.active.reduce((sum, m) => sum + (m.totalVolume || 0), 0),
      pendingNeedsFunding: byStatus.pending.filter(m => m.liquidity < L2MarketsSDK.MIN_ACTIVE_LIQUIDITY).length,
    };
  }

  // ==========================================================================
  // BETTING - Quotes & Trades
  // ==========================================================================

  /**
   * Get a quote for a potential bet (preview before placing)
   * @param {string} marketId - Market ID
   * @param {number} outcomeIndex - Outcome to bet on (0, 1, 2...)
   * @param {number} amount - Amount in BB
   * @returns {Promise<Object>} Quote with expected shares and price impact
   */
  async getQuote(marketId, outcomeIndex, amount) {
    const prices = await this.getPrices(marketId);
    const outcome = prices.outcomes[outcomeIndex];
    
    if (!outcome) {
      throw new Error(`Invalid outcome index: ${outcomeIndex}`);
    }

    const currentPrice = outcome.price;
    const feeRate = prices.feeRate;
    const fee = amount * feeRate;
    const amountAfterFee = amount - fee;
    
    // Estimate shares (simplified - actual may vary due to price impact)
    const estimatedShares = amountAfterFee / currentPrice;
    const effectivePrice = amount / estimatedShares;
    const priceImpact = effectivePrice - currentPrice;

    return {
      marketId,
      outcome: outcome.label,
      outcomeIndex,
      amount,
      fee,
      amountAfterFee,
      currentPrice,
      estimatedShares: estimatedShares.toFixed(4),
      effectivePrice: effectivePrice.toFixed(4),
      priceImpact: (priceImpact * 100).toFixed(2) + '%',
      potentialPayout: estimatedShares.toFixed(2),
      potentialProfit: (estimatedShares - amount).toFixed(2),
    };
  }

  /**
   * Place a bet on a market outcome
   * @param {string} marketId - Market ID
   * @param {number} outcomeIndex - Outcome to bet on
   * @param {number} amount - Amount in BB
   * @param {number} maxSlippage - Max acceptable slippage (default 5%)
   * @returns {Promise<Object>} Bet confirmation
   */
  async placeBet(marketId, outcomeIndex, amount, maxSlippage = 0.05) {
    await this._ensureConnected();

    // Get quote first
    const quote = await this.getQuote(marketId, outcomeIndex, amount);
    const maxCost = amount * (1 + maxSlippage);

    const response = await this._authenticatedRequest('POST', `/markets/${marketId}/bet`, {
      outcome: outcomeIndex,
      amount,
      max_cost: maxCost,
    });

    return {
      success: true,
      marketId,
      outcome: quote.outcome,
      amount,
      sharesPurchased: response.shares_purchased || quote.estimatedShares,
      averagePrice: response.average_price || quote.effectivePrice,
      newBalance: response.new_balance,
    };
  }

  /**
   * Sell shares back to the pool
   * @param {string} marketId - Market ID
   * @param {number} outcomeIndex - Outcome to sell
   * @param {number} shares - Number of shares to sell
   * @returns {Promise<Object>} Sell confirmation
   */
  async sellShares(marketId, outcomeIndex, shares) {
    await this._ensureConnected();

    const response = await this._authenticatedRequest('POST', `/markets/${marketId}/sell`, {
      outcome: outcomeIndex,
      shares,
    });

    return {
      success: true,
      marketId,
      sharesSold: shares,
      bbReceived: response.bb_received,
      newBalance: response.new_balance,
    };
  }

  // ==========================================================================
  // PROP BETS & DRAFTS - User-Created Markets
  // ==========================================================================

  /**
   * Get all drafts (prop bets needing funding)
   * @param {string} eventId - Optional: filter by parent event
   * @returns {Promise<Array>} List of drafts
   */
  async getDrafts(eventId = null) {
    const params = eventId ? `?event_id=${eventId}` : '';
    const response = await fetch(`${this.l2Url}/drafts${params}`);
    if (!response.ok) throw new Error(`Failed to fetch drafts: ${response.status}`);
    
    const data = await response.json();
    return (data.drafts || []).map(d => ({
      id: d.id,
      title: d.title,
      description: d.description,
      outcomes: d.outcomes || d.options,
      parentEventId: d.parent_event_id,
      creator: d.creator || d.proposer,
      currentLiquidity: d.current_liquidity || 0,
      requiredLiquidity: d.required_liquidity || d.initial_liquidity,
      fundingProgress: d.current_liquidity / (d.required_liquidity || 1),
      isValid: d.is_valid,
      createdAt: d.created_at,
      expiresAt: d.expires_at,
    }));
  }

  /**
   * Get drafts that need counter-party funding (for discovery)
   * @param {string} eventId - Optional: filter by parent event
   * @returns {Promise<Array>} Drafts needing funding
   */
  async getDraftsNeedingFunding(eventId = null) {
    const drafts = await this.getDrafts(eventId);
    return drafts.filter(d => d.fundingProgress < 1);
  }

  /**
   * Create a custom prop bet (starts as draft)
   * @param {Object} options - Prop bet options
   * @returns {Promise<Object>} Created draft
   */
  async createPropBet(options) {
    await this._ensureConnected();

    const {
      title,
      description = '',
      outcomes,
      parentEventId,
      initialLiquidity = 50,
    } = options;

    if (!parentEventId) {
      throw new Error('parentEventId is required for prop bets');
    }

    const response = await this._authenticatedRequest('POST', '/drafts', {
      title,
      description,
      outcomes,
      initial_liquidity: initialLiquidity,
      parent_event_id: parentEventId,
      market_category: 'user_prop',
    });

    return {
      draftId: response.draft_id || response.id,
      title,
      parentEventId,
      initialLiquidity,
      status: 'pending_funding',
      message: `Draft created! Needs ${initialLiquidity} BB from counter-party to go live.`,
    };
  }

  /**
   * Fund a draft (take the opposing side)
   * When fully funded, draft becomes live market
   * @param {string} draftId - Draft ID
   * @param {number} amount - Amount to fund
   * @returns {Promise<Object>} Updated draft/market status
   */
  async fundDraft(draftId, amount) {
    await this._ensureConnected();

    const response = await this._authenticatedRequest('POST', `/drafts/${draftId}/fund`, {
      amount,
      take_opposing_position: true,
    });

    return {
      draftId,
      amountFunded: amount,
      isLive: response.is_live || response.status === 'active',
      marketId: response.market_id,
      message: response.is_live 
        ? 'Draft is now live! Market created.' 
        : `Funded ${amount} BB. Still needs more funding.`,
    };
  }

  /**
   * Get drafts created by the connected user
   * @returns {Promise<Array>} User's drafts
   */
  async getMyDrafts() {
    await this._ensureConnected();
    return this._authenticatedRequest('GET', '/drafts/mine');
  }

  // ==========================================================================
  // USER PORTFOLIO - Positions & P&L
  // ==========================================================================

  /**
   * Get user's balance
   * @returns {Promise<Object>} Balance details
   */
  async getBalance() {
    await this._ensureConnected();
    
    const response = await fetch(`${this.l2Url}/balance/${this.address}`);
    if (!response.ok) throw new Error(`Failed to fetch balance: ${response.status}`);
    
    const data = await response.json();
    return {
      available: data.available || data.balance || 0,
      locked: data.locked || 0,
      total: (data.available || data.balance || 0) + (data.locked || 0),
    };
  }

  /**
   * Get all user positions across markets
   * @returns {Promise<Array>} All positions with current values
   */
  async getPositions() {
    await this._ensureConnected();
    
    const response = await fetch(`${this.l2Url}/positions/${this.address}`);
    if (!response.ok) throw new Error(`Failed to fetch positions: ${response.status}`);
    
    const data = await response.json();
    const positions = data.positions || [];
    
    // Enrich with current market data
    const enriched = await Promise.all(positions.map(async pos => {
      try {
        const prices = await this.getPrices(pos.market_id);
        const outcome = prices.outcomes[pos.outcome];
        
        return {
          marketId: pos.market_id,
          marketTitle: pos.title || pos.market_title,
          outcome: outcome?.label || `Outcome ${pos.outcome}`,
          outcomeIndex: pos.outcome,
          shares: pos.shares,
          averageCost: pos.average_cost || pos.total_invested / pos.shares,
          currentPrice: outcome?.price || 0,
          currentValue: pos.shares * (outcome?.price || 0),
          unrealizedPnL: (pos.shares * (outcome?.price || 0)) - (pos.total_invested || 0),
        };
      } catch (e) {
        return {
          marketId: pos.market_id,
          shares: pos.shares,
          error: 'Failed to fetch current prices',
        };
      }
    }));

    return enriched;
  }

  /**
   * Get position for a specific market
   * @param {string} marketId - Market ID
   * @returns {Promise<Object>} Position in this market
   */
  async getPosition(marketId) {
    await this._ensureConnected();
    
    const positions = await this.getPositions();
    return positions.find(p => p.marketId === marketId) || null;
  }

  /**
   * Get P&L summary
   * @returns {Promise<Object>} Profit/loss summary
   */
  async getPnL() {
    await this._ensureConnected();
    
    const positions = await this.getPositions();
    
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let realizedPnL = 0;
    
    for (const pos of positions) {
      if (pos.averageCost && pos.shares) {
        totalInvested += pos.averageCost * pos.shares;
        totalCurrentValue += pos.currentValue || 0;
      }
    }
    
    const unrealizedPnL = totalCurrentValue - totalInvested;
    
    return {
      totalInvested,
      totalCurrentValue,
      unrealizedPnL,
      unrealizedPnLPercent: totalInvested > 0 
        ? ((unrealizedPnL / totalInvested) * 100).toFixed(2) + '%' 
        : '0%',
      realizedPnL,
      positions: positions.length,
    };
  }

  /**
   * Get betting history
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Bet history
   */
  async getBetHistory(limit = 50) {
    await this._ensureConnected();
    
    const response = await fetch(`${this.l2Url}/user/${this.address}/bets?limit=${limit}`);
    if (!response.ok) throw new Error(`Failed to fetch history: ${response.status}`);
    
    const data = await response.json();
    return data.bets || [];
  }

  // ==========================================================================
  // LIQUIDITY - Add/Remove LP
  // ==========================================================================

  /**
   * Add liquidity to a market
   * @param {string} marketId - Market ID
   * @param {number} amount - BB amount to add
   * @returns {Promise<Object>} LP confirmation
   */
  async addLiquidity(marketId, amount) {
    await this._ensureConnected();
    
    return this._authenticatedRequest('POST', `/markets/${marketId}/add-liquidity`, {
      amount,
    });
  }

  /**
   * Remove liquidity from a market
   * @param {string} marketId - Market ID
   * @param {number} shareFraction - Fraction to remove (0.0-1.0)
   * @returns {Promise<Object>} Withdrawal confirmation
   */
  async removeLiquidity(marketId, shareFraction = 1.0) {
    await this._ensureConnected();
    
    return this._authenticatedRequest('POST', `/markets/${marketId}/remove-liquidity`, {
      share_fraction: shareFraction,
    });
  }

  /**
   * Get LP info for a market
   * @param {string} marketId - Market ID
   * @returns {Promise<Object>} LP details
   */
  async getLPInfo(marketId) {
    const response = await fetch(`${this.l2Url}/lp/${marketId}/info`);
    if (!response.ok) throw new Error(`Failed to fetch LP info: ${response.status}`);
    return response.json();
  }

  // ==========================================================================
  // ADMIN/DEALER - Market Management (DEALER only)
  // ==========================================================================

  /**
   * Update market settings (DEALER only)
   * @param {string} marketId - Market ID
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Update confirmation
   */
  async updateMarketSettings(marketId, settings) {
    await this._ensureConnected();
    
    const {
      settlementDate,
      status,
      eventStatus,
      title,
      description,
      minLiquidity,
    } = settings;

    const payload = {};
    if (settlementDate !== undefined) payload.settlement_date = settlementDate;
    if (status !== undefined) payload.status = status;
    if (eventStatus !== undefined) payload.event_status = eventStatus;
    if (title !== undefined) payload.title = title;
    if (description !== undefined) payload.description = description;
    if (minLiquidity !== undefined) payload.min_liquidity = minLiquidity;

    return this._authenticatedRequest('PATCH', `/admin/markets/${marketId}/settings`, payload);
  }

  /**
   * Set market settlement date (DEALER only)
   * @param {string} marketId - Market ID
   * @param {string|Date} settlementDate - ISO8601 datetime or Date object
   * @returns {Promise<Object>} Update confirmation
   */
  async setSettlementDate(marketId, settlementDate) {
    const dateStr = settlementDate instanceof Date 
      ? settlementDate.toISOString() 
      : settlementDate;
    
    return this.updateMarketSettings(marketId, { settlementDate: dateStr });
  }

  /**
   * Activate a market (set status to Live)
   * @param {string} marketId - Market ID
   * @returns {Promise<Object>} Update confirmation
   */
  async activateMarket(marketId) {
    return this.updateMarketSettings(marketId, { status: 'Live', eventStatus: 'Active' });
  }

  /**
   * Pause a market (set status to Proposed)
   * @param {string} marketId - Market ID
   * @returns {Promise<Object>} Update confirmation
   */
  async pauseMarket(marketId) {
    return this.updateMarketSettings(marketId, { status: 'Proposed' });
  }

  /**
   * Resolve a market (DEALER/ORACLE only)
   * @param {string} marketId - Market ID
   * @param {number} winningOutcome - Index of winning outcome
   * @returns {Promise<Object>} Resolution result with winners
   */
  async resolveMarket(marketId, winningOutcome) {
    await this._ensureConnected();
    
    return this._authenticatedRequest('POST', `/markets/${marketId}/resolve/session`, {
      winning_outcome: winningOutcome,
    });
  }

  /**
   * Bulk update settlement dates for multiple markets (DEALER only)
   * @param {Array} updates - Array of {marketId, settlementDate}
   * @returns {Promise<Array>} Results for each update
   */
  async bulkSetSettlementDates(updates) {
    const results = [];
    for (const { marketId, settlementDate } of updates) {
      try {
        const result = await this.setSettlementDate(marketId, settlementDate);
        results.push({ marketId, success: true, ...result });
      } catch (error) {
        results.push({ marketId, success: false, error: error.message });
      }
    }
    return results;
  }

  // ==========================================================================
  // REAL-TIME UPDATES - Price Subscriptions
  // ==========================================================================

  /**
   * Subscribe to price updates for a market
   * @param {string} marketId - Market ID
   * @param {function} callback - Called with new prices
   * @param {number} intervalMs - Polling interval (default 2000ms)
   * @returns {function} Unsubscribe function
   */
  subscribeToPrices(marketId, callback, intervalMs = 2000) {
    let lastPriceKey = null;
    
    const poll = async () => {
      try {
        const prices = await this.getPrices(marketId);
        const priceKey = prices.outcomes.map(o => o.price.toFixed(4)).join(',');
        
        if (priceKey !== lastPriceKey) {
          lastPriceKey = priceKey;
          callback(prices);
        }
      } catch (e) {
        console.error('Price poll error:', e.message);
      }
    };

    // Initial fetch
    poll();
    
    // Start polling
    const interval = setInterval(poll, intervalMs);
    this._pollIntervals.set(marketId, interval);
    
    // Return unsubscribe function
    return () => {
      clearInterval(interval);
      this._pollIntervals.delete(marketId);
    };
  }

  /**
   * Subscribe to portfolio updates
   * @param {function} callback - Called with updated positions
   * @param {number} intervalMs - Polling interval (default 5000ms)
   * @returns {function} Unsubscribe function
   */
  subscribeToPortfolio(callback, intervalMs = 5000) {
    const poll = async () => {
      try {
        const [positions, balance, pnl] = await Promise.all([
          this.getPositions(),
          this.getBalance(),
          this.getPnL(),
        ]);
        callback({ positions, balance, pnl });
      } catch (e) {
        console.error('Portfolio poll error:', e.message);
      }
    };

    poll();
    const interval = setInterval(poll, intervalMs);
    
    return () => clearInterval(interval);
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Calculate potential payout if outcome wins
   */
  calculatePayout(shares, currentPrice) {
    return shares; // Each share pays 1 BB if it wins
  }

  /**
   * Convert probability to decimal odds
   */
  toOdds(probability) {
    if (probability <= 0) return 999;
    return (1 / probability).toFixed(2);
  }

  /**
   * Format BB amount for display
   */
  formatBB(amount) {
    return `${Number(amount).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })} BB`;
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  _sign(message) {
    const messageBytes = Buffer.from(message, 'utf8');
    const secretKey = new Uint8Array(64);
    secretKey.set(this.privateKey, 0);
    
    const keypair = nacl.sign.keyPair.fromSeed(this.privateKey);
    secretKey.set(keypair.publicKey, 32);
    
    const signature = nacl.sign.detached(messageBytes, secretKey);
    return Buffer.from(signature).toString('hex');
  }

  async _ensureConnected() {
    if (!this.address) {
      throw new Error('Wallet not connected. Call connect() first.');
    }
    
    if (!this.isConnected()) {
      await this.authenticate();
    }
  }

  async _authenticatedRequest(method, path, body = null) {
    await this._ensureConnected();

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': this.sessionToken,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.l2Url}${path}`, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  _formatMarket(m) {
    const now = Math.floor(Date.now() / 1000);
    
    // Get liquidity from various possible fields
    const liquidity = m.liquidity || m.pool?.liquidity || m.cpmm_pool?.tvl || 0;
    const hasLiquidity = liquidity >= L2MarketsSDK.MIN_ACTIVE_LIQUIDITY;
    const hasCPMM = !!m.cpmm_pool || liquidity > 0;
    const isTradeable = hasLiquidity && hasCPMM;
    
    // Determine comprehensive status based on liquidity
    let status = 'Pending';  // Default to pending
    let eventStatus = m.event_status || m.status;
    
    if (m.is_resolved) {
      status = 'Resolved';
    } else if (m.betting_closes_at && now >= m.betting_closes_at) {
      status = 'Frozen';
    } else if (eventStatus === 'Draft' || eventStatus === 'Proposed' || m.status === 'Proposed') {
      status = 'Pending';
    } else if (isTradeable) {
      status = 'Active';  // Only active if has sufficient liquidity
    }
    // else stays 'Pending' - no liquidity
    
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      outcomes: m.options || m.outcomes || [],
      status,
      eventStatus: eventStatus || status,
      parentEventId: m.parent_event_id,
      childMarketIds: m.child_market_ids || [],
      category: m.market_category || 'main',
      displayOrder: m.display_order || 0,
      totalVolume: m.total_volume || m.volume || 0,
      betCount: m.bet_count || m.total_bets || 0,
      createdAt: m.created_at,
      bettingClosesAt: m.betting_closes_at,
      timeUntilFreeze: m.betting_closes_at ? Math.max(0, m.betting_closes_at - now) : null,
      isResolved: m.is_resolved || false,
      isFrozen: m.betting_closes_at && now >= m.betting_closes_at,
      isPending: status === 'Pending',
      isActive: status === 'Active',
      isTradeable,
      winningOutcome: m.winning_option ?? m.winning_outcome,
      settlementDate: m.settlement_date || null,
      tags: m.tags || [],
      imageUrl: m.image_url,
      sourceUrl: m.source_url,
      cpmmEnabled: hasCPMM,
      liquidity,
      hasLiquidity,
      proposer: m.proposer,
      minLiquidity: m.min_liquidity || 0,
      isPrivate: m.is_private || false,
    };
  }
}

// ============================================================================
// REACT HOOKS (Optional - for React/Next.js)
// ============================================================================

/**
 * React hook for L2 Markets SDK
 * Usage:
 * ```javascript
 * import { useL2Markets } from '@/integration/l2-markets-sdk';
 * 
 * function MyComponent() {
 *   const { sdk, connect, isConnected } = useL2Markets();
 *   const [markets, setMarkets] = useState([]);
 *   
 *   useEffect(() => {
 *     sdk.getMarkets().then(setMarkets);
 *   }, []);
 * }
 * ```
 */
function createReactHooks() {
  // This is a placeholder - actual React hooks would be in a separate file
  // that imports React
  return {
    useL2Markets: () => {
      throw new Error('React hooks require React. Import from l2-markets-react.js');
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  L2MarketsSDK,
  createReactHooks,
};

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

if (require.main === module) {
  (async () => {
    console.log('🎯 L2 Markets SDK - Example Usage\n');

    const sdk = new L2MarketsSDK('http://localhost:1234');

    try {
      // ═══════════════════════════════════════════════════════════════════
      // EVENTS BY STATUS
      // ═══════════════════════════════════════════════════════════════════
      console.log('📊 Events by Status:');
      console.log('─'.repeat(50));
      
      const byStatus = await sdk.getEventsByStatus();
      console.log(`   🟡 Pending:  ${byStatus.summary.pending} events`);
      console.log(`   🟢 Active:   ${byStatus.summary.active} events`);
      console.log(`   🔵 Frozen:   ${byStatus.summary.frozen} events`);
      console.log(`   ⚪ Resolved: ${byStatus.summary.resolved} events`);
      console.log(`   ─────────────────────────`);
      console.log(`   📊 Total:    ${byStatus.summary.total} events\n`);

      // Show active events
      if (byStatus.active.length > 0) {
        console.log('🟢 Active Events (accepting bets):');
        byStatus.active.slice(0, 5).forEach(e => {
          console.log(`   • ${e.title}`);
          console.log(`     Volume: ${sdk.formatBB(e.totalVolume)} | Bets: ${e.betCount}`);
        });
        console.log();
      }

      // Show frozen events (awaiting resolution)
      if (byStatus.frozen.length > 0) {
        console.log('🔵 Frozen Events (awaiting resolution):');
        byStatus.frozen.slice(0, 3).forEach(e => {
          console.log(`   • ${e.title}`);
        });
        console.log();
      }

      // Show resolved events
      if (byStatus.resolved.length > 0) {
        console.log('⚪ Recently Resolved:');
        byStatus.resolved.slice(0, 3).forEach(e => {
          console.log(`   • ${e.title} → Winner: Outcome ${e.winningOutcome}`);
        });
        console.log();
      }

      // ═══════════════════════════════════════════════════════════════════
      // SINGLE MARKET DETAILS
      // ═══════════════════════════════════════════════════════════════════
      const markets = await sdk.getMarkets();
      if (markets.length > 0) {
        const market = markets[0];
        console.log('─'.repeat(50));
        console.log(`📈 Market Details: ${market.title}`);
        console.log('─'.repeat(50));
        console.log(`   ID: ${market.id}`);
        console.log(`   Status: ${market.status}`);
        console.log(`   Volume: ${sdk.formatBB(market.totalVolume)}`);

        // Get live prices
        const prices = await sdk.getPrices(market.id);
        console.log('\n   Current Odds:');
        prices.outcomes.forEach(o => {
          console.log(`     ${o.label}: ${o.probability} (${o.odds})`);
        });

        // Get quote preview
        console.log('\n   Quote for 100 BB on outcome 0:');
        const quote = await sdk.getQuote(market.id, 0, 100);
        console.log(`     Shares: ${quote.estimatedShares}`);
        console.log(`     Impact: ${quote.priceImpact}`);
        console.log(`     Payout: ${quote.potentialPayout} BB`);
      }

      // ═══════════════════════════════════════════════════════════════════
      // DASHBOARD
      // ═══════════════════════════════════════════════════════════════════
      console.log('\n' + '─'.repeat(50));
      console.log('🎛️  Events Dashboard');
      console.log('─'.repeat(50));
      
      const dashboard = await sdk.getEventsDashboard();
      console.log(`   Featured: ${dashboard.featured.length} events`);
      console.log(`   Closing Soon: ${dashboard.closingSoon.length} events`);
      console.log(`   Awaiting Resolution: ${dashboard.awaitingResolution.length} events`);

      console.log('\n' + '═'.repeat(50));
      console.log('✅ SDK Demo Complete!');
      console.log('═'.repeat(50));
      
      console.log('\n📖 SDK Methods:');
      console.log('   sdk.getEventsByStatus()     → { pending, active, frozen, resolved }');
      console.log('   sdk.getPendingEvents()      → Events not yet live');
      console.log('   sdk.getActiveEvents()       → Events accepting bets');
      console.log('   sdk.getFrozenEvents()       → Betting closed, awaiting resolution');
      console.log('   sdk.getResolvedEvents()     → Completed events');
      console.log('   sdk.getEventsDashboard()    → Full dashboard data');
      console.log('   sdk.getEventWithStatus(id)  → Event + props organized by status');

    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  })();
}
