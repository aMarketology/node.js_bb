#!/usr/bin/env node

/**
 * Mock L2 Markets Server
 * Simulates BlackBook L2 prediction market API for testing
 * Run with: node scripts/mock-l2-server.js
 */

const http = require('http');
const crypto = require('crypto');

const PORT = 1234;

// In-memory storage
const sessions = new Map();
const propBets = new Map();
const positions = new Map();
const liquidity = new Map();

// Initialize with some test prop bets
function initializeTestData() {
  // Example prop bet for Mexico vs Canada
  propBets.set('prop-001-1', {
    id: 'prop-001-1',
    match_id: 'wc2026-001',
    type: 'player',
    question: 'Will Santiago Giménez score in the first 15 minutes?',
    outcomes: ['Yes', 'No'],
    outcome_prices: ['0.15', '0.85'],
    player: 'Santiago Giménez',
    team: 'Mexico',
    liquidity: 5000,
    volume: 1200,
    status: 'active',
    reserves: { Yes: 750, No: 4250 }
  });

  propBets.set('prop-001-2', {
    id: 'prop-001-2',
    match_id: 'wc2026-001',
    type: 'game',
    question: 'Total goals Over/Under 2.5',
    outcomes: ['Over', 'Under'],
    outcome_prices: ['0.58', '0.42'],
    liquidity: 10000,
    volume: 3500,
    status: 'active',
    reserves: { Over: 5800, Under: 4200 }
  });

  console.log('✅ Test data initialized');
}

// Constant Product Market Maker (CPMM) logic
function calculateBuy(reserves, outcome, amount, feeRate = 0.02) {
  const fee = amount * feeRate;
  const amountAfterFee = amount - fee;
  
  const totalReserves = Object.values(reserves).reduce((a, b) => a + b, 0);
  const outcomeReserve = reserves[outcome];
  const k = totalReserves * outcomeReserve; // constant product
  
  // New reserve after buy
  const newTotalReserves = totalReserves + amountAfterFee;
  const newOutcomeReserve = k / newTotalReserves;
  
  const tokensReceived = outcomeReserve - newOutcomeReserve;
  const avgPrice = amount / tokensReceived;
  const priceImpact = ((avgPrice / (amount / outcomeReserve)) - 1) * 100;
  
  return {
    tokens: tokensReceived,
    price_per_token: avgPrice,
    fee: fee,
    price_impact: priceImpact,
    new_price: newOutcomeReserve / newTotalReserves
  };
}

// Request handler
function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Token');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse body for POST requests
  if (method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        handleRoute(path, method, data, req, res);
      } catch (e) {
        sendJSON(res, 400, { error: 'Invalid JSON' });
      }
    });
  } else {
    handleRoute(path, method, null, req, res);
  }
}

function handleRoute(path, method, body, req, res) {
  console.log(`${method} ${path}`);

  // Health check
  if (path === '/health') {
    return sendJSON(res, 200, { status: 'ok', timestamp: Date.now() });
  }

  // Authentication
  if (path === '/auth' && method === 'POST') {
    const { user_address, timestamp, signature, public_key } = body;
    
    if (!user_address || !signature) {
      return sendJSON(res, 400, { error: 'Missing required fields' });
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    sessions.set(sessionToken, {
      user: user_address,
      expires: Date.now() + (2.5 * 60 * 1000)
    });

    console.log(`✅ Session created for ${user_address}`);
    return sendJSON(res, 200, { session_token: sessionToken });
  }

  // Get quote (no auth needed)
  if (path === '/quote' && method === 'POST') {
    const { prop_bet_id, outcome, amount } = body;
    
    const propBet = propBets.get(prop_bet_id);
    if (!propBet) {
      return sendJSON(res, 404, { error: 'Prop bet not found' });
    }

    const quote = calculateBuy(propBet.reserves, outcome, amount);
    return sendJSON(res, 200, quote);
  }

  // Place bet (requires auth)
  if (path === '/predict/session' && method === 'POST') {
    const session = getSession(req);
    if (!session) {
      return sendJSON(res, 401, { error: 'Unauthorized' });
    }

    const { prop_bet_id, outcome, amount } = body;
    
    const propBet = propBets.get(prop_bet_id);
    if (!propBet) {
      return sendJSON(res, 404, { error: 'Prop bet not found' });
    }

    // Calculate purchase
    const quote = calculateBuy(propBet.reserves, outcome, amount);
    
    // Update reserves
    const totalReserves = Object.values(propBet.reserves).reduce((a, b) => a + b, 0);
    const newTotalReserves = totalReserves + (amount - quote.fee);
    const newOutcomeReserve = propBet.reserves[outcome] - quote.tokens;
    
    propBet.reserves[outcome] = newOutcomeReserve;
    propBet.volume += amount;
    
    // Update position
    const posKey = `${session.user}-${prop_bet_id}`;
    const pos = positions.get(posKey) || { 
      user: session.user, 
      prop_bet_id, 
      positions: {}, 
      invested: 0 
    };
    pos.positions[outcome] = (pos.positions[outcome] || 0) + quote.tokens;
    pos.invested += amount;
    positions.set(posKey, pos);

    // Update prices
    propBet.outcome_prices = propBet.outcomes.map(o => 
      (propBet.reserves[o] / newTotalReserves).toFixed(4)
    );

    console.log(`✅ Bet placed: ${amount} BB → ${quote.tokens.toFixed(2)} ${outcome} tokens`);
    
    return sendJSON(res, 200, {
      bet_id: crypto.randomBytes(16).toString('hex'),
      tokens_received: quote.tokens,
      avg_price: quote.price_per_token,
      fee: quote.fee,
      new_odds: propBet.outcome_prices.reduce((acc, price, i) => {
        acc[propBet.outcomes[i].toLowerCase()] = parseFloat(price);
        return acc;
      }, {})
    });
  }

  // Get position
  if (path.startsWith('/position/')) {
    const parts = path.split('/');
    const userAddress = parts[2];
    const propBetId = parts[3];
    
    const posKey = `${userAddress}-${propBetId}`;
    const pos = positions.get(posKey);
    
    if (!pos) {
      return sendJSON(res, 404, { error: 'No position found' });
    }

    const propBet = propBets.get(propBetId);
    const totalReserves = Object.values(propBet.reserves).reduce((a, b) => a + b, 0);
    
    // Calculate current value
    let currentValue = 0;
    for (const [outcome, tokens] of Object.entries(pos.positions)) {
      const price = propBet.reserves[outcome] / totalReserves;
      currentValue += tokens * price;
    }

    return sendJSON(res, 200, {
      prop_bet_id: propBetId,
      user: userAddress,
      positions: pos.positions,
      total_invested: pos.invested,
      current_value: currentValue,
      unrealized_pnl: currentValue - pos.invested
    });
  }

  // Add liquidity
  if (path === '/lp/add/session' && method === 'POST') {
    const session = getSession(req);
    if (!session) {
      return sendJSON(res, 401, { error: 'Unauthorized' });
    }

    const { prop_bet_id, amount } = body;
    const propBet = propBets.get(prop_bet_id);
    if (!propBet) {
      return sendJSON(res, 404, { error: 'Prop bet not found' });
    }

    propBet.liquidity += amount;
    
    const lpKey = `${session.user}-${prop_bet_id}`;
    const lp = liquidity.get(lpKey) || { amount: 0 };
    lp.amount += amount;
    liquidity.set(lpKey, lp);

    console.log(`💧 Liquidity added: ${amount} BB`);

    return sendJSON(res, 200, {
      success: true,
      prop_bet_id,
      user: session.user,
      amount_added: amount,
      lp_share: lp.amount / propBet.liquidity,
      total_liquidity: propBet.liquidity
    });
  }

  // Get LP info
  if (path.startsWith('/lp/') && method === 'GET') {
    const propBetId = path.split('/')[2];
    const propBet = propBets.get(propBetId);
    
    if (!propBet) {
      return sendJSON(res, 404, { error: 'Prop bet not found' });
    }

    return sendJSON(res, 200, {
      total_liquidity: propBet.liquidity,
      reserves: propBet.reserves,
      lp_count: Array.from(liquidity.keys()).filter(k => k.endsWith(propBetId)).length,
      fee_rate: 0.02,
      fees_collected: propBet.volume * 0.02,
      lp_shares: {}
    });
  }

  // Not found
  sendJSON(res, 404, { error: 'Not found' });
}

function getSession(req) {
  const token = req.headers['x-session-token'];
  if (!token) return null;
  
  const session = sessions.get(token);
  if (!session) return null;
  
  if (Date.now() > session.expires) {
    sessions.delete(token);
    return null;
  }
  
  return session;
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Start server
initializeTestData();

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  🎲 BlackBook L2 Markets Server (Mock)                ║
║                                                        ║
║  Status: Running                                       ║
║  Port: ${PORT}                                            ║
║  URL: http://localhost:${PORT}                            ║
║                                                        ║
║  Endpoints:                                            ║
║  - POST /auth (authenticate)                           ║
║  - POST /quote (get bet quote)                         ║
║  - POST /predict/session (place bet)                   ║
║  - GET /position/:user/:prop_bet_id                    ║
║  - POST /lp/add/session (add liquidity)                ║
║  - GET /lp/:prop_bet_id (get LP info)                  ║
║  - GET /health (health check)                          ║
╚════════════════════════════════════════════════════════╝
  `);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop other L2 servers first.`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down L2 Markets Server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
