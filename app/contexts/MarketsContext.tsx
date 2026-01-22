'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { MarketsSDK, MarketStatus } from '@/sdk/markets-sdk.js'

interface MarketsContextType {
  sdk: MarketsSDK | null
  isReady: boolean
  
  // Market Loading
  getAllMarkets: () => Promise<any[]>
  getMarket: (marketId: string) => Promise<any>
  getActiveMarkets: () => Promise<any[]>
  getPendingMarkets: () => Promise<any[]>
  getFrozenMarkets: () => Promise<any[]>
  getResolvedMarkets: () => Promise<any[]>
  getMarketsByStatus: (statuses: string[]) => Promise<any[]>
  
  // Prices & Pool
  getPrices: (marketId: string) => Promise<number[]>
  getPoolState: (marketId: string) => Promise<any>
  
  // Trading
  getQuote: (marketId: string, outcomeIndex: number, amount: number) => Promise<any>
  placeBet: (marketId: string, outcomeIndex: number, amount: number) => Promise<any>
  sellShares: (marketId: string, outcomeIndex: number, shares: number) => Promise<any>
  
  // Positions & Balance
  getPosition: (marketId: string) => Promise<any>
  getAllPositions: () => Promise<any[]>
  getBetHistory: () => Promise<any[]>
  getBalance: () => Promise<any>
}

const MarketsContext = createContext<MarketsContextType | undefined>(undefined)

export function MarketsProvider({ children }: { children: ReactNode }) {
  const { activeWallet, activeWalletData, isAuthenticated } = useAuth()
  const [sdk, setSdk] = useState<MarketsSDK | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initializeSDK = async () => {
      if (isAuthenticated && activeWalletData?.publicKey && activeWalletData?.privateKey) {
        console.log('🎯 Initializing MarketsSDK...')
        
        // Import @noble/ed25519 dynamically
        const ed = await import('@noble/ed25519')
        
        // Convert hex strings to Uint8Array
        const privateKeyBytes = Buffer.from(activeWalletData.privateKey, 'hex')
        
        // Create signer function using @noble/ed25519
        const signer = async (message: string): Promise<string> => {
          const messageBytes = new TextEncoder().encode(message)
          const signature = await ed.signAsync(messageBytes, privateKeyBytes)
          return Buffer.from(signature).toString('hex')
        }

        const marketsSDK = new MarketsSDK({
          l2Url: process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234',
          address: activeWalletData.l2Address || activeWalletData.l1Address,
          signer
        })

        setSdk(marketsSDK)
        setIsReady(true)
        console.log('✅ MarketsSDK initialized for', activeWalletData.l2Address || activeWalletData.l1Address)
      } else {
        setSdk(null)
        setIsReady(false)
      }
    }
    
    initializeSDK()
  }, [isAuthenticated, activeWalletData])

  // Market Loading Methods
  const getAllMarkets = async () => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getAll()
  }

  const getMarket = async (marketId: string) => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getMarket(marketId)
  }

  const getActiveMarkets = async () => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getActive()
  }

  const getPendingMarkets = async () => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getPending()
  }

  const getFrozenMarkets = async () => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getFrozen()
  }

  const getResolvedMarkets = async () => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getResolved()
  }

  const getMarketsByStatus = async (statuses: string[]) => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getByStatuses(statuses)
  }

  // Prices & Pool Methods
  const getPrices = async (marketId: string) => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getPrices(marketId)
  }

  const getPoolState = async (marketId: string) => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getPoolState(marketId)
  }

  // Trading Methods
  const getQuote = async (marketId: string, outcomeIndex: number, amount: number) => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getQuote(marketId, outcomeIndex, amount)
  }

  const placeBet = async (marketId: string, outcomeIndex: number, amount: number) => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.bet(marketId, outcomeIndex, amount)
  }

  const sellShares = async (marketId: string, outcomeIndex: number, shares: number) => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.sell(marketId, outcomeIndex, shares)
  }

  // Position & Balance Methods
  const getPosition = async (marketId: string) => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getPosition(marketId)
  }

  const getAllPositions = async () => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getAllPositions()
  }

  const getBetHistory = async () => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getBetHistory()
  }

  const getBalance = async () => {
    if (!sdk) throw new Error('Markets SDK not initialized')
    return sdk.getBalance()
  }

  const value: MarketsContextType = {
    sdk,
    isReady,
    getAllMarkets,
    getMarket,
    getActiveMarkets,
    getPendingMarkets,
    getFrozenMarkets,
    getResolvedMarkets,
    getMarketsByStatus,
    getPrices,
    getPoolState,
    getQuote,
    placeBet,
    sellShares,
    getPosition,
    getAllPositions,
    getBetHistory,
    getBalance
  }

  return (
    <MarketsContext.Provider value={value}>
      {children}
    </MarketsContext.Provider>
  )
}

export function useMarkets() {
  const context = useContext(MarketsContext)
  if (context === undefined) {
    throw new Error('useMarkets must be used within a MarketsProvider')
  }
  return context
}

export { MarketStatus }
