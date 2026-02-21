/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BLACKBOOK PREDICTION MARKETS SDK v4.0
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * SDK for BlackBook prediction markets supporting multiple currencies:
 *   - FanCredit (FC) - Entertainment only, NO cash value
 *   - BlackBook (BB) - Sweepstakes token, redeemable
 *   - USDC - Stablecoin
 * 
 * CPMM (Constant Product Market Maker) for zero-sum betting.
 * 
 * Usage:
 * 
 *   import { BlackBookMarkets, Currency } from './blackbook-markets.js';
 * 
 *   const markets = new BlackBookMarkets({
 *     apiUrl: 'https://l2.blackbook.gg',
 *     address: 'alice',
 *     signer: async (msg) => wallet.sign(msg)
 *   });
 * 
 *   // Browse markets
 *   const active = await markets.getActive();
 * 
 *   // Place bet with FanCredit
 *   await markets.bet('btc-100k', 0, 100, Currency.FC);
 * 
 *   // Get quote before betting
 *   const quote = await markets.getQuote('btc-100k', 0, 100, Currency.FC);
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const Currency = {
  FC: 'FC',                    // FanCredit - Entertainment only, no cash value
  BB: 'BB',                    // BlackBook - Sweepstakes, redeemable
  BLACKBOOK: 'BB',             // Alias
  USDC: 'USDC'                 // USD Coin stablecoin
};

export const MarketStatus = {
  PENDING: 'pending',          // Created but awaiting liquidity
  ACTIVE: 'active',            // Trading is open
  FROZEN: 'frozen',            // Trading halted (awaiting resolution)
  RESOLVED: 'resolved',        // Outcome determined, payouts complete
  CANCELLED: 'cancelled'       // Market voided, refunds issued
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SDK CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class BlackBookMarkets {
  /**
   * Initialize Markets SDK
   * @param {Object} config - Configuration
   * @param {string} config.apiUrl - L2 API URL
   * @param {string} config.address - User address or username
   * @param {Function} config.signer - Signing function for authenticated actions
   * @param {string} config.publicKey - Public key for verification
   */
  constructor(config) {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseKey = config.supabaseKey;
    this.l2Url = config.l2Url || 'http://localhost:1234';
    
    // Initialize Supabase client
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY MARKETS FROM SUPABASE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all markets from Supabase
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status
   * @param {string} options.gameType - Filter by game type
   * @param {number} options.limit - Limit results
   * @returns {Promise<Array>} Array of markets
   */
  async getMarkets(options = {}) {
    let query = this.supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.gameType) {
      query = query.eq('game_type', options.gameType);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch markets: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get active markets
   */
  async getActiveMarkets() {
    return this.getMarkets({ status: MarketStatus.ACTIVE });
  }

  /**
   * Get pending markets (awaiting activation)
   */
  async getPendingMarkets() {
    return this.getMarkets({ status: MarketStatus.PENDING });
  }

  /**
   * Get frozen markets (trading closed, awaiting resolution)
   */
  async getFrozenMarkets() {
    return this.getMarkets({ status: MarketStatus.FROZEN });
  }

  /**
   * Get resolved markets (completed with winner determined)
   */
  async getResolvedMarkets(limit = 20) {
    return this.getMarkets({ status: MarketStatus.RESOLVED, limit });
  }

  /**
   * Get single market by ID
   * @param {string} marketId - Market ID
   */
  async getMarket(marketId) {
    const { data, error } = await this.supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Market not found
      }
      throw new Error(`Failed to fetch market: ${error.message}`);
    }

    return data;
  }

  /**
   * Get markets by game type
   * @param {string} gameType - DUEL, BINGO, ROSTER, PORTFOLIO
   */
  async getMarketsByGameType(gameType) {
    return this.getMarkets({ gameType, status: MarketStatus.ACTIVE });
  }

  /**
   * Search markets by title
   * @param {string} searchTerm - Search term
   */
  async searchMarkets(searchTerm) {
    const { data, error } = await this.supabase
      .from('markets')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('status', MarketStatus.ACTIVE)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    return data || [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKET STATS & METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get market statistics
   * @param {string} marketId - Market ID
   */
  async getMarketStats(marketId) {
    // Query FanCredit transactions for this market
    const { data: transactions, error } = await this.supabase
      .from('fancredit_transactions')
      .select('*')
      .eq('market_id', marketId)
      .eq('transaction_type', 'MARKET_BET');

    if (error) {
      throw new Error(`Failed to fetch market stats: ${error.message}`);
    }

    const totalBets = transactions?.length || 0;
    const totalVolume = transactions?.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0) || 0;
    const uniqueBettors = new Set(transactions?.map(tx => tx.user_id)).size;

    return {
      marketId,
      totalBets,
      totalVolume,
      uniqueBettors,
      avgBetSize: totalBets > 0 ? totalVolume / totalBets : 0
    };
  }

  /**
   * Get participant count for a market
   * @param {string} marketId - Market ID
   */
  async getParticipantCount(marketId) {
    const { data, error } = await this.supabase
      .from('fancredit_transactions')
      .select('user_id')
      .eq('market_id', marketId)
      .eq('transaction_type', 'MARKET_BET');

    if (error) {
      return 0;
    }

    const uniqueUsers = new Set(data?.map(tx => tx.user_id));
    return uniqueUsers.size;
  }

  /**
   * Get leaderboard for a market (top bettors)
   * @param {string} marketId - Market ID
   * @param {number} limit - Number of results
   */
  async getMarketLeaderboard(marketId, limit = 10) {
    const { data, error } = await this.supabase
      .from('fancredit_transactions')
      .select('user_id, amount')
      .eq('market_id', marketId)
      .eq('transaction_type', 'MARKET_BET')
      .order('amount', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch leaderboard: ${error.message}`);
    }

    // Aggregate by user
    const userTotals = {};
    data?.forEach(tx => {
      const userId = tx.user_id;
      userTotals[userId] = (userTotals[userId] || 0) + Math.abs(tx.amount || 0);
    });

    return Object.entries(userTotals)
      .map(([userId, total]) => ({ userId, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIVE DATA FROM L2 SERVER (Optional)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get live market data from L2 server
   * (Use this for real-time prices, odds, etc.)
   * @param {string} marketId - Market ID
   */
  async getLiveMarket(marketId) {
    try {
      const res = await fetch(`${this.l2Url}/market/${marketId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.market || null;
    } catch (error) {
      console.warn('L2 server not available:', error.message);
      return null;
    }
  }

  /**
   * Get live markets list from L2 server
   * @param {string} status - Market status filter
   */
  async getLiveMarkets(status = 'active') {
    try {
      const res = await fetch(`${this.l2Url}/markets?status=${status}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.markets || [];
    } catch (error) {
      console.warn('L2 server not available:', error.message);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // L2 CONTESTS API - Primary for Real-Time Data
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all active contests from L2 server
   * @returns {Promise<Array>} Array of contests
   */
  async getContests() {
    try {
      const res = await fetch(`${this.l2Url}/contests`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      throw new Error(`Failed to fetch contests: ${error.message}`);
    }
  }

  /**
   * Get contest definitions (templates)
   * @returns {Promise<Object>} Contest definitions
   */
  async getContestDefinitions() {
    try {
      const res = await fetch(`${this.l2Url}/contest/definitions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      throw new Error(`Failed to fetch contest definitions: ${error.message}`);
    }
  }

  /**
   * Get a specific contest by ID
   * @param {string} contestId - Contest ID
   * @returns {Promise<Object>} Contest details
   */
  async getContest(contestId) {
    try {
      const res = await fetch(`${this.l2Url}/contest/${contestId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      throw new Error(`Failed to fetch contest: ${error.message}`);
    }
  }

  /**
   * Enter a contest
   * @param {Object} entry - Entry parameters
   * @param {string} entry.contestId - Contest ID
   * @param {string} entry.username - User's username
   * @param {Array<number>} entry.roster - Array of player IDs
   * @param {string} entry.signature - Ed25519 signature
   * @param {number} entry.timestamp - Unix timestamp
   * @param {string} entry.nonce - Unique nonce
   * @returns {Promise<Object>} Entry result
   */
  async enterContest({ contestId, username, roster, signature, timestamp, nonce }) {
    try {
      const res = await fetch(`${this.l2Url}/contest/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contest_id: contestId,
          user: username,
          roster,
          signature,
          timestamp,
          nonce
        })
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      return res.json();
    } catch (error) {
      throw new Error(`Failed to enter contest: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Format market display info
   * @param {Object} market - Market object
   */
  formatMarket(market) {
    return {
      id: market.id,
      title: market.title || market.name,
      description: market.description,
      gameType: market.game_type,
      status: market.status,
      entryFee: market.entry_fee,
      closesAt: market.closes_at,
      isActive: market.status === MarketStatus.ACTIVE,
      isFrozen: market.status === MarketStatus.FROZEN,
      isResolved: market.status === MarketStatus.RESOLVED
    };
  }

  /**
   * Check if market is bettable
   * @param {Object} market - Market object
   */
  isBettable(market) {
    if (!market) return false;
    if (market.status !== MarketStatus.ACTIVE) return false;
    
    // Check if market has closed
    if (market.closes_at) {
      const closesAt = new Date(market.closes_at);
      if (closesAt < new Date()) return false;
    }
    
    return true;
  }

  /**
   * Get market type icon
   * @param {string} gameType - Game type
   */
  getMarketIcon(gameType) {
    const icons = {
      DUEL: '⚔️',
      BINGO: '🎯',
      ROSTER: '📋',
      PORTFOLIO: '💼'
    };
    return icons[gameType] || '🎮';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export function createMarketsSDK(config) {
  return new BlackBookMarkets(config);
}

export default BlackBookMarkets;
