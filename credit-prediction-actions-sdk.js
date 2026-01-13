/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CREDIT PREDICTION ACTIONS SDK
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Frontend SDK for BlackBook L2 - Credit Line Trading & Prediction Markets
 * 
 * Usage:
 *   const sdk = new CreditPredictionSDK({
 *     l2Url: 'http://localhost:1234',
 *     supabaseUrl: 'https://xxx.supabase.co',
 *     supabaseKey: 'your-anon-key',
 *     address: 'user-wallet-address',
 *     signer: async (msg) => wallet.sign(msg)  // from your L1 wallet
 *   });
 * 
 *   await sdk.openCredit(1000);
 *   await sdk.bet('market-id', 0, 100);
 *   await sdk.settleCredit();
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SDK CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class CreditPredictionSDK {
  constructor(config) {
    this.l2Url = (config.l2Url || 'http://localhost:1234').replace(/\/$/, '');
    this.address = config.address;
    this.signer = config.signer;
    this.listeners = [];
    
    // Supabase for markets
    if (config.supabaseUrl && config.supabaseKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    }
    
    // Active credit session tracking
    this.activeSession = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNING
  // ═══════════════════════════════════════════════════════════════════════════

  async signTransaction(tx) {
    const message = JSON.stringify(tx);
    const signature = await this.signer(message);
    return { tx, signature, signer: this.address };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BALANCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get L2 balance for connected wallet
   */
  async getBalance() {
    const res = await this.l2Get(`/balance/${this.address}`);
    return {
      available: res.available || res.balance || 0,
      locked: res.locked || 0,
      hasActiveCredit: res.has_active_credit || false
    };
  }

  /**
   * Get all positions for connected wallet
   */
  async getPositions() {
    const res = await this.l2Get(`/positions/${this.address}`);
    return res.positions || [];
  }

  /**
   * Get full portfolio (balance + positions + P&L)
   */
  async getPortfolio() {
    const [balance, positions] = await Promise.all([
      this.getBalance(),
      this.getPositions()
    ]);
    
    const totalValue = balance.available + positions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    const totalPnl = positions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0);
    
    return { balance, positions, totalValue, totalPnl };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREDIT LINE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if user has an active credit session
   */
  async getCreditSession() {
    try {
      const res = await this.l2Get(`/credit/session/${this.address}`);
      this.activeSession = res.session || null;
      return this.activeSession;
    } catch {
      this.activeSession = null;
      return null;
    }
  }

  /**
   * Open a credit line session
   * @param {number} amount - Amount of credit to request
   */
  async openCredit(amount) {
    const tx = {
      action: 'credit_open',
      wallet: this.address,
      amount,
      timestamp: Date.now()
    };
    
    const signed = await this.signTransaction(tx);
    const res = await this.l2Post('/credit/open', signed);
    
    if (res.success !== false) {
      this.activeSession = {
        sessionId: res.session_id,
        creditAmount: res.credit_amount || amount,
        virtualBalance: res.virtual_balance || amount,
        openedAt: Date.now()
      };
      
      this.emit({ type: 'credit_opened', session: this.activeSession });
    }
    
    return {
      success: res.success !== false,
      sessionId: res.session_id,
      creditAmount: res.credit_amount || amount,
      virtualBalance: res.virtual_balance || amount,
      message: res.message || 'Credit opened'
    };
  }

  /**
   * Settle and close the credit session
   */
  async settleCredit() {
    const tx = {
      action: 'credit_settle',
      wallet: this.address,
      timestamp: Date.now()
    };
    
    const signed = await this.signTransaction(tx);
    const res = await this.l2Post('/credit/settle', signed);
    
    const pnl = res.pnl || 0;
    
    if (res.success !== false) {
      this.activeSession = null;
      this.emit({ type: 'credit_settled', pnl });
    }
    
    return {
      success: res.success !== false,
      sessionId: res.session_id || '',
      pnl,
      message: res.message || 'Credit settled'
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADING (CPMM)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get a quote before placing a bet
   * @param {string} marketId - Market ID
   * @param {number} outcomeIndex - Which outcome (0, 1, etc.)
   * @param {number} amount - Amount to spend
   */
  async getQuote(marketId, outcomeIndex, amount) {
    const res = await this.l2Get(`/quote/${marketId}/${outcomeIndex}/${amount}`);
    return {
      shares: res.shares || 0,
      avgPrice: res.avg_price || res.avgPrice || 0,
      priceImpact: res.price_impact || res.priceImpact || 0,
      fee: res.fee || 0,
      total: res.total || amount
    };
  }

  /**
   * Place a bet (buy outcome shares)
   * @param {string} marketId - Market ID
   * @param {number} outcomeIndex - Which outcome (0, 1, etc.)
   * @param {number} amount - Amount to spend
   */
  async bet(marketId, outcomeIndex, amount) {
    const tx = {
      action: 'buy',
      wallet: this.address,
      market_id: marketId,
      outcome_index: outcomeIndex,
      amount,
      timestamp: Date.now()
    };
    
    const signed = await this.signTransaction(tx);
    const res = await this.l2Post('/cpmm/buy', signed);
    
    const result = {
      success: res.success !== false,
      shares: res.shares || 0,
      avgPrice: res.avg_price || 0,
      newPrices: res.new_prices || res.prices || [],
      txHash: res.tx_hash
    };
    
    if (result.success) {
      this.emit({ type: 'bet_placed', result, marketId, outcomeIndex, amount });
    }
    
    return result;
  }

  /**
   * Sell outcome shares
   * @param {string} marketId - Market ID
   * @param {number} outcomeIndex - Which outcome
   * @param {number} shares - Number of shares to sell
   */
  async sell(marketId, outcomeIndex, shares) {
    const tx = {
      action: 'sell',
      wallet: this.address,
      market_id: marketId,
      outcome_index: outcomeIndex,
      shares,
      timestamp: Date.now()
    };
    
    const signed = await this.signTransaction(tx);
    const res = await this.l2Post('/cpmm/sell', signed);
    
    return {
      success: res.success !== false,
      shares: res.shares || 0,
      avgPrice: res.avg_price || 0,
      newPrices: res.new_prices || res.prices || [],
      txHash: res.tx_hash
    };
  }

  /**
   * Get current prices for a market
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
  async getPool(marketId) {
    const res = await this.l2Get(`/cpmm/pool/${marketId}`);
    return {
      reserves: res.reserves || [],
      k: res.k || 0,
      liquidity: res.liquidity || 0
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKETS (from Supabase with L2 fallback)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all active markets
   */
  async getMarkets() {
    if (!this.supabase) {
      // L2 fallback - returns server-filtered active markets
      const res = await this.l2Get('/markets');
      return res.markets || [];
    }
    
    const { data, error } = await this.supabase
      .from('pmarket')
      .select('*')
      .eq('market_type', 'main')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch markets: ${error.message}`);
    return data || [];
  }

  /**
   * Get pending markets (L2 only - markets awaiting liquidity)
   */
  async getPendingMarkets() {
    const res = await this.l2Get('/markets/pending');
    return res.markets || [];
  }

  /**
   * Get frozen markets (L2 only - past closes_at, awaiting resolution)
   */
  async getFrozenMarkets() {
    const res = await this.l2Get('/markets/frozen');
    return res.markets || [];
  }

  /**
   * Get resolved markets (L2 only - completed markets)
   * @param {object} options - { sort: 'closes_at'|'created_at', order: 'asc'|'desc' }
   */
  async getResolvedMarkets(options = {}) {
    const params = new URLSearchParams();
    if (options.sort) params.append('sort', options.sort);
    if (options.order) params.append('order', options.order);
    const query = params.toString();
    const res = await this.l2Get(`/markets/resolved${query ? '?' + query : ''}`);
    return res.markets || [];
  }

  /**
   * Get featured markets
   */
  async getFeaturedMarkets() {
    if (!this.supabase) return [];
    
    const { data, error } = await this.supabase
      .from('pmarket')
      .select('*')
      .eq('status', 'active')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch featured: ${error.message}`);
    return data || [];
  }

  /**
   * Get markets by category
   * @param {string} category - Category name
   */
  async getMarketsByCategory(category) {
    if (!this.supabase) return [];
    
    const { data, error } = await this.supabase
      .from('pmarket')
      .select('*')
      .eq('category', category)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch: ${error.message}`);
    return data || [];
  }

  /**
   * Search markets
   * @param {string} query - Search query
   */
  async searchMarkets(query) {
    if (!this.supabase) return [];
    
    const { data, error } = await this.supabase
      .from('pmarket')
      .select('*')
      .eq('status', 'active')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(50);
    
    if (error) throw new Error(`Search failed: ${error.message}`);
    return data || [];
  }

  /**
   * Get single market by ID (with L2 prices and props)
   * @param {string|number} marketId - Market ID
   */
  async getMarket(marketId) {
    // Always fetch from L2 to get live prices and props
    const l2Data = await this.l2Get(`/market/${marketId}`);
    
    if (!this.supabase) {
      return l2Data;
    }
    
    // Optionally enrich with Supabase metadata
    const { data: sbData } = await this.supabase
      .from('pmarket')
      .select('*')
      .eq('market_id', marketId)
      .single();
    
    return {
      ...sbData,
      ...l2Data,  // L2 data takes precedence (live prices, props)
    };
  }

  /**
   * Get market with all its prop bets (L2 endpoint)
   * @param {string|number} marketId - Parent market ID
   */
  async getMarketWithProps(marketId) {
    // L2 /market/:id now includes props automatically
    return this.getMarket(marketId);
  }

  /**
   * Create a prop bet on a market (L2)
   * Requires 100 $BC minimum liquidity
   * @param {string|number} parentMarketId - Parent market ID
   * @param {object} propData - { title, description, outcomes, initialLiquidity, closesAt, resolutionCriteria }
   */
  async createProp(parentMarketId, propData) {
    const tx = {
      action: 'create_prop',
      wallet: this.address,
      parent_market_id: parentMarketId,
      title: propData.title,
      description: propData.description || '',
      outcomes: propData.outcomes || ['Yes', 'No'],
      initial_liquidity: propData.initialLiquidity || 100,
      closes_at: propData.closesAt,
      resolution_criteria: propData.resolutionCriteria || '',
      timestamp: Date.now()
    };
    
    const signed = await this.signTransaction(tx);
    const res = await this.l2Post(`/market/${parentMarketId}/prop/create`, signed);
    
    const result = {
      success: res.success !== false,
      propId: res.prop_id || res.market_id,
      message: res.message || 'Prop created'
    };
    
    if (result.success) {
      this.emit({ type: 'prop_created', result, parentMarketId });
    }
    
    return result;
  }
    
  /**
   * Get all categories with counts
   */
  async getCategories() {
    if (!this.supabase) return [];
    
    const { data, error } = await this.supabase
      .from('pmarket')
      .select('category')
      .eq('market_type', 'main')
      .eq('status', 'active');
    
    if (error) return [];
    
    const counts = (data || []).reduce((acc, row) => {
      acc[row.category] = (acc[row.category] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER PROP BETS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Propose a new user prop bet (uses L2 createProp)
   * Requires 100 $BC minimum liquidity
   * @param {object} proposal - Prop bet details
   */
  async proposeProp(proposal) {
    return this.createProp(proposal.parentMarketId, {
      title: proposal.title,
      description: proposal.description,
      outcomes: proposal.outcomes,
      initialLiquidity: proposal.minLiquidity || 100,
      closesAt: proposal.closesAt,
      resolutionCriteria: proposal.resolutionCriteria || ''
    });
  }

  /**
   * Get user's proposed props
   */
  async getMyProps() {
    if (!this.supabase) return [];
    
    const { data, error } = await this.supabase
      .from('pmarket')
      .select('*')
      .eq('creator_address', this.address)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data || [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REALTIME SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Subscribe to market updates
   * @param {number} marketId - Market to watch
   * @param {function} callback - Called on updates
   * @returns {function} Unsubscribe function
   */
  subscribeToMarket(marketId, callback) {
    if (!this.supabase) return () => {};
    
    const subscription = this.supabase
      .channel(`market-${marketId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pmarket',
        filter: `market_id=eq.${marketId}`
      }, (payload) => {
        if (payload.new) callback(payload.new);
      })
      .subscribe();
    
    return () => subscription.unsubscribe();
  }

  /**
   * Subscribe to all market updates
   * @param {function} callback - Called on updates (market, eventType)
   * @returns {function} Unsubscribe function
   */
  subscribeToAllMarkets(callback) {
    if (!this.supabase) return () => {};
    
    const subscription = this.supabase
      .channel('all-markets')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pmarket'
      }, (payload) => {
        const market = payload.new || payload.old;
        if (market) callback(market, payload.eventType);
      })
      .subscribe();
    
    return () => subscription.unsubscribe();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Subscribe to SDK events
   * @param {function} callback - Event handler
   * @returns {function} Unsubscribe function
   */
  on(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  emit(event) {
    this.listeners.forEach(l => l(event));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTH
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check L2 server health
   */
  async health() {
    try {
      const res = await this.l2Get('/health');
      return { healthy: true, blockHeight: res.block_height };
    } catch {
      return { healthy: false };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HTTP HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  async l2Get(path) {
    const res = await fetch(`${this.l2Url}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`L2 GET failed: ${await res.text()}`);
    return res.json();
  }

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
// FACTORY & DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export function createCreditPredictionSDK(config) {
  return new CreditPredictionSDK(config);
}

export default CreditPredictionSDK;
