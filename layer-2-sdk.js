/**
 * ============================================================================
 * BLACKBOOK LAYER 2 SDK - Complete Integration Kit
 * ============================================================================
 * 
 * Comprehensive SDK for BlackBook L2 Prediction Market:
 * 
 * 🔐 AUTHENTICATION:
 *   - Ed25519 signature-based auth
 *   - 2.5-minute session tokens
 *   - Automatic session refresh
 * 
 * 🎯 MARKETS:
 *   - Create parent events (World Cup matches)
 *   - Create prop bets (goals, cards, corners)
 *   - User-proposed custom props
 *   - Query nested markets by event
 * 
 * 🎲 TRADING:
 *   - CPMM dynamic pricing
 *   - Get quotes before betting
 *   - Place bets with slippage protection
 *   - Sell shares back to pool
 * 
 * 💰 LIQUIDITY:
 *   - Add liquidity (become LP)
 *   - Remove liquidity
 *   - Collect LP fees
 * 
 * ⚖️ ORACLE & GOVERNANCE:
 *   - Multi-sig resolution for high-value markets
 *   - Sign resolutions as oracle
 *   - Dispute resolutions
 *   - Panel voting
 * 
 * 🛡️ INSURANCE:
 *   - File claims for voided markets
 *   - Check fund balance
 *   - Dealer top-ups
 * 
 * 📊 DRAFTS:
 *   - Create draft markets
 *   - Fund drafts (auto-promote when threshold met)
 *   - List your drafts
 *   - Edit/delete drafts
 * 
 * USAGE:
 * ```javascript
 * const { Layer2SDK } = require('./layer-2-sdk');
 * 
 * const sdk = new Layer2SDK({
 *   l2Url: 'http://localhost:1234',
 *   privateKey: Buffer.from('your-ed25519-private-key', 'hex'),
 *   address: 'L2_542AB3537F3ACB2D6E4597DAF41615F148B9F8410A390EF73970806FEC6ED26F'
 * });
 * 
 * // Authenticate
 * await sdk.authenticate();
 * 
 * // Create a World Cup match event
 * const event = await sdk.createParentEvent({
 *   title: 'Korea Republic vs Czechia',
 *   description: 'FIFA World Cup 2026 Group Stage',
 *   outcomes: ['Korea Republic', 'Draw', 'Czechia'],
 *   category: 'soccer',
 *   initialLiquidity: 50000
 * });
 * 
 * // Create prop bet
 * const prop = await sdk.createPropMarket({
 *   parentEventId: event.market_id,
 *   title: 'Total Goals - Over/Under 2.5',
 *   outcomes: ['Over 2.5', 'Under 2.5'],
 *   initialLiquidity: 10000
 * });
 * 
 * // User creates custom prop
 * const userProp = await sdk.createDraftProp({
 *   parentEventId: event.market_id,
 *   title: 'Korea to get red card',
 *   outcomes: ['Yes', 'No'],
 *   initialLiquidity: 50
 * });
 * ```
 */

const nacl = require('tweetnacl');
const fetch = require('node-fetch');

class Layer2SDK {
  constructor(config = {}) {
    this.l2Url = config.l2Url || 'http://localhost:1234';
    this.address = config.address;
    this.privateKey = config.privateKey; // Buffer of 32 bytes (Ed25519)
    this.publicKey = config.publicKey || (this.privateKey ? nacl.sign.keyPair.fromSecretKey(this.privateKey).publicKey : null);
    this.sessionToken = null;
    this.sessionExpiry = 0;
    this.nonce = Date.now();
  }

  // ==========================================================================
  // AUTHENTICATION & SESSION MANAGEMENT
  // ==========================================================================

  /**
   * Authenticate with L2 and get session token (valid 2.5 minutes)
   * @returns {Promise<Object>} Session info with token and expiry
   */
  async authenticate() {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `${this.address}:${timestamp}`;
    const signature = this.sign(message);

    const response = await fetch(`${this.l2Url}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: this.address,
        public_key: Buffer.from(this.publicKey).toString('hex'),
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

    console.log(`✅ Authenticated! Session expires at ${new Date(this.sessionExpiry * 1000).toLocaleTimeString()}`);
    return result;
  }

  /**
   * Check if session is still valid
   */
  isSessionValid() {
    const now = Math.floor(Date.now() / 1000);
    return this.sessionToken && now < this.sessionExpiry - 10; // 10 sec buffer
  }

  /**
   * Auto-refresh session if expired
   */
  async ensureSession() {
    if (!this.isSessionValid()) {
      await this.authenticate();
    }
  }

  /**
   * Sign a message with Ed25519 private key
   */
  sign(message) {
    const messageBytes = Buffer.from(message, 'utf8');
    const signature = nacl.sign.detached(messageBytes, this.privateKey);
    return Buffer.from(signature).toString('hex');
  }

  /**
   * Make authenticated request to L2
   */
  async request(method, path, body = null) {
    await this.ensureSession();

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

  // ==========================================================================
  // PARENT EVENTS (Main Markets)
  // ==========================================================================

  /**
   * Create a parent event (e.g., World Cup match)
   * @param {Object} options - Event options
   * @returns {Promise<Object>} Created event details
   */
  async createParentEvent(options) {
    const {
      title,
      description,
      outcomes,
      category = 'sports',
      tags = [],
      initialLiquidity = 10000,
      initialOdds = null,
      bettingClosesAt = null,
      sourceUrl = null,
      imageUrl = null,
    } = options;

    const market = await this.request('POST', '/markets', {
      title,
      description,
      outcomes,
      category,
      tags,
      initial_liquidity: initialLiquidity,
      initial_odds: initialOdds || outcomes.map(() => 1.0 / outcomes.length),
      betting_closes_at: bettingClosesAt,
      source_url: sourceUrl,
      image_url: imageUrl,
      market_category: 'main',
      display_order: 0,
    });

    console.log(`🎯 Created parent event: ${title} (ID: ${market.market_id})`);
    return market;
  }

  /**
   * Create an official prop bet linked to parent event
   * @param {Object} options - Prop bet options
   * @returns {Promise<Object>} Created prop market
   */
  async createPropMarket(options) {
    const {
      parentEventId,
      title,
      description = '',
      outcomes,
      initialLiquidity = 1000,
      initialOdds = null,
      displayOrder = 1,
    } = options;

    const market = await this.request('POST', '/markets', {
      title,
      description,
      outcomes,
      initial_liquidity: initialLiquidity,
      initial_odds: initialOdds || outcomes.map(() => 1.0 / outcomes.length),
      parent_event_id: parentEventId,
      market_category: 'official_prop',
      display_order: displayOrder,
    });

    console.log(`⚽ Created prop bet: ${title} (Parent: ${parentEventId})`);
    return market;
  }

  /**
   * Get all markets for a parent event (main + props)
   * @param {string} eventId - Parent event ID
   * @returns {Promise<Object>} Event with all child markets
   */
  async getEventMarkets(eventId) {
    const result = await this.request('GET', `/events/${eventId}/markets`);
    console.log(`📊 Loaded ${result.prop_markets?.length || 0} prop markets for event ${eventId}`);
    return result;
  }

  /**
   * Get market details
   * @param {string} marketId - Market ID
   * @returns {Promise<Object>} Market details
   */
  async getMarket(marketId) {
    return this.request('GET', `/markets/${marketId}`);
  }

  /**
   * List all active markets
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of markets
   */
  async listMarkets(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request('GET', `/markets?${params}`);
  }

  // ==========================================================================
  // DRAFT MARKETS (User-Proposed Props)
  // ==========================================================================

  /**
   * Create a draft prop bet (needs funding to go live)
   * @param {Object} options - Draft options
   * @returns {Promise<Object>} Draft details
   */
  async createDraftProp(options) {
    const {
      parentEventId,
      title,
      description = '',
      outcomes,
      initialLiquidity = 50,
      initialOdds = null,
    } = options;

    const draft = await this.request('POST', '/drafts', {
      title,
      description,
      outcomes,
      initial_liquidity: initialLiquidity,
      initial_odds: initialOdds || outcomes.map(() => 1.0 / outcomes.length),
      parent_event_id: parentEventId,
      market_category: 'user_prop',
    });

    console.log(`✏️ Created draft prop: ${title} (needs ${draft.required_liquidity - draft.current_liquidity} BB more)`);
    return draft;
  }

  /**
   * Fund a draft market (auto-promotes when threshold met)
   * @param {string} draftId - Draft market ID
   * @param {number} amount - Amount to fund
   * @param {boolean} takeOpposingPosition - Whether to bet opposite side
   * @returns {Promise<Object>} Updated draft/market status
   */
  async fundDraft(draftId, amount, takeOpposingPosition = false) {
    return this.request('POST', `/drafts/${draftId}/fund`, {
      amount,
      take_opposing_position: takeOpposingPosition,
    });
  }

  /**
   * Get your draft markets
   * @returns {Promise<Array>} List of your drafts
   */
  async getMyDrafts() {
    return this.request('GET', '/drafts/mine');
  }

  /**
   * Edit a draft market (only if still in draft status)
   * @param {string} draftId - Draft market ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated draft
   */
  async editDraft(draftId, updates) {
    return this.request('PATCH', `/drafts/${draftId}`, updates);
  }

  /**
   * Delete a draft market
   * @param {string} draftId - Draft market ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteDraft(draftId) {
    return this.request('DELETE', `/drafts/${draftId}`);
  }

  // ==========================================================================
  // TRADING (CPMM)
  // ==========================================================================

  /**
   * Get a quote for a bet (preview pricing)
   * @param {string} marketId - Market ID
   * @param {number} outcome - Outcome index
   * @param {number} amount - Amount to bet
   * @returns {Promise<Object>} Quote with price info
   */
  async getQuote(marketId, outcome, amount) {
    return this.request('POST', `/markets/${marketId}/quote`, {
      outcome,
      amount,
    });
  }

  /**
   * Place a bet on a market
   * @param {string} marketId - Market ID
   * @param {number} outcome - Outcome index
   * @param {number} amount - Amount to bet
   * @param {number} maxSlippage - Max acceptable slippage (default 5%)
   * @returns {Promise<Object>} Bet confirmation
   */
  async placeBet(marketId, outcome, amount, maxSlippage = 0.05) {
    const quote = await this.getQuote(marketId, outcome, amount);
    const maxCost = amount * (1 + maxSlippage);

    const result = await this.request('POST', `/markets/${marketId}/bet`, {
      outcome,
      amount,
      max_cost: maxCost,
    });

    console.log(`✅ Bet placed: ${amount} BB on outcome ${outcome} (got ${result.shares_purchased} shares)`);
    return result;
  }

  /**
   * Sell shares back to the pool
   * @param {string} marketId - Market ID
   * @param {number} outcome - Outcome index
   * @param {number} shares - Number of shares to sell
   * @returns {Promise<Object>} Sell confirmation
   */
  async sellShares(marketId, outcome, shares) {
    const result = await this.request('POST', `/markets/${marketId}/sell`, {
      outcome,
      shares,
    });

    console.log(`💰 Sold ${shares} shares for ${result.bb_received} BB`);
    return result;
  }

  /**
   * Get your positions in a market
   * @param {string} marketId - Market ID
   * @returns {Promise<Object>} Your positions
   */
  async getPosition(marketId) {
    return this.request('GET', `/markets/${marketId}/position`);
  }

  /**
   * Get current market prices
   * @param {string} marketId - Market ID
   * @returns {Promise<Array>} Current prices for each outcome
   */
  async getPrices(marketId) {
    const market = await this.getMarket(marketId);
    return market.cpmm_pool?.current_prices || [];
  }

  // ==========================================================================
  // LIQUIDITY PROVISION
  // ==========================================================================

  /**
   * Add liquidity to a market (become LP)
   * @param {string} marketId - Market ID
   * @param {number} amount - Amount of BB to add
   * @returns {Promise<Object>} LP confirmation
   */
  async addLiquidity(marketId, amount) {
    const result = await this.request('POST', `/markets/${marketId}/add-liquidity`, {
      amount,
    });

    console.log(`💧 Added ${amount} BB liquidity (your share: ${result.share_percentage})`);
    return result;
  }

  /**
   * Remove liquidity from a market
   * @param {string} marketId - Market ID
   * @param {number} shareFraction - Fraction of your share to remove (0.0-1.0)
   * @returns {Promise<Object>} Withdrawal confirmation
   */
  async removeLiquidity(marketId, shareFraction = 1.0) {
    return this.request('POST', `/markets/${marketId}/remove-liquidity`, {
      share_fraction: shareFraction,
    });
  }

  /**
   * Get LP info for a market
   * @param {string} marketId - Market ID
   * @returns {Promise<Object>} LP providers and shares
   */
  async getLPInfo(marketId) {
    return this.request('GET', `/lp/${marketId}/info`);
  }

  /**
   * Distribute collected fees to LPs
   * @param {string} marketId - Market ID
   * @returns {Promise<Object>} Distribution summary
   */
  async distributeLPFees(marketId) {
    return this.request('POST', `/lp/${marketId}/distribute`);
  }

  // ==========================================================================
  // ORACLE & RESOLUTION
  // ==========================================================================

  /**
   * Sign a resolution as an oracle (for multi-sig)
   * @param {string} marketId - Market ID
   * @param {number} winningOutcome - Winning outcome index
   * @param {string} evidence - Evidence URL or statement
   * @returns {Promise<Object>} Signature submission
   */
  async signResolution(marketId, winningOutcome, evidence = '') {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `resolve:${marketId}:${winningOutcome}:${timestamp}`;
    const signature = this.sign(message);

    return this.request('POST', `/markets/${marketId}/sign-resolution`, {
      oracle_address: this.address,
      signature,
      winning_outcome: winningOutcome,
      evidence,
      timestamp,
    });
  }

  /**
   * Resolve a market (single-sig or after multi-sig consensus)
   * @param {string} marketId - Market ID
   * @param {number} winningOutcome - Winning outcome index
   * @param {string} reason - Resolution reason
   * @returns {Promise<Object>} Resolution result
   */
  async resolveMarket(marketId, winningOutcome, reason = '') {
    const timestamp = Math.floor(Date.now() / 1000);
    this.nonce++;

    const message = `${this.address}:${marketId}:${winningOutcome}:${this.nonce}:${timestamp}`;
    const signature = this.sign(message);

    const result = await this.request('POST', `/markets/${marketId}/resolve`, {
      resolver_address: this.address,
      signature,
      winning_outcome: winningOutcome,
      resolution_reason: reason,
      nonce: this.nonce,
      timestamp,
    });

    console.log(`⚖️ Market ${marketId} resolved: outcome ${winningOutcome}`);
    return result;
  }

  /**
   * Propose a resolution (starts 24hr dispute window)
   * @param {string} marketId - Market ID
   * @param {number} outcome - Proposed outcome
   * @param {string} evidence - Evidence URL
   * @returns {Promise<Object>} Proposal confirmation
   */
  async proposeResolution(marketId, outcome, evidence = '') {
    return this.request('POST', `/markets/${marketId}/propose-resolution`, {
      outcome,
      evidence,
    });
  }

  /**
   * Dispute a pending resolution (requires 100 BB stake)
   * @param {string} marketId - Market ID
   * @param {string} reason - Dispute reason
   * @param {number} proposedOutcome - Your proposed correct outcome (optional)
   * @returns {Promise<Object>} Dispute confirmation
   */
  async disputeResolution(marketId, reason, proposedOutcome = null) {
    return this.request('POST', `/markets/${marketId}/dispute`, {
      disputer: this.address,
      reason,
      proposed_outcome: proposedOutcome,
    });
  }

  /**
   * Vote on a dispute (panel members only)
   * @param {string} marketId - Market ID
   * @param {string} disputeId - Dispute ID
   * @param {string} decision - 'accept_dispute', 'reject_dispute', 'void_market'
   * @param {string} reasoning - Your reasoning
   * @returns {Promise<Object>} Vote confirmation
   */
  async voteOnDispute(marketId, disputeId, decision, reasoning = '') {
    return this.request('POST', `/disputes/${disputeId}/vote`, {
      oracle_address: this.address,
      decision,
      reasoning,
    });
  }

  // ==========================================================================
  // INSURANCE FUND
  // ==========================================================================

  /**
   * File an insurance claim for a voided market
   * @param {string} marketId - Market ID
   * @param {number} amount - Claim amount
   * @param {string} reason - Claim reason
   * @returns {Promise<Object>} Claim details
   */
  async fileInsuranceClaim(marketId, amount, reason) {
    return this.request('POST', '/insurance/claim', {
      market_id: marketId,
      claimant: this.address,
      amount,
      reason,
    });
  }

  /**
   * Check insurance fund balance
   * @returns {Promise<Object>} Fund stats
   */
  async getInsuranceFundInfo() {
    return this.request('GET', '/insurance/fund');
  }

  /**
   * Dealer: Top up insurance fund
   * @param {number} amount - Amount to deposit
   * @returns {Promise<Object>} Deposit confirmation
   */
  async topUpInsuranceFund(amount) {
    return this.request('POST', '/insurance/fund/deposit', {
      amount,
    });
  }

  // ==========================================================================
  // ORACLE REGISTRY
  // ==========================================================================

  /**
   * Get oracle stats and reputation
   * @param {string} address - Oracle address (optional, defaults to your address)
   * @returns {Promise<Object>} Oracle reputation data
   */
  async getOracleStats(address = null) {
    const oracleAddress = address || this.address;
    return this.request('GET', `/oracles/${oracleAddress}/stats`);
  }

  /**
   * List all oracles and their performance
   * @returns {Promise<Array>} Oracle leaderboard
   */
  async listOracles() {
    return this.request('GET', '/oracles');
  }

  /**
   * Admin: Add an oracle to the whitelist
   * @param {string} address - Oracle address
   * @param {boolean} isAdmin - Whether oracle is admin
   * @returns {Promise<Object>} Confirmation
   */
  async addOracle(address, isAdmin = false) {
    return this.request('POST', '/admin/oracles', {
      address,
      is_admin: isAdmin,
    });
  }

  /**
   * Admin: Remove oracle from whitelist
   * @param {string} address - Oracle address
   * @returns {Promise<Object>} Confirmation
   */
  async removeOracle(address) {
    return this.request('DELETE', `/admin/oracles/${address}`);
  }

  // ==========================================================================
  // ACCOUNT & BALANCE
  // ==========================================================================

  /**
   * Get your balance
   * @returns {Promise<Object>} Balance details
   */
  async getBalance() {
    const result = await this.request('GET', `/balance/${this.address}`);
    console.log(`💰 Balance: ${result.available} BB (locked: ${result.locked} BB)`);
    return result;
  }

  /**
   * Get transaction history
   * @param {number} limit - Number of recent transactions
   * @returns {Promise<Array>} Transaction history
   */
  async getTransactions(limit = 50) {
    return this.request('GET', `/ledger/${this.address}?limit=${limit}`);
  }

  /**
   * Get all your positions across markets
   * @returns {Promise<Array>} All positions
   */
  async getAllPositions() {
    return this.request('GET', `/positions/${this.address}`);
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Calculate potential payout for a bet
   * @param {number} betAmount - Amount to bet
   * @param {number} currentPrice - Current price of outcome
   * @returns {number} Potential payout if outcome wins
   */
  calculatePayout(betAmount, currentPrice) {
    if (currentPrice === 0) return 0;
    return betAmount / currentPrice;
  }

  /**
   * Calculate odds from probability
   * @param {number} probability - Probability (0.0 - 1.0)
   * @returns {number} Decimal odds
   */
  probabilityToOdds(probability) {
    if (probability === 0) return 999;
    return 1.0 / probability;
  }

  /**
   * Format BB amount for display
   * @param {number} amount - Amount in BB
   * @returns {string} Formatted amount
   */
  formatBB(amount) {
    return `${amount.toLocaleString()} BB`;
  }

  /**
   * Pretty print market info
   */
  async printMarket(marketId) {
    const market = await this.getMarket(marketId);
    console.log('\n' + '='.repeat(60));
    console.log(`📊 ${market.title}`);
    console.log('='.repeat(60));
    console.log(`ID: ${market.id}`);
    console.log(`Category: ${market.market_category || 'main'}`);
    if (market.parent_event_id) {
      console.log(`Parent Event: ${market.parent_event_id}`);
    }
    console.log(`Status: ${market.market_status || 'Active'}`);
    console.log(`Total Volume: ${this.formatBB(market.total_volume)}`);
    console.log(`Total Bets: ${market.bet_count}`);
    
    if (market.cpmm_pool) {
      console.log('\n📈 Current Prices:');
      const prices = market.cpmm_pool.current_prices || [];
      market.options.forEach((option, i) => {
        const prob = (prices[i] * 100).toFixed(1);
        const odds = this.probabilityToOdds(prices[i]).toFixed(2);
        console.log(`  ${option}: ${prob}% (${odds}x)`);
      });
    }
    console.log('='.repeat(60) + '\n');
  }
}

// ==========================================================================
// EXPORTS
// ==========================================================================

module.exports = {
  Layer2SDK,
};

// ==========================================================================
// EXAMPLE USAGE
// ==========================================================================

if (require.main === module) {
  (async () => {
    console.log('🚀 BlackBook Layer 2 SDK - Example Usage\n');

    // Initialize SDK
    const sdk = new Layer2SDK({
      l2Url: 'http://localhost:1234',
      privateKey: Buffer.from('0'.repeat(64), 'hex'), // Replace with real key
      address: 'L2_542AB3537F3ACB2D6E4597DAF41615F148B9F8410A390EF73970806FEC6ED26F',
    });

    try {
      // Authenticate
      await sdk.authenticate();

      // Check balance
      await sdk.getBalance();

      // List markets
      const markets = await sdk.listMarkets();
      console.log(`\n📋 Found ${markets.length} active markets\n`);

      // Example: Create World Cup event with props
      // const event = await sdk.createParentEvent({
      //   title: 'Korea Republic vs Czechia',
      //   outcomes: ['Korea Republic', 'Draw', 'Czechia'],
      //   initialLiquidity: 50000,
      // });

      // const goalsProp = await sdk.createPropMarket({
      //   parentEventId: event.market_id,
      //   title: 'Total Goals - Over/Under 2.5',
      //   outcomes: ['Over 2.5', 'Under 2.5'],
      //   initialLiquidity: 10000,
      // });

      console.log('\n✅ SDK example completed successfully\n');
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  })();
}
