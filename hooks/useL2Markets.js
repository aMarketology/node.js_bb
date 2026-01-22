/**
 * useL2Markets Hook
 * React hook for BlackBook L2 Prediction Markets SDK
 * 
 * Usage:
 *   const { markets, balance, placeBet, loading, error } = useL2Markets(userAddress, signer);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MarketsSDK, MarketStatus } from '@/sdk/markets-sdk.js';

const L2_URL = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234';

export function useL2Markets(userAddress, signer) {
  const [sdk, setSdk] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [balance, setBalance] = useState({ 
    l2_available: 0, 
    l2_locked: 0,
    l1_available: 0,
    l1_connected: false 
  });
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track if component is mounted
  const mountedRef = useRef(true);

  // Initialize SDK
  useEffect(() => {
    if (userAddress && signer) {
      const marketsSdk = new MarketsSDK({
        l2Url: L2_URL,
        address: userAddress,
        signer: signer
      });
      setSdk(marketsSdk);
      console.log('🎯 MarketsSDK initialized for:', userAddress);
    } else {
      setSdk(null);
    }
  }, [userAddress, signer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load active markets
  const loadMarkets = useCallback(async () => {
    if (!sdk) return;
    setLoading(true);
    try {
      const activeMarkets = await sdk.getActive();
      if (mountedRef.current) {
        setMarkets(activeMarkets);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to load markets:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [sdk]);

  // Load markets by status
  const loadMarketsByStatus = useCallback(async (status) => {
    if (!sdk) return [];
    try {
      switch (status) {
        case 'active': return await sdk.getActive();
        case 'pending': return await sdk.getPending();
        case 'frozen': return await sdk.getFrozen();
        case 'resolved': return await sdk.getResolved();
        default: return [];
      }
    } catch (err) {
      console.error(`Failed to load ${status} markets:`, err);
      return [];
    }
  }, [sdk]);

  // Load single market
  const loadMarket = useCallback(async (marketId) => {
    if (!sdk) return null;
    try {
      return await sdk.getMarket(marketId);
    } catch (err) {
      console.error('Failed to load market:', err);
      return null;
    }
  }, [sdk]);

  // Load user balance
  const loadBalance = useCallback(async () => {
    if (!sdk || !userAddress) return;
    try {
      const res = await fetch(`${sdk.l2Url}/balance/${userAddress}`);
      const data = await res.json();
      if (mountedRef.current) {
        setBalance({
          l2_available: data.l2_available || data.available || 0,
          l2_locked: data.l2_locked || data.locked || 0,
          l1_available: data.l1_available || 0,
          l1_connected: data.l1_connected || false,
          has_active_credit: data.has_active_credit || false
        });
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  }, [sdk, userAddress]);

  // Load user positions
  const loadPositions = useCallback(async () => {
    if (!sdk || !userAddress) return;
    try {
      const userPositions = await sdk.getAllPositions();
      if (mountedRef.current) {
        setPositions(userPositions);
      }
    } catch (err) {
      console.error('Failed to load positions:', err);
    }
  }, [sdk, userAddress]);

  // Get position for a specific market
  const getPosition = useCallback(async (marketId) => {
    if (!sdk) return null;
    try {
      return await sdk.getPosition(marketId);
    } catch (err) {
      console.error('Failed to get position:', err);
      return null;
    }
  }, [sdk]);

  // Get quote before placing bet
  const getQuote = useCallback(async (marketId, outcome, amount) => {
    if (!sdk) throw new Error('SDK not initialized');
    try {
      return await sdk.getQuote(marketId, outcome, amount);
    } catch (err) {
      console.error('Failed to get quote:', err);
      throw err;
    }
  }, [sdk]);

  // Place a bet
  const placeBet = useCallback(async (marketId, outcome, amount) => {
    if (!sdk) throw new Error('SDK not initialized');
    setLoading(true);
    try {
      const result = await sdk.bet(marketId, outcome, amount);
      
      // Refresh balance and positions after bet
      await Promise.all([loadBalance(), loadPositions()]);
      
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [sdk, loadBalance, loadPositions]);

  // Sell shares
  const sellShares = useCallback(async (marketId, outcome, shares) => {
    if (!sdk) throw new Error('SDK not initialized');
    setLoading(true);
    try {
      const result = await sdk.sell(marketId, outcome, shares);
      
      // Refresh balance and positions after sell
      await Promise.all([loadBalance(), loadPositions()]);
      
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [sdk, loadBalance, loadPositions]);

  // Get live prices
  const getPrices = useCallback(async (marketId) => {
    if (!sdk) return [];
    try {
      return await sdk.getPrices(marketId);
    } catch (err) {
      console.error('Failed to get prices:', err);
      return [];
    }
  }, [sdk]);

  // Get pool state
  const getPoolState = useCallback(async (marketId) => {
    if (!sdk) return null;
    try {
      return await sdk.getPoolState(marketId);
    } catch (err) {
      console.error('Failed to get pool state:', err);
      return null;
    }
  }, [sdk]);

  // Get bet history
  const getBetHistory = useCallback(async () => {
    if (!sdk) return [];
    try {
      return await sdk.getBetHistory();
    } catch (err) {
      console.error('Failed to get bet history:', err);
      return [];
    }
  }, [sdk]);

  // Create prop bet
  const createProp = useCallback(async (parentMarketId, propData) => {
    if (!sdk) throw new Error('SDK not initialized');
    try {
      return await sdk.createProp(parentMarketId, propData);
    } catch (err) {
      console.error('Failed to create prop:', err);
      throw err;
    }
  }, [sdk]);

  // Initial load
  useEffect(() => {
    if (sdk) {
      loadMarkets();
      loadBalance();
      loadPositions();
    }
  }, [sdk, loadMarkets, loadBalance, loadPositions]);

  // Refresh everything
  const refresh = useCallback(async () => {
    await Promise.all([loadMarkets(), loadBalance(), loadPositions()]);
  }, [loadMarkets, loadBalance, loadPositions]);

  return {
    // SDK instance
    sdk,
    isReady: !!sdk,
    
    // Data
    markets,
    balance,
    positions,
    loading,
    error,
    
    // Market operations
    loadMarkets,
    loadMarketsByStatus,
    loadMarket,
    getPrices,
    getPoolState,
    
    // Trading operations
    getQuote,
    placeBet,
    sellShares,
    createProp,
    
    // User operations
    getPosition,
    getBetHistory,
    
    // Refresh operations
    refreshMarkets: loadMarkets,
    refreshBalance: loadBalance,
    refreshPositions: loadPositions,
    refresh
  };
}

// Re-export MarketStatus for convenience
export { MarketStatus };

export default useL2Markets;
