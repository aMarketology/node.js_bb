/**
 * useCreditPrediction Hook
 * React hook for BlackBook L2 Credit Prediction SDK
 * Full bridge and deposit functionality
 * 
 * Usage:
 *   const { bridge, withdraw, balance, loading } = useCreditPrediction(userAddress, publicKey, signer);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CreditPredictionSDK } from '@/sdk/credit-prediction-actions-sdk.js';

const L1_URL = process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080';
const L2_URL = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function useCreditPrediction(userAddress, publicKey, signer, options = {}) {
  const [sdk, setSdk] = useState(null);
  const [balance, setBalance] = useState({
    l1_available: 0,
    l1_locked: 0,
    l2_available: 0,
    l2_locked: 0,
    total_available: 0
  });
  const [loading, setLoading] = useState(true);
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  
  // Track if component is mounted
  const mountedRef = useRef(true);
  const unsubscribeRef = useRef(null);

  // Initialize SDK
  useEffect(() => {
    if (userAddress && signer) {
      const creditSdk = new CreditPredictionSDK({
        l2Url: L2_URL,
        l1Url: L1_URL,
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_ANON_KEY,
        address: userAddress,
        publicKey: publicKey,
        signer: signer,
        isDealerMode: options.isDealerMode || false
      });

      // Subscribe to SDK events
      unsubscribeRef.current = creditSdk.on((event) => {
        console.log('📡 CreditPredictionSDK Event:', event);
        if (mountedRef.current) {
          setEvents(prev => [...prev.slice(-49), { ...event, timestamp: Date.now() }]);
          
          // Auto-refresh balance on certain events
          if (['bridge_completed', 'withdrawal_completed', 'bet_placed'].includes(event.type)) {
            loadBalance(creditSdk);
          }
        }
      });

      setSdk(creditSdk);
      console.log('💳 CreditPredictionSDK initialized for:', userAddress);
    } else {
      setSdk(null);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [userAddress, publicKey, signer, options.isDealerMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load balance helper
  const loadBalance = useCallback(async (sdkInstance = sdk) => {
    if (!sdkInstance) return;
    try {
      // Try unified balance first
      const unifiedData = await sdkInstance.getUnifiedBalance().catch(() => null);
      
      if (unifiedData) {
        if (mountedRef.current) {
          setBalance({
            l1_available: unifiedData.l1Available || 0,
            l1_locked: unifiedData.l1Locked || 0,
            l2_available: unifiedData.l2Available || 0,
            l2_locked: unifiedData.l2Locked || 0,
            total_available: unifiedData.totalAvailable || 0,
            has_active_credit: unifiedData.hasActiveCredit || false
          });
        }
      } else {
        // Fallback to separate calls
        const [l2Data, l1Data] = await Promise.all([
          sdkInstance.getBalance().catch(() => ({ available: 0, locked: 0 })),
          sdkInstance.getL1Balance().catch(() => ({ available: 0, locked: 0 }))
        ]);

        if (mountedRef.current) {
          setBalance({
            l1_available: l1Data.available || 0,
            l1_locked: l1Data.locked || 0,
            l2_available: l2Data.available || 0,
            l2_locked: l2Data.locked || 0,
            total_available: (l1Data.available || 0) + (l2Data.available || 0),
            has_active_credit: l2Data.hasActiveCredit || false
          });
        }
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  }, [sdk]);

  // Get L1 balance only
  const getL1Balance = useCallback(async () => {
    if (!sdk) throw new Error('SDK not initialized');
    try {
      return await sdk.getL1Balance();
    } catch (err) {
      console.error('Failed to get L1 balance:', err);
      throw err;
    }
  }, [sdk]);

  // Get L2 balance only
  const getL2Balance = useCallback(async () => {
    if (!sdk) throw new Error('SDK not initialized');
    try {
      return await sdk.getBalance();
    } catch (err) {
      console.error('Failed to get L2 balance:', err);
      throw err;
    }
  }, [sdk]);

  // Bridge L1 → L2 (full flow)
  const bridge = useCallback(async (amount) => {
    if (!sdk) throw new Error('SDK not initialized');
    setBridgeLoading(true);
    setError(null);
    
    try {
      // Check L1 balance first
      const l1Balance = await sdk.getL1Balance();
      if (l1Balance.available < amount) {
        throw new Error(`Insufficient L1 balance: ${l1Balance.available} available, ${amount} requested`);
      }

      const result = await sdk.bridge(amount);
      
      // Refresh balance after bridge
      await loadBalance();
      
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setBridgeLoading(false);
      }
    }
  }, [sdk, loadBalance]);

  // Bridge Step 1: Lock on L1
  const bridgeLockOnL1 = useCallback(async (amount) => {
    if (!sdk) throw new Error('SDK not initialized');
    try {
      return await sdk.bridgeLockOnL1(amount);
    } catch (err) {
      console.error('Failed to lock on L1:', err);
      throw err;
    }
  }, [sdk]);

  // Bridge Step 2: Claim on L2
  const bridgeClaimOnL2 = useCallback(async (lockId, amount, l1TxHash) => {
    if (!sdk) throw new Error('SDK not initialized');
    try {
      const result = await sdk.bridgeClaimOnL2(lockId, amount, l1TxHash);
      await loadBalance();
      return result;
    } catch (err) {
      console.error('Failed to claim on L2:', err);
      throw err;
    }
  }, [sdk, loadBalance]);

  // Request withdrawal L2 → L1
  const requestWithdrawal = useCallback(async (amount) => {
    if (!sdk) throw new Error('SDK not initialized');
    setBridgeLoading(true);
    setError(null);
    
    try {
      // Check L2 balance first
      const l2Balance = await sdk.getBalance();
      if (l2Balance.available < amount) {
        throw new Error(`Insufficient L2 balance: ${l2Balance.available} available, ${amount} requested`);
      }

      const result = await sdk.requestWithdrawal(amount);
      
      // Refresh balance after withdrawal request
      await loadBalance();
      
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setBridgeLoading(false);
      }
    }
  }, [sdk, loadBalance]);

  // Get user's deposit history
  const getDeposits = useCallback(async () => {
    if (!sdk) return [];
    try {
      return await sdk.getMyDeposits();
    } catch (err) {
      console.error('Failed to get deposits:', err);
      return [];
    }
  }, [sdk]);

  // Get user's withdrawal history
  const getWithdrawals = useCallback(async () => {
    if (!sdk) return [];
    try {
      return await sdk.getMyWithdrawals();
    } catch (err) {
      console.error('Failed to get withdrawals:', err);
      return [];
    }
  }, [sdk]);

  // Get user portfolio (balance + positions + P&L)
  const getPortfolio = useCallback(async () => {
    if (!sdk) throw new Error('SDK not initialized');
    try {
      return await sdk.getPortfolio();
    } catch (err) {
      console.error('Failed to get portfolio:', err);
      throw err;
    }
  }, [sdk]);

  // Get user status (comprehensive)
  const getUserStatus = useCallback(async () => {
    if (!sdk) throw new Error('SDK not initialized');
    try {
      return await sdk.getUserStatus();
    } catch (err) {
      console.error('Failed to get user status:', err);
      throw err;
    }
  }, [sdk]);

  // Initial load
  useEffect(() => {
    if (sdk) {
      setLoading(true);
      loadBalance().finally(() => {
        if (mountedRef.current) {
          setLoading(false);
        }
      });
    }
  }, [sdk, loadBalance]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await loadBalance();
  }, [loadBalance]);

  return {
    // SDK instance
    sdk,
    isReady: !!sdk,
    
    // State
    balance,
    loading,
    bridgeLoading,
    error,
    events,
    
    // Balance operations
    refreshBalance: loadBalance,
    getL1Balance,
    getL2Balance,
    
    // Bridge operations (L1 → L2)
    bridge,
    bridgeLockOnL1,
    bridgeClaimOnL2,
    
    // Withdrawal operations (L2 → L1)
    requestWithdrawal,
    
    // History
    getDeposits,
    getWithdrawals,
    
    // User info
    getPortfolio,
    getUserStatus,
    
    // Refresh
    refresh
  };
}

export default useCreditPrediction;
