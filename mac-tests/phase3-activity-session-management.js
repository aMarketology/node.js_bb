/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 3 TEST: Activity-Based Session Management
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests the activity-based session management system:
 * - 10-minute active session (extends on activity)
 * - 1-hour inactivity logout
 * - Large transaction threshold ($1000) always requires password
 * 
 * Run: node mac-tests/phase3-activity-session-management.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT (mirrors AuthContext.tsx implementation)
// ═══════════════════════════════════════════════════════════════════════════

class SessionManager {
  constructor() {
    // Session timing constants
    this.ACTIVE_SESSION_MS = 10 * 60 * 1000;    // 10 minutes
    this.INACTIVITY_LOGOUT_MS = 60 * 60 * 1000; // 1 hour
    this.LARGE_TX_THRESHOLD = 1000;             // $1000
    
    // Session state
    this.password = null;
    this.passwordTimestamp = null;
    this.lastActivity = Date.now();
    this.sessionTimer = null;
    this.inactivityTimer = null;
    this.isLoggedIn = false;
    
    // Event callbacks
    this.onSessionExpired = null;
    this.onInactivityLogout = null;
  }
  
  /**
   * Simulate user login with password
   */
  login(password) {
    this.isLoggedIn = true;
    this.storePassword(password);
    this.resetInactivityTimer();
    console.log('   👤 User logged in');
    return true;
  }
  
  /**
   * Store password in memory with activity-based expiry
   */
  storePassword(password) {
    // Clear any existing timers
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    
    // Store password and timestamp
    this.password = password;
    this.passwordTimestamp = Date.now();
    this.lastActivity = Date.now();
    
    // Set session timer (10 minutes)
    this.sessionTimer = setTimeout(() => {
      console.log('   🔒 Active session expired - clearing password');
      this.clearPassword();
      if (this.onSessionExpired) this.onSessionExpired();
    }, this.ACTIVE_SESSION_MS);
    
    console.log('   🔑 Password stored - 10-minute active session started');
  }
  
  /**
   * Clear password from memory
   */
  clearPassword() {
    this.password = null;
    this.passwordTimestamp = null;
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }
  
  /**
   * Track user activity - extends session
   */
  trackActivity() {
    const now = Date.now();
    this.lastActivity = now;
    
    // If password is unlocked, extend the active session
    if (this.password && this.passwordTimestamp) {
      this.extendSession();
    }
    
    // Reset inactivity logout timer
    this.resetInactivityTimer();
  }
  
  /**
   * Extend the active session (called on activity)
   */
  extendSession() {
    if (!this.password) return;
    
    // Update timestamp to extend session
    this.passwordTimestamp = Date.now();
    
    // Reset session timer
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    
    this.sessionTimer = setTimeout(() => {
      console.log('   🔒 Active session expired after 10 minutes of no activity');
      this.clearPassword();
      if (this.onSessionExpired) this.onSessionExpired();
    }, this.ACTIVE_SESSION_MS);
    
    console.log('   ⏰ Session extended');
  }
  
  /**
   * Reset inactivity logout timer
   */
  resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    if (this.isLoggedIn) {
      this.inactivityTimer = setTimeout(() => {
        console.log('   🚪 Auto-logout: 1 hour of inactivity');
        this.logout();
        if (this.onInactivityLogout) this.onInactivityLogout();
      }, this.INACTIVITY_LOGOUT_MS);
    }
  }
  
  /**
   * Check if password is still valid (within active session window)
   */
  isPasswordUnlocked() {
    if (!this.password || !this.passwordTimestamp) {
      return false;
    }
    
    const elapsed = Date.now() - this.passwordTimestamp;
    const isValid = elapsed < this.ACTIVE_SESSION_MS;
    
    if (!isValid) {
      console.log('   🔒 Session expired - clearing password');
      this.clearPassword();
    }
    
    return isValid;
  }
  
  /**
   * Check if password is required for a transaction
   */
  shouldPromptPassword(amount = 0) {
    // Large transactions ALWAYS require password
    if (amount >= this.LARGE_TX_THRESHOLD) {
      console.log(`   💰 Large transaction ($${amount}) - password required`);
      return true;
    }
    
    // For normal transactions, check if session is active
    return !this.isPasswordUnlocked();
  }
  
  /**
   * Get password if session is still active
   */
  getPassword() {
    if (this.isPasswordUnlocked()) {
      // Extend session on password use
      this.extendSession();
      return this.password;
    }
    return null;
  }
  
  /**
   * Logout user
   */
  logout() {
    this.clearPassword();
    this.isLoggedIn = false;
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    console.log('   👋 User logged out');
  }
  
  /**
   * Simulate time passing (for testing)
   */
  simulateTimePass(ms) {
    this.passwordTimestamp -= ms;
    this.lastActivity -= ms;
  }
  
  /**
   * Get session status
   */
  getStatus() {
    return {
      isLoggedIn: this.isLoggedIn,
      hasPassword: !!this.password,
      isSessionActive: this.isPasswordUnlocked(),
      sessionAge: this.passwordTimestamp ? Date.now() - this.passwordTimestamp : null,
      lastActivity: Date.now() - this.lastActivity
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAC'S WALLET CREDENTIALS
// ═══════════════════════════════════════════════════════════════════════════

const MAC_WALLET = {
  username: 'mac_blackbook',
  email: 'mac@blackbook.io',
  l1Address: 'L1_94B3C863E068096596CE80F04C2233B72AE11790',
  password: 'MacSecurePassword2026!'
};

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

async function runTests() {
  console.log('═'.repeat(70));
  console.log('🧪 PHASE 3 TEST: Activity-Based Session Management');
  console.log('═'.repeat(70));
  console.log('   Session Rules:');
  console.log('   • 10-minute active session (extends on activity)');
  console.log('   • 1-hour inactivity auto-logout');
  console.log('   • Transactions ≥$1000 ALWAYS require password');
  console.log('═'.repeat(70));
  
  let passed = 0;
  let failed = 0;
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Initial Login Stores Password
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 1: Initial Login Stores Password');
  try {
    const session = new SessionManager();
    session.login(MAC_WALLET.password);
    
    if (session.isPasswordUnlocked() && session.getPassword() === MAC_WALLET.password) {
      console.log('   ✅ PASSED: Password stored and accessible after login');
      passed++;
    } else {
      console.log('   ❌ FAILED: Password not accessible after login');
      failed++;
    }
    
    session.logout();
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: Small Transaction Without Password Prompt
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 2: Small Transaction ($50) - No Password Prompt Needed');
  try {
    const session = new SessionManager();
    session.login(MAC_WALLET.password);
    
    const needsPrompt = session.shouldPromptPassword(50);
    
    if (!needsPrompt) {
      console.log('   ✅ PASSED: $50 transaction does not require password prompt');
      console.log('      (Session is active, amount < $1000)');
      passed++;
    } else {
      console.log('   ❌ FAILED: Should not prompt for small transaction with active session');
      failed++;
    }
    
    session.logout();
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: Large Transaction ALWAYS Requires Password
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 3: Large Transaction ($1000) - ALWAYS Requires Password');
  try {
    const session = new SessionManager();
    session.login(MAC_WALLET.password);
    
    // Even with active session, $1000 should require password
    const needsPrompt1000 = session.shouldPromptPassword(1000);
    const needsPrompt5000 = session.shouldPromptPassword(5000);
    
    if (needsPrompt1000 && needsPrompt5000) {
      console.log('   ✅ PASSED: Large transactions always require password');
      console.log('      $1000: requires password ✓');
      console.log('      $5000: requires password ✓');
      passed++;
    } else {
      console.log('   ❌ FAILED: Large transactions should always require password');
      failed++;
    }
    
    session.logout();
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: Session Expires After 10 Minutes of Inactivity
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 4: Session Expires After 10 Minutes');
  try {
    const session = new SessionManager();
    session.login(MAC_WALLET.password);
    
    // Verify session is active
    const activeBeforeExpiry = session.isPasswordUnlocked();
    
    // Simulate 11 minutes passing
    session.simulateTimePass(11 * 60 * 1000);
    
    // Session should now be expired
    const activeAfterExpiry = session.isPasswordUnlocked();
    
    if (activeBeforeExpiry && !activeAfterExpiry) {
      console.log('   ✅ PASSED: Session correctly expires after 10 minutes');
      console.log('      Before: session active ✓');
      console.log('      After 11 min: session expired ✓');
      passed++;
    } else {
      console.log('   ❌ FAILED: Session expiry not working correctly');
      console.log(`      Before: ${activeBeforeExpiry}`);
      console.log(`      After: ${activeAfterExpiry}`);
      failed++;
    }
    
    session.logout();
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: Activity Extends Session
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 5: Activity Extends Session');
  try {
    const session = new SessionManager();
    session.login(MAC_WALLET.password);
    
    // Simulate 5 minutes passing
    session.simulateTimePass(5 * 60 * 1000);
    
    // Track activity (should extend session)
    console.log('   👆 Simulating user activity...');
    session.trackActivity();
    
    // Simulate another 7 minutes (total 12 minutes from login, but only 7 from activity)
    session.simulateTimePass(7 * 60 * 1000);
    
    // Session should still be active (7 min since last activity < 10 min)
    const isActive = session.isPasswordUnlocked();
    
    if (isActive) {
      console.log('   ✅ PASSED: Activity extends session');
      console.log('      • Login at T+0');
      console.log('      • Activity at T+5 min (resets 10-min timer)');
      console.log('      • Check at T+12 min (7 min since activity)');
      console.log('      • Session still active ✓');
      passed++;
    } else {
      console.log('   ❌ FAILED: Activity should extend session');
      failed++;
    }
    
    session.logout();
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: Password Required After Session Expires
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 6: Password Required After Session Expires');
  try {
    const session = new SessionManager();
    session.login(MAC_WALLET.password);
    
    // Expire the session
    session.simulateTimePass(11 * 60 * 1000);
    session.isPasswordUnlocked(); // Triggers cleanup
    
    // Now even small transactions should require password
    const needsPrompt = session.shouldPromptPassword(50);
    
    if (needsPrompt) {
      console.log('   ✅ PASSED: Password required after session expires');
      console.log('      (Even $50 transaction needs password when session expired)');
      passed++;
    } else {
      console.log('   ❌ FAILED: Should require password after session expiry');
      failed++;
    }
    
    session.logout();
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 7: Re-entering Password Restarts Session
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 7: Re-entering Password Restarts Session');
  try {
    const session = new SessionManager();
    session.login(MAC_WALLET.password);
    
    // Expire the session
    session.simulateTimePass(11 * 60 * 1000);
    session.isPasswordUnlocked();
    
    // Re-enter password
    console.log('   🔑 Re-entering password...');
    session.storePassword(MAC_WALLET.password);
    
    // Session should be active again
    const isActive = session.isPasswordUnlocked();
    const needsPrompt = session.shouldPromptPassword(50);
    
    if (isActive && !needsPrompt) {
      console.log('   ✅ PASSED: Re-entering password restarts session');
      passed++;
    } else {
      console.log('   ❌ FAILED: Password re-entry should restart session');
      failed++;
    }
    
    session.logout();
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 8: Transaction Flow Simulation
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 8: Transaction Flow Simulation');
  try {
    const session = new SessionManager();
    session.login(MAC_WALLET.password);
    
    console.log('   📊 Simulating user trading session:');
    
    // Transaction 1: $100 bet (should work, no prompt)
    const tx1 = { amount: 100, description: 'Bet on BTC > $100k' };
    const tx1Needs = session.shouldPromptPassword(tx1.amount);
    console.log(`      Tx1: $${tx1.amount} - ${tx1Needs ? '❌ Needs password' : '✓ No password needed'}`);
    session.trackActivity();
    
    // Simulate 3 minutes
    session.simulateTimePass(3 * 60 * 1000);
    
    // Transaction 2: $250 bet (should work)
    const tx2 = { amount: 250, description: 'Bet on ETH > $5k' };
    const tx2Needs = session.shouldPromptPassword(tx2.amount);
    console.log(`      Tx2: $${tx2.amount} - ${tx2Needs ? '❌ Needs password' : '✓ No password needed'}`);
    session.trackActivity();
    
    // Simulate 2 minutes
    session.simulateTimePass(2 * 60 * 1000);
    
    // Transaction 3: $1500 withdrawal (ALWAYS needs password)
    const tx3 = { amount: 1500, description: 'Withdraw winnings' };
    const tx3Needs = session.shouldPromptPassword(tx3.amount);
    console.log(`      Tx3: $${tx3.amount} - ${tx3Needs ? '✓ Password REQUIRED (large tx)' : '❌ Should require password'}`);
    
    // Transaction 4: $50 bet (should work, session active)
    const tx4 = { amount: 50, description: 'Small follow-up bet' };
    const tx4Needs = session.shouldPromptPassword(tx4.amount);
    console.log(`      Tx4: $${tx4.amount} - ${tx4Needs ? '❌ Needs password' : '✓ No password needed'}`);
    
    if (!tx1Needs && !tx2Needs && tx3Needs && !tx4Needs) {
      console.log('   ✅ PASSED: Transaction flow behaves correctly');
      passed++;
    } else {
      console.log('   ❌ FAILED: Transaction flow has issues');
      failed++;
    }
    
    session.logout();
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEST 9: Session Status Reporting
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Test 9: Session Status Reporting');
  try {
    const session = new SessionManager();
    
    // Before login
    let status = session.getStatus();
    console.log('   📊 Before login:', JSON.stringify(status));
    const beforeOk = !status.isLoggedIn && !status.hasPassword;
    
    // After login
    session.login(MAC_WALLET.password);
    status = session.getStatus();
    console.log('   📊 After login:', JSON.stringify(status));
    const afterOk = status.isLoggedIn && status.hasPassword && status.isSessionActive;
    
    // After expiry
    session.simulateTimePass(11 * 60 * 1000);
    session.isPasswordUnlocked();
    status = session.getStatus();
    console.log('   📊 After expiry:', JSON.stringify(status));
    const expiredOk = status.isLoggedIn && !status.hasPassword && !status.isSessionActive;
    
    if (beforeOk && afterOk && expiredOk) {
      console.log('   ✅ PASSED: Session status reporting is accurate');
      passed++;
    } else {
      console.log('   ❌ FAILED: Session status reporting has issues');
      failed++;
    }
    
    session.logout();
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    failed++;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  console.log('📊 PHASE 3 TEST RESULTS');
  console.log('═'.repeat(70));
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('═'.repeat(70));
  
  if (failed === 0) {
    console.log('🎉 All Phase 3 tests passed! Activity-based session management is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Review the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
