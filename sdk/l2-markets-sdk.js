/**
 * L2 Markets SDK for BlackBook
 * 
 * Complete SDK for managing fantasy contests, sweepstakes, and prediction markets.
 * Supports both FanCredit (entertainment) and BlackBook (real money) currencies.
 * 
 * Features:
 * - Contest lifecycle (spawn, fund, enter, resolve)
 * - Template management
 * - Live contest queries
 * - User contest history
 * - Oracle integration
 * - Real-time event tracking
 * 
 * @version 1.0.0
 * @author BlackBook Team
 */

import axios from 'axios';

export class L2MarketsSDK {
    /**
     * Initialize L2 Markets SDK
     * @param {Object} config - Configuration options
     * @param {string} config.l2Url - L2 server URL (default: http://localhost:1234)
     * @param {string} config.dealerAddress - Dealer L2 address for admin operations
     */
    constructor(config = {}) {
        this.l2Url = config.l2Url || 'http://localhost:1234';
        this.dealerAddress = config.dealerAddress;
        
        this.api = axios.create({
            baseURL: this.l2Url,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // ============================================================================
    // CONTEST QUERIES
    // ============================================================================

    /**
     * Get all active contests
     * @param {Object} filters - Optional filters
     * @param {string} filters.status - Filter by status (DRAFT, LIVE, LOCKED, RESOLVED)
     * @param {string} filters.currency - Filter by currency (FC or BB)
     * @returns {Promise<Object[]>} Array of contests
     */
    async getContests(filters = {}) {
        try {
            const response = await this.api.get('/contests');
            let contests = response.data.contests || [];
            
            // Apply filters
            if (filters.status) {
                contests = contests.filter(c => c.status === filters.status);
            }
            if (filters.currency) {
                contests = contests.filter(c => 
                    (filters.currency === 'FC' && c.currency === 'FanCoin') ||
                    (filters.currency === 'BB' && c.currency === 'BlackBook')
                );
            }
            
            return contests;
        } catch (error) {
            throw new Error(`Failed to get contests: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Get specific contest details
     * @param {string} contestId - Contest ID
     * @returns {Promise<Object>} Contest details
     */
    async getContest(contestId) {
        try {
            const response = await this.api.get(`/contest/${contestId}`);
            return this._enrichContestData(response.data);
        } catch (error) {
            throw new Error(`Failed to get contest: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Get user's contests
     * @param {string} userAddress - L2 address
     * @returns {Promise<Object[]>} User's contests
     */
    async getUserContests(userAddress) {
        try {
            const response = await this.api.get(`/user/${userAddress}/contests`);
            return response.data.contests || [];
        } catch (error) {
            throw new Error(`Failed to get user contests: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Get live contests (accepting entries)
     * @returns {Promise<Object[]>} Live contests
     */
    async getLiveContests() {
        return this.getContests({ status: 'LIVE' });
    }

    // ============================================================================
    // CONTEST LIFECYCLE (Dealer Operations)
    // ============================================================================

    /**
     * Spawn a new contest from template
     * @param {Object} params - Contest parameters
     * @param {string} params.templateId - Template ID to use
     * @param {Object} params.matchEvent - Match/event details
     * @param {string} params.matchEvent.name - Event name
     * @param {string} params.matchEvent.sport - Sport type
     * @param {number} params.matchEvent.startTime - Unix timestamp
     * @param {number} params.matchEvent.endTime - Unix timestamp
     * @param {number[]} params.matchEvent.playerIds - Available player IDs
     * @param {string} params.dealerSignature - Dealer signature
     * @returns {Promise<Object>} Spawned contest
     */
    async spawnContest(params) {
        try {
            const response = await this.api.post('/dealer/contest/spawn', {
                template_id: params.templateId,
                match_event: params.matchEvent,
                dealer_signature: params.dealerSignature || 'auto'
            });
            
            return {
                success: true,
                contestId: response.data.contest_id,
                status: response.data.status,
                entryFee: response.data.entry_fee,
                currency: response.data.currency,
                minLiquidity: response.data.min_liquidity_required,
                message: response.data.message
            };
        } catch (error) {
            throw new Error(`Failed to spawn contest: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Fund contest liquidity (DRAFT → LIVE transition)
     * @param {string} contestId - Contest ID
     * @param {number} amount - Liquidity amount
     * @param {string} dealerSignature - Dealer signature
     * @returns {Promise<Object>} Funding result
     */
    async fundContestLiquidity(contestId, amount, dealerSignature) {
        try {
            const response = await this.api.post(`/dealer/contest/${contestId}/fund-liquidity`, {
                amount: amount,
                source: 'DealerPool',
                dealer_signature: dealerSignature || 'auto'
            });
            
            return {
                success: true,
                contestId: response.data.contest_id,
                status: response.data.status,
                liquidityFunded: response.data.liquidity_funded,
                currency: response.data.currency,
                message: response.data.message
            };
        } catch (error) {
            throw new Error(`Failed to fund liquidity: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Resolve contest and distribute prizes (Oracle operation)
     * @param {string} contestId - Contest ID
     * @param {Object} scores - Map of user addresses to scores
     * @param {string} dealerSignature - Oracle/dealer signature
     * @returns {Promise<Object>} Resolution result with payouts
     */
    async resolveContest(contestId, scores, dealerSignature) {
        try {
            const response = await this.api.post(`/dealer/contest/${contestId}/resolve`, {
                scores: scores,
                dealer_signature: dealerSignature || 'auto'
            });
            
            return {
                success: true,
                contestId: response.data.contest_id,
                status: response.data.status,
                totalPool: response.data.total_pool,
                currency: response.data.currency,
                payouts: response.data.payouts,
                message: response.data.message
            };
        } catch (error) {
            throw new Error(`Failed to resolve contest: ${error.response?.data || error.message}`);
        }
    }

    // ============================================================================
    // CONTEST ENTRY (User Operations)
    // ============================================================================

    /**
     * Enter a contest
     * @param {Object} params - Entry parameters
     * @param {string} params.contestId - Contest ID
     * @param {string} params.userAddress - User's L2 address
     * @param {number[]} params.roster - Array of player IDs (squad)
     * @param {string} params.signature - User signature (optional for test addresses)
     * @returns {Promise<Object>} Entry result
     */
    async enterContest(params) {
        try {
            const response = await this.api.post('/contest/enter', {
                pub_key: params.userAddress,
                signature: params.signature || 'mock',
                timestamp: Math.floor(Date.now() / 1000),
                contest_id: params.contestId,
                user: params.userAddress,
                roster: params.roster
            });
            
            return {
                success: true,
                message: response.data.message
            };
        } catch (error) {
            throw new Error(`Failed to enter contest: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Check if user can enter a contest
     * @param {string} contestId - Contest ID
     * @param {string} userAddress - User's L2 address
     * @returns {Promise<Object>} Eligibility info
     */
    async canEnterContest(contestId, userAddress) {
        try {
            const contest = await this.getContest(contestId);
            
            // Check if contest is accepting entries
            if (contest.status !== 'LIVE' && contest.status !== 'Open') {
                return {
                    canEnter: false,
                    reason: 'Contest is not accepting entries'
                };
            }
            
            // Check if already entered
            const alreadyEntered = contest.participants?.some(p => 
                p.address === userAddress
            );
            
            if (alreadyEntered) {
                return {
                    canEnter: false,
                    reason: 'Already entered this contest'
                };
            }
            
            // Check if full
            if (contest.participants?.length >= contest.max_participants) {
                return {
                    canEnter: false,
                    reason: 'Contest is full'
                };
            }
            
            return {
                canEnter: true,
                entryFee: contest.entry_fee,
                currency: contest.currency,
                spotsRemaining: contest.max_participants - (contest.participants?.length || 0)
            };
        } catch (error) {
            return {
                canEnter: false,
                reason: error.message
            };
        }
    }

    // ============================================================================
    // TEMPLATES
    // ============================================================================

    /**
     * Get all contest templates
     * @returns {Promise<Object[]>} Array of templates
     */
    async getTemplates() {
        try {
            const response = await this.api.get('/dealer/templates');
            return response.data.templates || [];
        } catch (error) {
            throw new Error(`Failed to get templates: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Create a new contest template
     * @param {Object} template - Template configuration
     * @returns {Promise<Object>} Created template
     */
    async createTemplate(template) {
        try {
            const response = await this.api.post('/dealer/template/create', template);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create template: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Toggle template auto-publish
     * @param {string} templateId - Template ID
     * @param {boolean} autoPublish - Enable/disable auto-publish
     * @returns {Promise<Object>} Updated template
     */
    async toggleTemplate(templateId, autoPublish) {
        try {
            const response = await this.api.post(`/dealer/template/${templateId}/toggle`, {
                auto_publish: autoPublish,
                dealer_signature: 'auto'
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to toggle template: ${error.response?.data || error.message}`);
        }
    }

    // ============================================================================
    // LIQUIDITY MANAGEMENT
    // ============================================================================

    /**
     * Get liquidity pool status
     * @returns {Promise<Object>} Liquidity pool balances
     */
    async getLiquidityStatus() {
        try {
            const response = await this.api.get('/dealer/liquidity/status');
            return {
                bb: {
                    pool: response.data.bb_pool,
                    available: response.data.bb_available
                },
                fc: {
                    pool: response.data.fc_pool,
                    available: response.data.fc_available
                },
                allocated: response.data.allocated || {}
            };
        } catch (error) {
            throw new Error(`Failed to get liquidity status: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Fund liquidity pool
     * @param {string} currency - Currency type (FC or BB)
     * @param {number} amount - Amount to fund
     * @param {string} dealerSignature - Dealer signature
     * @returns {Promise<Object>} Funding result
     */
    async fundLiquidity(currency, amount, dealerSignature) {
        try {
            const response = await this.api.post('/dealer/liquidity/fund', {
                currency: currency,
                amount: amount,
                source: 'DealerReserve',
                dealer_address: this.dealerAddress,
                dealer_signature: dealerSignature || 'auto'
            });
            
            return {
                success: true,
                amountAdded: response.data.amount_added,
                newBalance: response.data.new_balance,
                currency: response.data.currency
            };
        } catch (error) {
            throw new Error(`Failed to fund liquidity: ${error.response?.data || error.message}`);
        }
    }

    // ============================================================================
    // EVENTS & SPORTS
    // ============================================================================

    /**
     * Create a World Cup match event
     * @param {Object} params - Match parameters
     * @returns {Object} Match event object for contest spawning
     */
    createWorldCupEvent(params) {
        return {
            name: params.matchName,
            sport: 'World Cup',
            start_time: params.startTime || Math.floor(Date.now() / 1000) + 3600,
            end_time: params.endTime || Math.floor(Date.now() / 1000) + 9000,
            player_ids: params.playerIds
        };
    }

    /**
     * Create an NBA match event
     * @param {Object} params - Match parameters
     * @returns {Object} Match event object
     */
    createNBAEvent(params) {
        return {
            name: params.matchName,
            sport: 'NBA',
            start_time: params.startTime || Math.floor(Date.now() / 1000) + 3600,
            end_time: params.endTime || Math.floor(Date.now() / 1000) + 10800,
            player_ids: params.playerIds
        };
    }

    /**
     * Create a generic sports event
     * @param {Object} params - Event parameters
     * @returns {Object} Event object
     */
    createSportsEvent(params) {
        return {
            name: params.name,
            sport: params.sport,
            start_time: params.startTime,
            end_time: params.endTime,
            player_ids: params.playerIds || []
        };
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Enrich contest data with computed fields
     * @private
     */
    _enrichContestData(contest) {
        return {
            ...contest,
            spotsAvailable: contest.max_participants - (contest.participants?.length || 0),
            isFull: (contest.participants?.length || 0) >= contest.max_participants,
            totalPrizePool: contest.entry_fee * (contest.participants?.length || 0),
            currencySymbol: contest.currency === 'BlackBook' ? 'BB' : 'FC',
            statusLabel: this._getStatusLabel(contest.status)
        };
    }

    /**
     * Get human-readable status label
     * @private
     */
    _getStatusLabel(status) {
        const labels = {
            'Cancelled': 'DRAFT',
            'Open': 'LIVE',
            'Locked': 'LOCKED',
            'Settled': 'RESOLVED'
        };
        return labels[status] || status;
    }

    /**
     * Format currency amount
     * @param {number} amount - Amount
     * @param {string} currency - Currency type (FC or BB)
     * @returns {string} Formatted string
     */
    formatAmount(amount, currency) {
        const symbol = currency === 'BB' ? 'BB' : 'FC';
        return `${amount.toLocaleString()} ${symbol}`;
    }

    /**
     * Calculate prize distribution
     * @param {number} totalPool - Total prize pool
     * @param {number[]} structure - Prize structure percentages (e.g., [0.5, 0.3, 0.2])
     * @returns {number[]} Prize amounts
     */
    calculatePrizes(totalPool, structure = [0.50, 0.30, 0.20]) {
        return structure.map(pct => totalPool * pct);
    }

    /**
     * Health check for L2 server
     * @returns {Promise<boolean>} True if healthy
     */
    async healthCheck() {
        try {
            const response = await this.api.get('/health');
            return response.data.status === 'ok';
        } catch (error) {
            return false;
        }
    }

    /**
     * Get server statistics
     * @returns {Promise<Object>} Server stats including contest counts
     */
    async getStats() {
        try {
            const response = await this.api.get('/ledger/summary');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get stats: ${error.message}`);
        }
    }
}

// ============================================================================
// EXPORT DEFAULT INSTANCE
// ============================================================================

/**
 * Create L2 Markets SDK instance
 * @param {Object} config - Configuration options
 * @returns {L2MarketsSDK} SDK instance
 */
export function createL2MarketsSDK(config) {
    return new L2MarketsSDK(config);
}

export default L2MarketsSDK;
