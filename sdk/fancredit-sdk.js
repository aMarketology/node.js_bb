/**
 * FanCredit SDK for BlackBook L2
 * 
 * Complete SDK for managing FanCredit (FC) operations on the frontend.
 * FC is entertainment-only currency with no cash value (sweepstakes compliant).
 * 
 * Features:
 * - Balance queries
 * - Transaction history
 * - Credit/debit operations
 * - Wallet management
 * - Supabase sync status
 * 
 * @version 1.0.0
 * @author BlackBook Team
 */

import axios from 'axios';

export class FanCreditSDK {
    /**
     * Initialize FanCredit SDK
     * @param {Object} config - Configuration options
     * @param {string} config.l2Url - L2 server URL (default: http://localhost:1234)
     * @param {string} config.supabaseUrl - Supabase URL (optional)
     * @param {string} config.supabaseKey - Supabase anon key (optional)
     */
    constructor(config = {}) {
        this.l2Url = config.l2Url || 'http://localhost:1234';
        this.supabaseUrl = config.supabaseUrl;
        this.supabaseKey = config.supabaseKey;
        
        // Axios instance for L2 API
        this.api = axios.create({
            baseURL: this.l2Url,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // ============================================================================
    // BALANCE & WALLET QUERIES
    // ============================================================================

    /**
     * Get FanCredit balance for a user
     * @param {string} userAddress - L2 address (e.g., L2_APOLLO123...)
     * @returns {Promise<Object>} Balance info { available, locked, total }
     */
    async getBalance(userAddress) {
        try {
            const response = await this.api.get(`/wallet/${userAddress}`);
            const fcLedger = response.data.fc_ledger || { available: 0, locked: 0 };
            
            return {
                available: fcLedger.available,
                locked: fcLedger.locked,
                total: fcLedger.available + fcLedger.locked,
                address: userAddress
            };
        } catch (error) {
            throw new Error(`Failed to get FC balance: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Get complete wallet information including playthrough tracking
     * @param {string} userAddress - L2 address
     * @returns {Promise<Object>} Complete wallet info
     */
    async getWallet(userAddress) {
        try {
            const response = await this.api.get(`/wallet/${userAddress}`);
            return {
                address: userAddress,
                fc: response.data.fc_ledger || { available: 0, locked: 0 },
                bb: response.data.bb_ledger || { available: 0, locked: 0 },
                playthrough: response.data.playthrough || {},
                exists: response.data.exists
            };
        } catch (error) {
            throw new Error(`Failed to get wallet: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Get FC balances for multiple users (batch query)
     * @param {string[]} userAddresses - Array of L2 addresses
     * @returns {Promise<Object[]>} Array of balance objects
     */
    async getBatchBalances(userAddresses) {
        const balances = await Promise.all(
            userAddresses.map(addr => this.getBalance(addr))
        );
        return balances;
    }

    // ============================================================================
    // TRANSACTION OPERATIONS (Dealer/Admin Only)
    // ============================================================================

    /**
     * Credit FanCredit to a user (dealer operation)
     * @param {string} userAddress - L2 address to credit
     * @param {number} amount - Amount of FC to credit
     * @param {string} dealerSignature - Dealer signature for authorization
     * @returns {Promise<Object>} Transaction result
     */
    async creditFC(userAddress, amount, dealerSignature) {
        try {
            const response = await this.api.post('/dealer/credit-fc', {
                user_address: userAddress,
                amount: amount,
                reason: 'Manual credit',
                dealer_signature: dealerSignature
            });
            
            return {
                success: true,
                address: userAddress,
                amount: amount,
                newBalance: response.data.new_balance,
                message: response.data.message
            };
        } catch (error) {
            throw new Error(`Failed to credit FC: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Grant promotional FanCredit (no purchase required)
     * @param {string} userAddress - L2 address
     * @param {number} amount - Promotional FC amount
     * @param {string} reason - Reason for grant (e.g., "Welcome bonus")
     * @returns {Promise<Object>} Grant result
     */
    async grantPromoFC(userAddress, amount, reason = 'Promotional') {
        return this.creditFC(userAddress, amount, `promo_${Date.now()}`);
    }

    // ============================================================================
    // CONTEST INTEGRATION
    // ============================================================================

    /**
     * Check if user has sufficient FC for contest entry
     * @param {string} userAddress - L2 address
     * @param {number} entryFee - Contest entry fee in FC
     * @returns {Promise<boolean>} True if sufficient balance
     */
    async canEnterContest(userAddress, entryFee) {
        const balance = await this.getBalance(userAddress);
        return balance.available >= entryFee;
    }

    /**
     * Get FC locked in active contests
     * @param {string} userAddress - L2 address
     * @returns {Promise<number>} Amount of FC locked
     */
    async getLockedFC(userAddress) {
        const balance = await this.getBalance(userAddress);
        return balance.locked;
    }

    // ============================================================================
    // TRANSACTION HISTORY
    // ============================================================================

    /**
     * Get FC transaction history for a user
     * @param {string} userAddress - L2 address
     * @returns {Promise<Object[]>} Array of transactions
     */
    async getTransactionHistory(userAddress) {
        try {
            const response = await this.api.get(`/wallet/${userAddress}/history`);
            
            // Filter for FC transactions only
            const fcTransactions = (response.data.transactions || []).filter(tx => 
                tx.tx_type.includes('FC') || tx.tx_type.includes('FanCoin')
            );
            
            return fcTransactions.map(tx => ({
                id: tx.tx_hash,
                type: tx.tx_type,
                amount: tx.amount,
                from: tx.from_addr,
                to: tx.to_addr,
                timestamp: tx.timestamp,
                description: this._getTransactionDescription(tx)
            }));
        } catch (error) {
            // If endpoint doesn't exist, return empty array
            return [];
        }
    }

    /**
     * Get human-readable transaction description
     * @private
     */
    _getTransactionDescription(tx) {
        const descriptions = {
            'CREDIT_FC': 'FanCredit credited',
            'DEBIT_FC': 'FanCredit debited',
            'CONTEST_JOIN': 'Joined contest',
            'CONTEST_WIN': 'Contest prize',
            'PROMO_FC': 'Promotional bonus',
            'PURCHASE_FC': 'Purchased FanCredit'
        };
        return descriptions[tx.tx_type] || tx.tx_type;
    }

    // ============================================================================
    // SUPABASE SYNC
    // ============================================================================

    /**
     * Check if FC balance is synced with Supabase
     * @param {string} userAddress - L2 address
     * @returns {Promise<Object>} Sync status
     */
    async checkSupabaseSync(userAddress) {
        if (!this.supabaseUrl || !this.supabaseKey) {
            return { synced: false, error: 'Supabase not configured' };
        }

        try {
            const l2Balance = await this.getBalance(userAddress);
            
            // Query Supabase
            const supabaseResponse = await axios.get(
                `${this.supabaseUrl}/rest/v1/fancredit?user_id=eq.${userAddress}`,
                {
                    headers: {
                        'apikey': this.supabaseKey,
                        'Authorization': `Bearer ${this.supabaseKey}`
                    }
                }
            );
            
            const supabaseData = supabaseResponse.data[0];
            
            if (!supabaseData) {
                return { synced: false, error: 'Not found in Supabase' };
            }
            
            const synced = supabaseData.balance === l2Balance.available;
            
            return {
                synced,
                l2Balance: l2Balance.available,
                supabaseBalance: supabaseData.balance,
                difference: Math.abs(l2Balance.available - supabaseData.balance)
            };
        } catch (error) {
            return { synced: false, error: error.message };
        }
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Format FC amount for display
     * @param {number} amount - FC amount
     * @returns {string} Formatted string (e.g., "1,234 FC")
     */
    formatFC(amount) {
        return `${amount.toLocaleString()} FC`;
    }

    /**
     * Validate L2 address format
     * @param {string} address - Address to validate
     * @returns {boolean} True if valid L2 address
     */
    isValidAddress(address) {
        return /^L2_[A-F0-9]{40}$/i.test(address);
    }

    /**
     * Health check for L2 server
     * @returns {Promise<boolean>} True if server is healthy
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
     * @returns {Promise<Object>} Server stats
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
 * Create a default FanCredit SDK instance
 * @param {Object} config - Configuration options
 * @returns {FanCreditSDK} SDK instance
 */
export function createFanCreditSDK(config) {
    return new FanCreditSDK(config);
}

export default FanCreditSDK;
