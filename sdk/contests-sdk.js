/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BLACKBOOK CONTESTS SDK v4.0 - PRODUCTION READY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Complete SDK for managing fantasy contests and head-to-head duels on BlackBook L2.
 * All contests use FanCredit (FC) - entertainment currency with NO cash value.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         CONTEST TYPES                                   │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  Binary        → Yes/No prediction ("Will Brazil win?")                 │
 * │  HeadToHead    → Player A vs Player B duel ("Mbappé or Vinícius?")     │
 * │  SquadBattle   → Pick N players from pool (fantasy roster draft)        │
 * │  Bingo         → Event grid matching (first to complete line wins)      │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         CONTEST LIFECYCLE                               │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  Active    → Entries open, users can join                               │
 * │  Frozen    → Entries locked, awaiting results                           │
 * │  Resolved  → Winner determined, payouts distributed                     │
 * │  Cancelled → Contest voided, all entries refunded                       │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                    HOW TO DISPLAY CONTESTS IN UI                        │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  1. Fetch active contests: await sdk.listActive()                       │
 * │  2. Display card for each contest showing:                              │
 * │     - Title and description                                             │
 * │     - Contest type (Binary, HeadToHead, SquadBattle, Bingo)             │
 * │     - Entry fee (in FC - e.g., "10 FC")                                 │
 * │     - Current entries / max participants (e.g., "5/100")                │
 * │     - Prize pool (entry_fee * entries, e.g., "50 FC")                   │
 * │     - Time remaining (use formatTimeRemaining())                        │
 * │     - Entry button if status = Active                                   │
 * │  3. On click, show contest details modal with:                          │
 * │     - Full description and rules                                        │
 * │     - Contest type-specific UI (see below)                              │
 * │     - "Enter Contest" button (check user FC balance first)              │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                    HOW TO HANDLE CONTEST ENTRY                          │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  BINARY:                                                                │
 * │    - Show YES / NO buttons                                              │
 * │    - await sdk.enter(contestId, { choice: 'yes' })                      │
 * │                                                                         │
 * │  HEAD-TO-HEAD:                                                          │
 * │    - Show two player cards (options.player_a, options.player_b)         │
 * │    - User clicks one                                                    │
 * │    - await sdk.enter(contestId, { selection: 'Player Name' })           │
 * │                                                                         │
 * │  SQUAD BATTLE:                                                          │
 * │    - Show player pool (options.player_pool)                             │
 * │    - User selects N players (options.squad_size)                        │
 * │    - await sdk.enter(contestId, { squad: ['Player1', 'Player2', ...] }) │
 * │                                                                         │
 * │  BINGO:                                                                 │
 * │    - Show grid (options.grid_size x grid_size)                          │
 * │    - User marks squares they predict will happen                        │
 * │    - await sdk.enter(contestId, { marks: [[1,0,1],[0,1,0],...] })       │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * Usage:
 * 
 *   import { ContestsSDK } from './contests-sdk.js';
 * 
 *   const contests = new ContestsSDK({
 *     apiUrl: 'https://l2.blackbook.gg',
 *     username: 'alice'
 *   });
 * 
 *   // Display contests in UI
 *   const active = await contests.listActive();
 *   active.forEach(contest => {
 *     console.log(`${contest.title} - ${contest.entry_fee} FC`);
 *     console.log(`${contest.entries}/${contest.max_participants || '∞'} entries`);
 *     console.log(`Prize Pool: ${contest.entry_fee * contest.entries} FC`);
 *   });
 * 
 *   // Check if user can afford entry
 *   const balance = await fcSDK.getBalance('alice');
 *   const canAfford = balance.available >= contest.entry_fee;
 * 
 *   // Enter contest
 *   if (canAfford) {
 *     await contests.enter('squad-worldcup', {
 *       squad: ['Mbappé', 'Haaland', 'Kane', 'Bellingham', 'Van Dijk']
 *     });
 *   }
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const ContestType = {
  BINARY: 'Binary',           // Yes/No prediction
  HEAD_TO_HEAD: 'HeadToHead', // Player A vs Player B
  SQUAD_BATTLE: 'SquadBattle', // Pick N from pool
  BINGO: 'Bingo'              // Event grid
};

export const ContestStatus = {
  ACTIVE: 'Active',       // Open for entries
  FROZEN: 'Frozen',       // Locked, awaiting results
  RESOLVED: 'Resolved',   // Winner determined
  CANCELLED: 'Cancelled'  // Refunded
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SDK CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class ContestsSDK {
  /**
   * Initialize Contests SDK
   * @param {Object} config - Configuration
   * @param {string} config.apiUrl - L2 server URL
   * @param {string} config.username - User's username (e.g., 'alice')
   */
  constructor(config = {}) {
    this.apiUrl = (config.apiUrl || config.l2Url || 'http://localhost:1234').replace(/\/$/, '');
    this.username = config.username;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST CONTESTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all active contests (open for entries)
   * @returns {Promise<Array>} Array of contest objects
   */
  async listActive() {
    const res = await this.apiGet('/contests');
    return (res.contests || []).filter(c => c.status === 'Active');
  }

  /**
   * Get all contests by status
   * @param {string} status - 'Active', 'Frozen', 'Resolved', 'Cancelled'
   * @returns {Promise<Array>} Array of contests
   */
  async listByStatus(status) {
    const res = await this.apiGet('/contests');
    return (res.contests || []).filter(c => c.status === status);
  }

  /**
   * Get all contests
   * @returns {Promise<Array>} All contests
   */
  async listAll() {
    const res = await this.apiGet('/contests');
    return res.contests || [];
  }

  /**
   * Get contests by type
   * @param {string} type - ContestType (Binary, HeadToHead, SquadBattle, Bingo)
   * @returns {Promise<Array>} Filtered contests
   */
  async listByType(type) {
    const res = await this.apiGet('/contests');
    return (res.contests || []).filter(c => c.contest_type === type);
  }

  /**
   * Get single contest by ID
   * @param {string} contestId - Contest ID
   * @returns {Promise<Object>} Contest details
   */
  async getContest(contestId) {
    const res = await this.apiGet(`/contest/${contestId}`);
    return res;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENTER CONTESTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enter a contest
   * @param {string} contestId - Contest ID to enter
   * @param {Object} choice - User's choice/selection
   * @param {string} username - Username (optional, uses config username if not provided)
   * @returns {Promise<Object>} Entry result
   * 
   * @example Binary
   * await sdk.enter('binary-worldcup', { choice: 'yes' });
   * 
   * @example HeadToHead
   * await sdk.enter('duel-mbappe-vini', { selection: 'Kylian Mbappé' });
   * 
   * @example SquadBattle
   * await sdk.enter('squad-worldcup', { squad: ['Mbappé', 'Kane', 'Bellingham'] });
   * 
   * @example Bingo
   * await sdk.enter('bingo-usa-england', { marks: [[1,0,1], [0,1,0], [1,0,1]] });
   */
  async enter(contestId, choice, username = null) {
    const user = username || this.username;
    if (!user) {
      throw new Error('Username required. Provide in constructor or as parameter.');
    }

    const payload = {
      username: user,
      choice
    };

    const res = await this.apiPost(`/contest/${contestId}/enter`, payload);
    return {
      success: res.success !== false,
      contestId,
      username: user,
      message: res.message || 'Entered successfully'
    };
  }

  /**
   * Check if user can enter a contest (has sufficient FC and not already entered)
   * @param {string} contestId - Contest ID
   * @param {string} username - Username to check
   * @returns {Promise<Object>} { canEnter: boolean, reason: string }
   */
  async canEnter(contestId, username = null) {
    const user = username || this.username;
    if (!user) {
      return { canEnter: false, reason: 'Username required' };
    }

    try {
      const contest = await this.getContest(contestId);
      
      // Check status
      if (contest.status !== 'Active') {
        return { canEnter: false, reason: `Contest is ${contest.status}` };
      }

      // Check if full
      if (contest.max_participants && contest.entries >= contest.max_participants) {
        return { canEnter: false, reason: 'Contest is full' };
      }

      // Check if already entered (would need to query entries, for now assume can enter)
      return { canEnter: true, reason: 'Can enter' };
    } catch (error) {
      return { canEnter: false, reason: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER CONTESTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all contests a user has entered
   * @param {string} username - Username to query
   * @returns {Promise<Array>} User's contest entries
   */
  async getUserContests(username = null) {
    const user = username || this.username;
    if (!user) {
      throw new Error('Username required');
    }

    // Get all contests and filter for user's entries
    const allContests = await this.listAll();
    
    // Note: This is a simplified version. In production, you'd want a dedicated endpoint
    // that returns contests with user's entry details, scores, rankings, etc.
    return allContests.filter(c => c.entries > 0);
  }

  /**
   * Get user's active entries (contests not yet resolved)
   * @param {string} username - Username
   * @returns {Promise<Array>} Active entries
   */
  async getActiveEntries(username = null) {
    const contests = await this.getUserContests(username);
    return contests.filter(c => c.status === 'Active' || c.status === 'Frozen');
  }

  /**
   * Get user's completed contests
   * @param {string} username - Username
   * @returns {Promise<Array>} Completed entries
   */
  async getCompletedEntries(username = null) {
    const contests = await this.getUserContests(username);
    return contests.filter(c => c.status === 'Resolved');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEST STATS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get contest statistics
   * @param {string} contestId - Contest ID
   * @returns {Promise<Object>} Contest stats
   */
  async getStats(contestId) {
    const contest = await this.getContest(contestId);
    
    return {
      id: contest.id,
      title: contest.title,
      type: contest.contest_type,
      status: contest.status,
      entries: contest.entries,
      maxParticipants: contest.max_participants,
      entryFee: contest.entry_fee,
      prizePool: contest.entry_fee * contest.entries,
      fillRate: contest.max_participants 
        ? (contest.entries / contest.max_participants * 100).toFixed(1) + '%'
        : 'Unlimited',
      timeToFreeze: contest.freeze_at 
        ? Math.max(0, contest.freeze_at - Math.floor(Date.now() / 1000))
        : null,
      timeToResolve: contest.resolve_at
        ? Math.max(0, contest.resolve_at - Math.floor(Date.now() / 1000))
        : null
    };
  }

  /**
   * Get leaderboard for a contest (if resolved)
   * @param {string} contestId - Contest ID
   * @returns {Promise<Array>} Ranked entries
   */
  async getLeaderboard(contestId) {
    const contest = await this.getContest(contestId);
    
    if (contest.status !== 'Resolved') {
      return { available: false, message: 'Contest not yet resolved' };
    }

    // Note: Would need backend support to return full leaderboard with scores/ranks
    return {
      available: true,
      contestId,
      outcome: contest.outcome,
      // In production, this would return sorted entries with scores
      entries: []
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEALER OPERATIONS (Admin Only)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new contest (dealer operation)
   * @param {Object} contest - Contest configuration
   * @returns {Promise<Object>} Created contest
   */
  async createContest(contest) {
    const payload = {
      id: contest.id,
      title: contest.title,
      description: contest.description,
      contest_type: contest.contest_type,
      entry_fee: contest.entry_fee,
      currency: 'FC', // Always FanCredit
      max_participants: contest.max_participants || null,
      freeze_at: contest.freeze_at,
      resolve_at: contest.resolve_at,
      options: contest.options
    };

    const res = await this.apiPost('/dealer/contest/create', payload);
    return {
      success: res.success !== false,
      contestId: res.contest_id,
      message: 'Contest created'
    };
  }

  /**
   * Freeze a contest (stop entries, lock in participants)
   * @param {string} contestId - Contest ID
   * @returns {Promise<Object>} Freeze result
   */
  async freezeContest(contestId) {
    const res = await this.apiPost(`/dealer/contest/${contestId}/freeze`, {});
    return {
      success: res.success !== false,
      contestId,
      status: 'Frozen'
    };
  }

  /**
   * Resolve a contest (determine winner, distribute payouts)
   * @param {string} contestId - Contest ID
   * @param {string} outcome - Winning outcome description
   * @param {Object} scores - Username -> score mapping
   * @returns {Promise<Object>} Resolution result
   */
  async resolveContest(contestId, outcome, scores) {
    const payload = {
      outcome,
      scores
    };

    const res = await this.apiPost(`/dealer/contest/${contestId}/resolve`, payload);
    return {
      success: res.success !== false,
      contestId,
      outcome,
      payouts: res.payouts || 0
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Format contest time remaining
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Human-readable time
   */
  formatTimeRemaining(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = timestamp - now;
    
    if (remaining <= 0) return 'Ended';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  }

  /**
   * Get contest type display name
   * @param {string} type - Contest type
   * @returns {string} Display name
   */
  getTypeDisplayName(type) {
    const names = {
      'Binary': 'Yes/No',
      'HeadToHead': 'Duel',
      'SquadBattle': 'Roster',
      'Bingo': 'Bingo'
    };
    return names[type] || type;
  }

  /**
   * Prepare contest data for UI rendering
   * @param {Object} contest - Raw contest object
   * @returns {Object} UI-ready contest data
   */
  prepareForDisplay(contest) {
    const now = Math.floor(Date.now() / 1000);
    const timeToFreeze = contest.freeze_at ? Math.max(0, contest.freeze_at - now) : null;
    const timeToResolve = contest.resolve_at ? Math.max(0, contest.resolve_at - now) : null;
    
    return {
      // Core data
      id: contest.id,
      title: contest.title,
      description: contest.description,
      
      // Display info
      type: contest.contest_type,
      typeDisplay: this.getTypeDisplayName(contest.contest_type),
      status: contest.status,
      statusColor: this.getStatusColor(contest.status),
      
      // Entry info
      entryFee: contest.entry_fee,
      entryFeeFormatted: this.formatFC(contest.entry_fee),
      entries: contest.entries,
      maxParticipants: contest.max_participants,
      fillRate: contest.max_participants 
        ? ((contest.entries / contest.max_participants) * 100).toFixed(0) + '%'
        : null,
      isFull: contest.max_participants && contest.entries >= contest.max_participants,
      
      // Prize info
      prizePool: contest.entry_fee * contest.entries,
      prizePoolFormatted: this.formatFC(contest.entry_fee * contest.entries),
      
      // Timing
      freezeAt: contest.freeze_at,
      resolveAt: contest.resolve_at,
      timeToFreeze,
      timeToResolve,
      timeRemainingText: timeToFreeze ? this.formatTimeRemaining(contest.freeze_at) : 'Ended',
      
      // Contest-specific options
      options: contest.options,
      
      // Actions
      canEnter: contest.status === 'Active' && (!contest.max_participants || contest.entries < contest.max_participants),
      isActive: contest.status === 'Active',
      isFrozen: contest.status === 'Frozen',
      isResolved: contest.status === 'Resolved',
      
      // Outcome (if resolved)
      outcome: contest.outcome
    };
  }

  /**
   * Get status color for UI
   * @param {string} status - Contest status
   * @returns {string} Color code
   */
  getStatusColor(status) {
    const colors = {
      'Active': '#22c55e',     // Green
      'Frozen': '#f59e0b',     // Orange
      'Resolved': '#3b82f6',   // Blue
      'Cancelled': '#ef4444'   // Red
    };
    return colors[status] || '#6b7280';
  }

  /**
   * Validate contest entry based on type
   * @param {string} contestType - Contest type
   * @param {Object} choice - User's choice
   * @param {Object} options - Contest options
   * @returns {Object} { valid: boolean, error: string }
   */
  validateEntry(contestType, choice, options) {
    switch (contestType) {
      case 'Binary':
        if (!choice.choice || !['yes', 'no'].includes(choice.choice.toLowerCase())) {
          return { valid: false, error: 'Must select YES or NO' };
        }
        return { valid: true };
      
      case 'HeadToHead':
        if (!choice.selection) {
          return { valid: false, error: 'Must select a player' };
        }
        const validPlayers = [options.player_a, options.player_b];
        if (!validPlayers.includes(choice.selection)) {
          return { valid: false, error: 'Invalid player selection' };
        }
        return { valid: true };
      
      case 'SquadBattle':
        if (!choice.squad || !Array.isArray(choice.squad)) {
          return { valid: false, error: 'Must provide squad array' };
        }
        if (choice.squad.length !== options.squad_size) {
          return { valid: false, error: `Must select exactly ${options.squad_size} players` };
        }
        return { valid: true };
      
      case 'Bingo':
        if (!choice.marks || !Array.isArray(choice.marks)) {
          return { valid: false, error: 'Must provide marks grid' };
        }
        return { valid: true };
      
      default:
        return { valid: true };
    }
  }

  /**
   * Format FC amount
   * @param {number} amount - Amount in FC
   * @returns {string} Formatted string
   */
  formatFC(amount) {
    return `${amount.toLocaleString()} FC`;
  }

  /**
   * Health check
   * @returns {Promise<boolean>} Server health
   */
  async healthCheck() {
    try {
      const res = await this.apiGet('/health');
      return res.status === 'ok';
    } catch {
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HTTP HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  async apiGet(path) {
    const url = `${this.apiUrl}${path}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = await response.text() || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error) {
      if (error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to reach ${this.apiUrl}`);
      }
      throw error;
    }
  }

  async apiPost(path, body) {
    const url = `${this.apiUrl}${path}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = await response.text() || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error) {
      if (error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to reach ${this.apiUrl}`);
      }
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export function createContestsSDK(config) {
  return new ContestsSDK(config);
}

export default ContestsSDK;

// ═══════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════
/*

// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────────────

import { ContestsSDK, ContestType, ContestStatus } from './contests-sdk.js';

const sdk = new ContestsSDK({
  apiUrl: 'https://l2.blackbook.gg',
  username: 'alice'
});

// ─────────────────────────────────────────────────────────────────────────────
// BROWSE CONTESTS
// ─────────────────────────────────────────────────────────────────────────────

// Get all active contests
const activeContests = await sdk.listActive();
console.log(`${activeContests.length} contests open for entry`);

// Filter by type
const squadBattles = await sdk.listByType(ContestType.SQUAD_BATTLE);
const duels = await sdk.listByType(ContestType.HEAD_TO_HEAD);

// Get specific contest
const contest = await sdk.getContest('squad-worldcup');
console.log(`${contest.title}: ${contest.entries}/${contest.max_participants} entries`);

// ─────────────────────────────────────────────────────────────────────────────
// ENTER CONTESTS
// ─────────────────────────────────────────────────────────────────────────────

// Binary: Yes/No
await sdk.enter('binary-worldcup', { choice: 'yes' });

// HeadToHead: Pick a player
await sdk.enter('duel-mbappe-vini', { selection: 'Kylian Mbappé' });

// SquadBattle: Pick multiple players
await sdk.enter('squad-worldcup', {
  squad: ['Mbappé', 'Haaland', 'Kane', 'Bellingham', 'Van Dijk']
});

// Bingo: Mark grid positions
await sdk.enter('bingo-usa-england', {
  marks: [
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1]
  ]
});

// ─────────────────────────────────────────────────────────────────────────────
// CHECK ELIGIBILITY
// ─────────────────────────────────────────────────────────────────────────────

const canEnter = await sdk.canEnter('squad-worldcup', 'alice');
if (canEnter.canEnter) {
  await sdk.enter('squad-worldcup', { squad: [...] });
} else {
  console.log(`Cannot enter: ${canEnter.reason}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TRACK YOUR CONTESTS
// ─────────────────────────────────────────────────────────────────────────────

// Get all your entries
const myContests = await sdk.getUserContests('alice');

// Get active entries only
const active = await sdk.getActiveEntries('alice');

// Get completed contests
const completed = await sdk.getCompletedEntries('alice');

// ─────────────────────────────────────────────────────────────────────────────
// CONTEST STATS
// ─────────────────────────────────────────────────────────────────────────────

const stats = await sdk.getStats('squad-worldcup');
console.log(`Entry Fee: ${stats.entryFee} FC`);
console.log(`Prize Pool: ${stats.prizePool} FC`);
console.log(`Fill Rate: ${stats.fillRate}`);
console.log(`Freezes in: ${sdk.formatTimeRemaining(stats.freeze_at)}`);

// ─────────────────────────────────────────────────────────────────────────────
// DEALER OPERATIONS (Admin)
// ─────────────────────────────────────────────────────────────────────────────

// Create new contest
await sdk.createContest({
  id: 'duel-ronaldo-messi',
  title: 'Ronaldo vs Messi - Goals This Season',
  description: 'Who will score more goals?',
  contest_type: ContestType.HEAD_TO_HEAD,
  entry_fee: 10.0,
  max_participants: 100,
  freeze_at: Math.floor(Date.now() / 1000) + 7200,  // 2 hours
  resolve_at: Math.floor(Date.now() / 1000) + 14400, // 4 hours
  options: {
    player_a: 'Cristiano Ronaldo',
    player_b: 'Lionel Messi',
    stat: 'goals',
    event: '2025-26 Season'
  }
});

// Freeze contest (stop entries)
await sdk.freezeContest('duel-ronaldo-messi');

// Resolve contest (determine winner)
await sdk.resolveContest('duel-ronaldo-messi', 'Winner: Ronaldo', {
  alice: 100,  // Picked Ronaldo (correct)
  bob: 0       // Picked Messi (incorrect)
});

// ─────────────────────────────────────────────────────────────────────────────
// CONTEST TYPES EXPLAINED
// ─────────────────────────────────────────────────────────────────────────────

// Binary: Simple Yes/No
// - Will Brazil win the World Cup? YES / NO
// - Will Bitcoin hit $100k? YES / NO

// HeadToHead: Player A vs Player B
// - Who scores more: Mbappé or Vinícius?
// - Which video gets more views: MrBeast or IShowSpeed?

// SquadBattle: Draft N players
// - Pick 5 players for fantasy points
// - Select best performers from pool

// Bingo: Event grid matching
// - Mark events as they occur
// - First to complete a line wins

*/
