/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BlackBook SDK - Production Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Production-ready configuration for BlackBook Prediction Market SDKs.
 * Handles environment detection, API endpoints, and deployment settings.
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENVIRONMENT DETECTION
// ═══════════════════════════════════════════════════════════════════════════

export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',  
  PRODUCTION: 'production'
};

export const getCurrentEnvironment = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return ENVIRONMENT.DEVELOPMENT;
    }
    if (hostname.includes('staging') || hostname.includes('test')) {
      return ENVIRONMENT.STAGING;
    }
    return ENVIRONMENT.PRODUCTION;
  }
  
  // Node.js environment
  const env = process.env.NODE_ENV || process.env.ENVIRONMENT;
  if (env === 'production' || env === 'prod') return ENVIRONMENT.PRODUCTION;
  if (env === 'staging' || env === 'test') return ENVIRONMENT.STAGING;
  return ENVIRONMENT.DEVELOPMENT;
};

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

export const API_ENDPOINTS = {
  [ENVIRONMENT.DEVELOPMENT]: {
    L1_URL: 'http://localhost:8080',
    L2_URL: 'http://localhost:1234',
    WEBSOCKET_URL: 'ws://localhost:1235',
    EXPLORER_URL: 'http://localhost:8080/explorer'
  },
  
  [ENVIRONMENT.STAGING]: {
    L1_URL: 'https://l1-staging.blackbook.network',
    L2_URL: 'https://l2-staging.blackbook.network', 
    WEBSOCKET_URL: 'wss://ws-staging.blackbook.network',
    EXPLORER_URL: 'https://explorer-staging.blackbook.network'
  },
  
  [ENVIRONMENT.PRODUCTION]: {
    L1_URL: 'https://l1.blackbook.network',
    L2_URL: 'https://l2.blackbook.network',
    WEBSOCKET_URL: 'wss://ws.blackbook.network',
    EXPLORER_URL: 'https://explorer.blackbook.network'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SDK CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const SDK_CONFIG = {
  // Request timeouts (milliseconds)
  TIMEOUTS: {
    DEFAULT: 30000,      // 30 seconds
    BALANCE: 5000,       // 5 seconds for balance queries
    TRADING: 15000,      // 15 seconds for trades
    BRIDGE: 60000,       // 1 minute for bridge operations
    SETTLEMENT: 120000   // 2 minutes for settlements
  },
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_BASE: 1000,  // 1 second base
    BACKOFF_MAX: 10000   // 10 seconds max
  },
  
  // Rate limiting
  RATE_LIMITS: {
    REQUESTS_PER_SECOND: 10,
    BURST_LIMIT: 50
  },
  
  // WebSocket configuration
  WEBSOCKET: {
    RECONNECT_INTERVAL: 5000,
    MAX_RECONNECT_ATTEMPTS: 5,
    PING_INTERVAL: 30000
  },
  
  // Cache configuration
  CACHE: {
    BALANCE_TTL: 5000,      // 5 seconds
    MARKET_DATA_TTL: 10000, // 10 seconds
    PRICE_TTL: 2000         // 2 seconds
  },
  
  // Validation limits
  LIMITS: {
    MIN_BET_AMOUNT: 1,
    MAX_BET_AMOUNT: 100000,
    MIN_BRIDGE_AMOUNT: 10,
    MAX_BRIDGE_AMOUNT: 1000000,
    MAX_TRANSACTION_HISTORY: 1000
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CHAIN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const CHAIN_CONFIG = {
  L1: {
    CHAIN_ID: 0x01,
    NAME: 'BlackBook L1',
    SYMBOL: 'BB',
    DECIMALS: 2,
    BLOCK_TIME: 1000,  // 1 second
    CONFIRMATION_BLOCKS: 3
  },
  
  L2: {
    CHAIN_ID: 0x02,
    NAME: 'BlackBook L2',
    SYMBOL: 'BB',
    DECIMALS: 2,
    BLOCK_TIME: 100,   // 100ms
    CONFIRMATION_BLOCKS: 1
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ERROR CODES
// ═══════════════════════════════════════════════════════════════════════════

export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  
  // Authentication errors
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  EXPIRED_SESSION: 'EXPIRED_SESSION',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Validation errors
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  MARKET_CLOSED: 'MARKET_CLOSED',
  
  // Bridge errors
  BRIDGE_UNAVAILABLE: 'BRIDGE_UNAVAILABLE',
  PENDING_DEPOSIT: 'PENDING_DEPOSIT',
  WITHDRAWAL_LOCKED: 'WITHDRAWAL_LOCKED',
  
  // Trading errors
  MARKET_NOT_FOUND: 'MARKET_NOT_FOUND',
  INVALID_OUTCOME: 'INVALID_OUTCOME',
  SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
  POSITION_NOT_FOUND: 'POSITION_NOT_FOUND'
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get configuration for current environment
 */
export const getConfig = (overrides = {}) => {
  const env = getCurrentEnvironment();
  const endpoints = API_ENDPOINTS[env];
  
  return {
    environment: env,
    ...endpoints,
    ...SDK_CONFIG,
    ...overrides
  };
};

/**
 * Create production-ready SDK configuration
 */
export const createSDKConfig = (userConfig = {}) => {
  const config = getConfig(userConfig);
  
  // Validate required configuration
  if (!config.L1_URL) throw new Error('L1_URL is required');
  if (!config.L2_URL) throw new Error('L2_URL is required');
  
  return {
    // Core URLs
    l1Url: config.L1_URL,
    l2Url: config.L2_URL,
    explorerUrl: config.EXPLORER_URL,
    
    // Optional user credentials
    address: userConfig.address,
    publicKey: userConfig.publicKey,
    signer: userConfig.signer,
    
    // Production settings
    timeout: config.TIMEOUTS.DEFAULT,
    retryAttempts: config.RETRY.MAX_ATTEMPTS,
    enableCache: config.environment === ENVIRONMENT.PRODUCTION,
    enableRateLimit: config.environment === ENVIRONMENT.PRODUCTION,
    
    // Environment flags
    isDevelopment: config.environment === ENVIRONMENT.DEVELOPMENT,
    isStaging: config.environment === ENVIRONMENT.STAGING,
    isProduction: config.environment === ENVIRONMENT.PRODUCTION,
    
    // Chain configuration
    chains: CHAIN_CONFIG,
    
    // Validation limits
    limits: config.LIMITS
  };
};

/**
 * Create error with standardized format
 */
export const createError = (code, message, details = {}) => {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  error.timestamp = Date.now();
  return error;
};

/**
 * Validate amount for operations
 */
export const validateAmount = (amount, operation = 'transaction') => {
  const config = getConfig();
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    throw createError(ERROR_CODES.INVALID_AMOUNT, 'Amount must be a positive number');
  }
  
  if (operation === 'bet') {
    if (numAmount < config.LIMITS.MIN_BET_AMOUNT) {
      throw createError(ERROR_CODES.INVALID_AMOUNT, `Minimum bet amount is ${config.LIMITS.MIN_BET_AMOUNT}`);
    }
    if (numAmount > config.LIMITS.MAX_BET_AMOUNT) {
      throw createError(ERROR_CODES.INVALID_AMOUNT, `Maximum bet amount is ${config.LIMITS.MAX_BET_AMOUNT}`);
    }
  }
  
  if (operation === 'bridge') {
    if (numAmount < config.LIMITS.MIN_BRIDGE_AMOUNT) {
      throw createError(ERROR_CODES.INVALID_AMOUNT, `Minimum bridge amount is ${config.LIMITS.MIN_BRIDGE_AMOUNT}`);
    }
    if (numAmount > config.LIMITS.MAX_BRIDGE_AMOUNT) {
      throw createError(ERROR_CODES.INVALID_AMOUNT, `Maximum bridge amount is ${config.LIMITS.MAX_BRIDGE_AMOUNT}`);
    }
  }
  
  return true;
};

/**
 * Format currency amount for display
 */
export const formatAmount = (amount, decimals = 2) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

/**
 * Get health check URLs for environment
 */
export const getHealthCheckUrls = () => {
  const config = getConfig();
  
  return {
    l1: `${config.L1_URL}/health`,
    l2: `${config.L2_URL}/health`,
    explorer: `${config.EXPLORER_URL}/health`
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  ENVIRONMENT,
  API_ENDPOINTS,
  SDK_CONFIG,
  CHAIN_CONFIG,
  ERROR_CODES,
  getCurrentEnvironment,
  getConfig,
  createSDKConfig,
  createError,
  validateAmount,
  formatAmount,
  getHealthCheckUrls
};