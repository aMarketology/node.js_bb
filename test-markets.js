/**
 * BlackBook Markets Testing Script
 * Tests real World Cup 2026 markets with Alice and Bob test accounts
 */

import { createKeyPair, mnemonicToSeed, signMessage, bytesToHex } from './lib/blackbook-wallet.js';

// Test Accounts from TEST_ACCOUNTS.txt
const ALICE = {
  name: 'Alice',
  mnemonic: 'machine sword cause scrub simple damage program together spoon lock ball banana',
  address: 'L1_BF1565F0D56ED917FDF8263CCCB020706F5FB5DD'
};

const BOB = {
  name: 'Bob',
  mnemonic: 'base echo grape penalty hawk resemble obscure unusual throw paddle carpet elder',
  address: 'L1_AE1CA8E0144C2D8DCFAC3748B36AE166D52F71D9'
};

const L1_API = 'http://localhost:8080';
const L2_API = 'http://localhost:1234';
const APP_API = 'http://localhost:3000';

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

async function authenticateWallet(wallet, mnemonic) {
  console.log(`\n🔐 Authenticating ${wallet.name}...`);
  
  // Unlock wallet from mnemonic
  const seed = await mnemonicToSeed(mnemonic);
  const keyPair = createKeyPair(seed);
  
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `blackbook-auth:${wallet.address}:${timestamp}`;
  
  const messageBytes = new TextEncoder().encode(message);
  const signature = signMessage(messageBytes, keyPair.secretKey);
  
  const response = await fetch(`${L2_API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_address: wallet.address,
      timestamp: timestamp,
      signature: bytesToHex(signature),
      public_key: bytesToHex(keyPair.publicKey)
    })
  });
  
  const data = await response.json();
  console.log(`✅ Session token obtained for ${wallet.name}`);
  
  return {
    sessionToken: data.session_token,
    wallet: {
      address: wallet.address,
      publicKey: keyPair.publicKey,
      secretKey: keyPair.secretKey
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// MARKET QUERIES
// ═══════════════════════════════════════════════════════════════

async function getAllMatches() {
  console.log('\n📊 Fetching all World Cup 2026 matches...');
  
  const response = await fetch(`${APP_API}/api/markets`);
  const data = await response.json();
  
  console.log(`✅ Found ${data.count} matches`);
  console.log(`   Total prop bets: ${data.matches.reduce((sum, m) => sum + m.propBets.length, 0)}`);
  
  return data.matches;
}

async function getMatchDetails(matchId) {
  const matches = await getAllMatches();
  const match = matches.find(m => m.id === matchId);
  
  if (!match) {
    throw new Error(`Match ${matchId} not found`);
  }
  
  console.log(`\n⚽ Match Details: ${match.homeTeam} vs ${match.awayTeam}`);
  console.log(`   Venue: ${match.venue}, ${match.city}`);
  console.log(`   Kickoff: ${match.kickoff}`);
  console.log(`   Status: ${match.status}`);
  console.log(`   Prop Bets: ${match.propBets.length}`);
  
  return match;
}

async function showPropBets(match) {
  console.log(`\n📋 Available Prop Bets for ${match.homeTeam} vs ${match.awayTeam}:`);
  
  match.propBets.forEach((prop, index) => {
    console.log(`\n   ${index + 1}. [${prop.type.toUpperCase()}] ${prop.question}`);
    console.log(`      ID: ${prop.id}`);
    prop.outcomes.forEach((outcome, i) => {
      console.log(`      - ${outcome}: ${(parseFloat(prop.outcomePrices[i]) * 100).toFixed(1)}%`);
    });
    if (prop.player) console.log(`      Player: ${prop.player} (${prop.team})`);
  });
}

// ═══════════════════════════════════════════════════════════════
// BETTING
// ═══════════════════════════════════════════════════════════════

async function getQuote(propBetId, outcome, amount) {
  console.log(`\n💰 Getting quote for ${outcome} @ ${amount} BB...`);
  
  const response = await fetch(`${L2_API}/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prop_bet_id: propBetId,
      outcome: outcome,
      amount: amount
    })
  });
  
  const data = await response.json();
  console.log(`   Tokens: ${data.tokens}`);
  console.log(`   Price per token: ${data.price_per_token}`);
  console.log(`   Fee: ${data.fee} BB`);
  console.log(`   Price impact: ${data.price_impact}%`);
  
  return data;
}

async function placeBet(sessionToken, propBetId, outcome, amount) {
  console.log(`\n🎲 Placing bet: ${outcome} @ ${amount} BB...`);
  
  const response = await fetch(`${L2_API}/predict/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken
    },
    body: JSON.stringify({
      prop_bet_id: propBetId,
      outcome: outcome,
      amount: amount
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Bet failed: ${error.error || response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`✅ Bet placed successfully!`);
  console.log(`   Bet ID: ${data.bet_id}`);
  console.log(`   Tokens received: ${data.tokens_received}`);
  console.log(`   Avg price: ${data.avg_price}`);
  console.log(`   Fee: ${data.fee} BB`);
  
  return data;
}

async function getUserPosition(userAddress, propBetId) {
  console.log(`\n📊 Checking position for ${userAddress}...`);
  
  const response = await fetch(`${L2_API}/position/${userAddress}/${propBetId}`);
  const data = await response.json();
  
  console.log(`   Yes tokens: ${data.yes_tokens || 0}`);
  console.log(`   No tokens: ${data.no_tokens || 0}`);
  console.log(`   Total invested: ${data.total_invested || 0} BB`);
  console.log(`   Current value: ${data.current_value || 0} BB`);
  console.log(`   PnL: ${data.unrealized_pnl || 0} BB`);
  
  return data;
}

// ═══════════════════════════════════════════════════════════════
// TEST SCENARIOS
// ═══════════════════════════════════════════════════════════════

async function testScenario1_MatchWinner() {
  console.log('\n' + '═'.repeat(80));
  console.log('TEST SCENARIO 1: Bet on Match Winner (Mexico vs Canada)');
  console.log('═'.repeat(80));
  
  // Authenticate Alice
  const alice = await authenticateWallet(ALICE, ALICE.mnemonic);
  
  // Get Mexico vs Canada match (first World Cup match)
  const match = await getMatchDetails('wc2026-001');
  await showPropBets(match);
  
  // Find match winner prop bet
  const matchWinnerProp = match.propBets.find(pb => 
    pb.question.toLowerCase().includes('win') && pb.type === 'game'
  );
  
  if (!matchWinnerProp) {
    console.log('❌ Match winner prop bet not found');
    return;
  }
  
  console.log(`\n🎯 Selected: ${matchWinnerProp.question}`);
  
  // Get quote for betting on Mexico
  await getQuote(matchWinnerProp.id, match.homeTeam, 100);
  
  // Place bet
  const bet = await placeBet(alice.sessionToken, matchWinnerProp.id, match.homeTeam, 100);
  
  // Check position
  await getUserPosition(alice.wallet.address, matchWinnerProp.id);
}

async function testScenario2_PlayerProp() {
  console.log('\n' + '═'.repeat(80));
  console.log('TEST SCENARIO 2: Bet on Player Prop (Will player score?)');
  console.log('═'.repeat(80));
  
  // Authenticate Bob
  const bob = await authenticateWallet(BOB, BOB.mnemonic);
  
  // Get match
  const match = await getMatchDetails('wc2026-001');
  
  // Find player prop bet
  const playerProps = match.propBets.filter(pb => pb.type === 'player');
  
  if (playerProps.length === 0) {
    console.log('❌ No player props found');
    return;
  }
  
  const playerProp = playerProps[0];
  console.log(`\n🎯 Selected: ${playerProp.question}`);
  console.log(`   Player: ${playerProp.player} (${playerProp.team})`);
  
  // Get quote for YES
  await getQuote(playerProp.id, 'Yes', 50);
  
  // Place bet
  const bet = await placeBet(bob.sessionToken, playerProp.id, 'Yes', 50);
  
  // Check position
  await getUserPosition(bob.wallet.address, playerProp.id);
}

async function testScenario3_MultipleMarkets() {
  console.log('\n' + '═'.repeat(80));
  console.log('TEST SCENARIO 3: Alice and Bob bet on multiple markets');
  console.log('═'.repeat(80));
  
  // Authenticate both
  const alice = await authenticateWallet(ALICE, ALICE.mnemonic);
  const bob = await authenticateWallet(BOB, BOB.mnemonic);
  
  // Get match
  const match = await getMatchDetails('wc2026-001');
  
  // Alice bets on Total Goals Over
  const totalGoalsProp = match.propBets.find(pb => 
    pb.question.toLowerCase().includes('total goals')
  );
  
  if (totalGoalsProp) {
    console.log('\n👩 Alice betting on Total Goals Over 2.5...');
    await placeBet(alice.sessionToken, totalGoalsProp.id, 'Over', 75);
  }
  
  // Bob bets on Both Teams to Score
  const bothScoreProp = match.propBets.find(pb => 
    pb.question.toLowerCase().includes('both teams')
  );
  
  if (bothScoreProp) {
    console.log('\n👨 Bob betting on Both Teams to Score (Yes)...');
    await placeBet(bob.sessionToken, bothScoreProp.id, 'Yes', 60);
  }
  
  console.log('\n📊 Final Positions:');
  if (totalGoalsProp) {
    console.log('\nAlice - Total Goals:');
    await getUserPosition(alice.wallet.address, totalGoalsProp.id);
  }
  if (bothScoreProp) {
    console.log('\nBob - Both Teams to Score:');
    await getUserPosition(bob.wallet.address, bothScoreProp.id);
  }
}

async function testScenario4_ExploreAllMatches() {
  console.log('\n' + '═'.repeat(80));
  console.log('TEST SCENARIO 4: Explore all available matches');
  console.log('═'.repeat(80));
  
  const matches = await getAllMatches();
  
  console.log('\n🏆 Featured Matches:');
  matches.slice(0, 5).forEach(match => {
    console.log(`\n   ${match.homeTeamFlag} ${match.homeTeam} vs ${match.awayTeam} ${match.awayTeamFlag}`);
    console.log(`   📍 ${match.venue}, ${match.city}`);
    console.log(`   📅 ${new Date(match.kickoff).toLocaleString()}`);
    console.log(`   🎲 ${match.propBets.length} betting markets`);
    console.log(`   💰 Volume: ${parseInt(match.volume).toLocaleString()} BB`);
  });
  
  // Group by stage
  const byStage = matches.reduce((acc, m) => {
    acc[m.stage] = (acc[m.stage] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📊 Matches by Stage:');
  Object.entries(byStage).forEach(([stage, count]) => {
    console.log(`   ${stage}: ${count} matches`);
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('🚀 BlackBook Markets Integration Test Suite');
  console.log('Testing with Alice and Bob test accounts\n');
  
  try {
    // Test 1: Basic match winner bet
    await testScenario1_MatchWinner();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Player prop bet
    await testScenario2_PlayerProp();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Multiple markets
    await testScenario3_MultipleMarkets();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Explore all matches
    await testScenario4_ExploreAllMatches();
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(80));
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

// Run tests
runAllTests();
