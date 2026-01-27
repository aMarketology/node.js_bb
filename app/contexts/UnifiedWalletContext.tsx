'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { getBalance as getL1Balance, getTransactionHistory, signTransfer } from '@/lib/blackbook-wallet'
import { signWithdrawal } from '@/lib/l2-signer'
import { hexToBytes } from '@/lib/address-utils'

const L1_API = process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080'
const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'

interface Balance {
  available: number
  locked: number
}

interface Transaction {
  tx_id: string
  type: string
  from: string
  to: string
  amount: number
  timestamp: number
  status: string
}

interface UnifiedWalletContextType {
  // L1 Balance
  l1Balance: Balance
  loadL1Balance: () => Promise<void>
  
  // L2 Balance
  l2Balance: Balance
  loadL2Balance: () => Promise<void>
  
  // Transactions
  transactions: Transaction[]
  loadTransactions: () => Promise<void>
  
  // Transfer L1 → L1
  transferL1: (to: string, amount: number) => Promise<{ success: boolean; message: string }>
  
  // Bridge L1 → L2
  bridgeToL2: (amount: number) => Promise<{ success: boolean; message: string }>
  
  // Withdraw L2 → L1
  withdrawToL1: (amount: number) => Promise<{ success: boolean; message: string }>
  
  // Mint tokens (admin)
  mintTokens: (amount: number) => Promise<{ success: boolean; message: string }>
  
  // Loading states
  loading: boolean
}

const UnifiedWalletContext = createContext<UnifiedWalletContextType | undefined>(undefined)

export function UnifiedWalletProvider({ children }: { children: ReactNode }) {
  const { activeWalletData, isAuthenticated } = useAuth()
  
  const [l1Balance, setL1Balance] = useState<Balance>({ available: 0, locked: 0 })
  const [l2Balance, setL2Balance] = useState<Balance>({ available: 0, locked: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  // Get current addresses (memoized)
  const addresses = useMemo(() => {
    if (!activeWalletData) return null
    return {
      l1: activeWalletData.l1Address,
      l2: activeWalletData.l2Address,
      publicKey: activeWalletData.publicKey,
      privateKey: activeWalletData.privateKey
    }
  }, [activeWalletData])

  // Load L1 balance
  const loadL1Balance = useCallback(async () => {
    if (!addresses?.l1) return
    
    try {
      const data = await getL1Balance(L1_API, addresses.l1)
      setL1Balance({ available: data.balance || 0, locked: data.pending || 0 })
    } catch (error) {
      console.error('Failed to load L1 balance:', error)
      setL1Balance({ available: 0, locked: 0 })
    }
  }, [addresses?.l1])

  // Load L2 balance
  const loadL2Balance = useCallback(async () => {
    if (!addresses?.l2) return
    
    try {
      const response = await fetch(`${L2_API}/balance/${addresses.l2}`)
      if (response.ok) {
        const data = await response.json()
        setL2Balance({ available: data.available || 0, locked: data.locked || 0 })
      } else {
        setL2Balance({ available: 0, locked: 0 })
      }
    } catch (error) {
      console.error('Failed to load L2 balance:', error)
      setL2Balance({ available: 0, locked: 0 })
    }
  }, [addresses?.l2])

  // Load transactions
  const loadTransactions = useCallback(async () => {
    if (!addresses?.l1) return
    
    try {
      const result = await getTransactionHistory(L1_API, addresses.l1, 10)
      if (result.success) {
        setTransactions(result.transactions || [])
      }
    } catch (error) {
      console.error('Failed to load transactions:', error)
      setTransactions([])
    }
  }, [addresses?.l1])

  // Transfer L1 → L1
  const transferL1 = useCallback(async (to: string, amount: number): Promise<{ success: boolean; message: string }> => {
    if (!addresses) {
      return { success: false, message: 'No wallet connected' }
    }

    if (!addresses.privateKey || !addresses.publicKey) {
      return { success: false, message: 'Wallet keys not available' }
    }

    try {
      setLoading(true)
      
      // Convert hex strings to bytes if needed
      let privateKey = typeof addresses.privateKey === 'string' ? hexToBytes(addresses.privateKey) : addresses.privateKey
      let publicKey = typeof addresses.publicKey === 'string' ? hexToBytes(addresses.publicKey) : addresses.publicKey
      
      // Sign transfer
      const signedRequest = await signTransfer(
        privateKey,
        publicKey,
        addresses.l1,
        to,
        amount
      )
      
      // Submit to L1 server
      const response = await fetch('/api/l1-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/transfer',
          method: 'POST',
          data: signedRequest
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        return { success: false, message: result.error || 'Transfer failed' }
      }

      // Refresh balances and transactions
      await Promise.all([loadL1Balance(), loadTransactions()])
      
      return { success: true, message: `Transferred ${amount} tokens to ${to}` }
    } catch (error: any) {
      return { success: false, message: error.message || 'Transfer failed' }
    } finally {
      setLoading(false)
    }
  }, [addresses, loadL1Balance, loadTransactions])

  // Bridge L1 → L2
  const bridgeToL2 = useCallback(async (amount: number): Promise<{ success: boolean; message: string }> => {
    if (!addresses) {
      return { success: false, message: 'No wallet connected' }
    }

    try {
      setLoading(true)
      
      // TODO: Implement L1 → L2 bridge
      // 1. Lock funds on L1
      // 2. Submit proof to L2
      // 3. Claim on L2
      
      return { success: false, message: 'Bridge not yet implemented' }
    } catch (error: any) {
      return { success: false, message: error.message || 'Bridge failed' }
    } finally {
      setLoading(false)
    }
  }, [addresses])

  // Withdraw L2 → L1
  const withdrawToL1 = useCallback(async (amount: number): Promise<{ success: boolean; message: string }> => {
    if (!addresses) {
      return { success: false, message: 'No wallet connected' }
    }

    if (!addresses.privateKey || !addresses.publicKey) {
      return { success: false, message: 'Wallet keys not available' }
    }

    try {
      setLoading(true)
      
      // Sign withdrawal request
      const signed = await signWithdrawal(
        amount,
        addresses.l2,
        addresses.privateKey,
        addresses.publicKey
      )

      // Submit to L2 server
      const response = await fetch(`${L2_API}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_address: addresses.l2,
          amount: amount,
          public_key: signed.publicKey,
          signature: signed.signature,
          timestamp: signed.timestamp,
          nonce: signed.nonce
        })
      })

      if (!response.ok) {
        const text = await response.text()
        return { success: false, message: text || `HTTP ${response.status}` }
      }

      // Refresh balances and transactions
      await Promise.all([loadL1Balance(), loadL2Balance(), loadTransactions()])
      
      return { success: true, message: 'Withdrawal successful' }
    } catch (error: any) {
      return { success: false, message: error.message || 'Withdrawal failed' }
    } finally {
      setLoading(false)
    }
  }, [addresses, loadL1Balance, loadL2Balance, loadTransactions])

  // Mint tokens (admin function)
  const mintTokens = useCallback(async (amount: number): Promise<{ success: boolean; message: string }> => {
    if (!addresses?.l1) {
      return { success: false, message: 'No wallet connected' }
    }

    try {
      setLoading(true)
      
      const response = await fetch(`/api/l1-proxy?endpoint=${encodeURIComponent('/admin/mint')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: addresses.l1,
          amount: amount
        })
      })

      if (!response.ok) {
        const text = await response.text()
        return { success: false, message: text || `HTTP ${response.status}` }
      }

      // Refresh balances and transactions
      await Promise.all([loadL1Balance(), loadTransactions()])
      
      return { success: true, message: `Minted ${amount} tokens` }
    } catch (error: any) {
      return { success: false, message: error.message || 'Mint failed' }
    } finally {
      setLoading(false)
    }
  }, [addresses?.l1, loadL1Balance, loadTransactions])

  // Load balances when wallet changes
  useEffect(() => {
    if (isAuthenticated && addresses) {
      loadL1Balance()
      loadL2Balance()
      loadTransactions()
    } else {
      setL1Balance({ available: 0, locked: 0 })
      setL2Balance({ available: 0, locked: 0 })
      setTransactions([])
    }
  }, [isAuthenticated, addresses, loadL1Balance, loadL2Balance, loadTransactions])

  const value = {
    l1Balance,
    l2Balance,
    transactions,
    loadL1Balance,
    loadL2Balance,
    loadTransactions,
    transferL1,
    bridgeToL2,
    withdrawToL1,
    mintTokens,
    loading
  }

  return (
    <UnifiedWalletContext.Provider value={value}>
      {children}
    </UnifiedWalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(UnifiedWalletContext)
  if (!context) {
    throw new Error('useWallet must be used within UnifiedWalletProvider')
  }
  return context
}
