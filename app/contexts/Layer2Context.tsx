'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { TEST_ACCOUNTS } from '@/lib/test-accounts'

const nacl = require('tweetnacl')

const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'

interface Layer2ContextType {
  l2: Layer2SDK | null
  isConnected: boolean
  sessionExpiry: number | null
  authenticate: () => Promise<boolean>
  
  // Markets
  getMarket: (marketId: string) => Promise<any>
  listMarkets: (filters?: any) => Promise<any[]>
  getEventMarkets: (eventId: string) => Promise<any>
  createParentEvent: (options: any) => Promise<any>
  createPropMarket: (options: any) => Promise<any>
  getPrices: (marketId: string) => Promise<any[]>
  
  // Trading
  placeBet: (marketId: string, outcome: number, amount: number, maxSlippage?: number) => Promise<any>
  getQuote: (marketId: string, outcome: number, amount: number) => Promise<any>
  getPosition: (marketId: string) => Promise<any>
  getAllPositions: () => Promise<any[]>
  sellShares: (marketId: string, outcome: number, shares: number) => Promise<any>
  
  // Drafts
  createDraftProp: (options: any) => Promise<any>
  fundDraft: (draftId: string, amount: number, takeOpposingPosition?: boolean) => Promise<any>
  getMyDrafts: () => Promise<any[]>
  editDraft: (draftId: string, updates: any) => Promise<any>
  deleteDraft: (draftId: string) => Promise<any>
  
  // Oracle & Resolution
  signResolution: (marketId: string, winningOutcome: number, evidence?: string) => Promise<any>
  resolveMarket: (marketId: string, winningOutcome: number, reason?: string) => Promise<any>
  proposeResolution: (marketId: string, outcome: number, evidence?: string) => Promise<any>
  disputeResolution: (marketId: string, reason: string, proposedOutcome?: number) => Promise<any>
  voteOnDispute: (marketId: string, disputeId: string, decision: string, reasoning?: string) => Promise<any>
  getOracleStats: (address?: string) => Promise<any>
  listOracles: () => Promise<any[]>
  
  // Account
  getBalance: () => Promise<any>
  getTransactions: (limit?: number) => Promise<any[]>
  
  // Liquidity
  addLiquidity: (marketId: string, amount: number) => Promise<any>
  removeLiquidity: (marketId: string, shareFraction?: number) => Promise<any>
  getLPInfo: (marketId: string) => Promise<any>
  distributeLPFees: (marketId: string) => Promise<any>
  
  // Insurance
  fileInsuranceClaim: (marketId: string, amount: number, reason: string) => Promise<any>
  getInsuranceFundInfo: () => Promise<any>
}

const Layer2Context = createContext<Layer2ContextType | undefined>(undefined)

class Layer2SDK {
  l2Url: string
  address: string | null
  privateKey: Buffer | null
  publicKey: Buffer | null
  sessionToken: string | null
  sessionExpiry: number
  nonce: number

  constructor(config: any = {}) {
    this.l2Url = config.l2Url || L2_API
    this.address = config.address || null
    this.privateKey = config.privateKey || null
    this.publicKey = config.publicKey || (this.privateKey ? nacl.sign.keyPair.fromSecretKey(this.privateKey).publicKey : null)
    this.sessionToken = null
    this.sessionExpiry = 0
    this.nonce = Date.now()
  }

  sign(message: string): string {
    if (!this.privateKey) throw new Error('No private key available')
    const messageBytes = Buffer.from(message, 'utf8')
    const signature = nacl.sign.detached(messageBytes, this.privateKey)
    return Buffer.from(signature).toString('hex')
  }

  async authenticate(): Promise<any> {
    if (!this.address || !this.publicKey || !this.privateKey) {
      throw new Error('Missing wallet credentials')
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const message = `${this.address}:${timestamp}`
    const signature = this.sign(message)

    const response = await fetch(`${this.l2Url}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: this.address,
        public_key: Buffer.from(this.publicKey).toString('hex'),
        signature,
        timestamp,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || `Authentication failed: ${response.status}`)
    }

    const result = await response.json()
    this.sessionToken = result.session_token
    this.sessionExpiry = result.expires_at

    console.log(`✅ L2 authenticated! Session expires at ${new Date(this.sessionExpiry * 1000).toLocaleTimeString()}`)
    return result
  }

  isSessionValid(): boolean {
    const now = Math.floor(Date.now() / 1000)
    return !!this.sessionToken && now < this.sessionExpiry - 10
  }

  async ensureSession(): Promise<void> {
    if (!this.isSessionValid()) {
      await this.authenticate()
    }
  }

  async request(method: string, path: string, body: any = null): Promise<any> {
    await this.ensureSession()

    const options: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': this.sessionToken,
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${this.l2Url}${path}`, options)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || `Request failed: ${response.status}`)
    }

    return response.json()
  }

  // Market methods
  async getMarket(marketId: string) {
    return this.request('GET', `/markets/${marketId}`)
  }

  async listMarkets(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request('GET', `/markets?${params}`)
  }

  async getEventMarkets(eventId: string) {
    return this.request('GET', `/events/${eventId}/markets`)
  }

  // Trading methods
  async getQuote(marketId: string, outcome: number, amount: number) {
    return this.request('POST', `/markets/${marketId}/quote`, { outcome, amount })
  }

  async placeBet(marketId: string, outcome: number, amount: number, maxSlippage: number = 0.05) {
    const quote = await this.getQuote(marketId, outcome, amount)
    const maxCost = amount * (1 + maxSlippage)

    const result = await this.request('POST', `/markets/${marketId}/bet`, {
      outcome,
      amount,
      max_cost: maxCost,
    })

    console.log(`✅ Bet placed: ${amount} BB on outcome ${outcome}`)
    return result
  }

  async sellShares(marketId: string, outcome: number, shares: number) {
    return this.request('POST', `/markets/${marketId}/sell`, { outcome, shares })
  }

  async getPosition(marketId: string) {
    return this.request('GET', `/markets/${marketId}/position`)
  }

  async getAllPositions() {
    if (!this.address) return []
    return this.request('GET', `/positions/${this.address}`)
  }

  // Account methods
  async getBalance() {
    if (!this.address) throw new Error('No address')
    return this.request('GET', `/balance/${this.address}`)
  }

  async getTransactions(limit: number = 50) {
    if (!this.address) return []
    return this.request('GET', `/ledger/${this.address}?limit=${limit}`)
  }

  // Liquidity methods
  async addLiquidity(marketId: string, amount: number) {
    return this.request('POST', `/markets/${marketId}/add-liquidity`, { amount })
  }

  async removeLiquidity(marketId: string, shareFraction: number = 1.0) {
    return this.request('POST', `/markets/${marketId}/remove-liquidity`, { share_fraction: shareFraction })
  }

  async getLPInfo(marketId: string) {
    return this.request('GET', `/lp/${marketId}/info`)
  }

  async distributeLPFees(marketId: string) {
    return this.request('POST', `/lp/${marketId}/distribute`)
  }

  // Market creation
  async createParentEvent(options: any) {
    return this.request('POST', '/markets', options)
  }

  async createPropMarket(options: any) {
    return this.request('POST', '/markets', options)
  }

  async getPrices(marketId: string) {
    const market = await this.getMarket(marketId)
    return market.cpmm_pool?.current_prices || []
  }

  // Draft markets
  async createDraftProp(options: any) {
    return this.request('POST', '/drafts', options)
  }

  async fundDraft(draftId: string, amount: number, takeOpposingPosition: boolean = false) {
    return this.request('POST', `/drafts/${draftId}/fund`, { amount, take_opposing_position: takeOpposingPosition })
  }

  async getMyDrafts() {
    return this.request('GET', '/drafts/mine')
  }

  async editDraft(draftId: string, updates: any) {
    return this.request('PATCH', `/drafts/${draftId}`, updates)
  }

  async deleteDraft(draftId: string) {
    return this.request('DELETE', `/drafts/${draftId}`)
  }

  // Oracle & Resolution
  sign(message: string): string {
    if (!this.privateKey) throw new Error('No private key available')
    const messageBytes = Buffer.from(message, 'utf8')
    const signature = nacl.sign.detached(messageBytes, this.privateKey)
    return Buffer.from(signature).toString('hex')
  }

  async signResolution(marketId: string, winningOutcome: number, evidence: string = '') {
    const timestamp = Math.floor(Date.now() / 1000)
    const message = `resolve:${marketId}:${winningOutcome}:${timestamp}`
    const signature = this.sign(message)
    return this.request('POST', `/markets/${marketId}/sign-resolution`, {
      oracle_address: this.address,
      signature,
      winning_outcome: winningOutcome,
      evidence,
      timestamp,
    })
  }

  async resolveMarket(marketId: string, winningOutcome: number, reason: string = '') {
    const timestamp = Math.floor(Date.now() / 1000)
    this.nonce++
    const message = `${this.address}:${marketId}:${winningOutcome}:${this.nonce}:${timestamp}`
    const signature = this.sign(message)
    return this.request('POST', `/markets/${marketId}/resolve`, {
      resolver_address: this.address,
      signature,
      winning_outcome: winningOutcome,
      resolution_reason: reason,
      nonce: this.nonce,
      timestamp,
    })
  }

  async proposeResolution(marketId: string, outcome: number, evidence: string = '') {
    return this.request('POST', `/markets/${marketId}/propose-resolution`, { outcome, evidence })
  }

  async disputeResolution(marketId: string, reason: string, proposedOutcome: number | null = null) {
    return this.request('POST', `/markets/${marketId}/dispute`, {
      disputer: this.address,
      reason,
      proposed_outcome: proposedOutcome,
    })
  }

  async voteOnDispute(marketId: string, disputeId: string, decision: string, reasoning: string = '') {
    return this.request('POST', `/disputes/${disputeId}/vote`, {
      oracle_address: this.address,
      decision,
      reasoning,
    })
  }

  async getOracleStats(address: string | null = null) {
    const oracleAddress = address || this.address
    return this.request('GET', `/oracles/${oracleAddress}/stats`)
  }

  async listOracles() {
    return this.request('GET', '/oracles')
  }

  // Insurance
  async fileInsuranceClaim(marketId: string, amount: number, reason: string) {
    return this.request('POST', '/insurance/claim', {
      market_id: marketId,
      claimant: this.address,
      amount,
      reason,
    })
  }

  async getInsuranceFundInfo() {
    return this.request('GET', '/insurance/fund')
  }
}

export function Layer2Provider({ children }: { children: ReactNode }) {
  const { activeWallet, activeWalletData, user, walletAddress } = useAuth()
  const [l2, setL2] = useState<Layer2SDK | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null)

  // Initialize L2 SDK when wallet changes
  useEffect(() => {
    initializeL2()
  }, [activeWallet, activeWalletData, user, walletAddress])

  async function initializeL2() {
    try {
      let address = null
      let privateKey = null
      let publicKey = null

      // Use active wallet credentials
      if (activeWallet === 'alice') {
        address = TEST_ACCOUNTS.alice.l2Address
        privateKey = Buffer.from(TEST_ACCOUNTS.alice.privateKey, 'hex')
        publicKey = Buffer.from(TEST_ACCOUNTS.alice.publicKey, 'hex')
      } else if (activeWallet === 'bob') {
        address = TEST_ACCOUNTS.bob.l2Address
        privateKey = Buffer.from(TEST_ACCOUNTS.bob.privateKey, 'hex')
        publicKey = Buffer.from(TEST_ACCOUNTS.bob.publicKey, 'hex')
      } else if (user?.blackbook_address || walletAddress) {
        address = (user?.blackbook_address || walletAddress)?.replace('L1_', 'L2_')
        // For user's own wallet, they need to sign with their own key
        // This would come from their wallet extension/connection
        console.warn('⚠️ User wallet - need to implement wallet signing')
        return
      }

      if (!address || !privateKey) {
        console.log('⏳ Waiting for wallet connection...')
        setL2(null)
        setIsConnected(false)
        return
      }

      console.log(`🔗 Initializing L2 SDK for ${activeWallet === 'alice' ? '🟣 Alice' : activeWallet === 'bob' ? '🔵 Bob' : '👤 User'}`)
      
      const sdk = new Layer2SDK({
        l2Url: L2_API,
        address,
        privateKey,
        publicKey,
      })

      setL2(sdk)
      
      // Authenticate
      const session = await sdk.authenticate()
      setSessionExpiry(session.expires_at)
      setIsConnected(true)

      console.log(`✅ L2 connected: ${address}`)
    } catch (error: any) {
      console.error('❌ Failed to initialize L2:', error.message)
      setL2(null)
      setIsConnected(false)
    }
  }

  async function authenticate() {
    if (!l2) return false
    try {
      const session = await l2.authenticate()
      setSessionExpiry(session.expires_at)
      setIsConnected(true)
      return true
    } catch (error) {
      console.error('Authentication failed:', error)
      return false
    }
  }

  // Wrapper methods that handle errors gracefully
  const wrapMethod = (methodName: string, ...args: any[]) => {
    if (!l2) throw new Error('L2 not initialized')
    return (l2 as any)[methodName](...args)
  }

  const value: Layer2ContextType = {
    l2,
    isConnected,
    sessionExpiry,
    authenticate,
    
    // Markets
    getMarket: (marketId) => wrapMethod('getMarket', marketId),
    listMarkets: (filters) => wrapMethod('listMarkets', filters),
    getEventMarkets: (eventId) => wrapMethod('getEventMarkets', eventId),
    createParentEvent: (options) => wrapMethod('createParentEvent', options),
    createPropMarket: (options) => wrapMethod('createPropMarket', options),
    getPrices: (marketId) => wrapMethod('getPrices', marketId),
    
    // Trading
    placeBet: (marketId, outcome, amount, maxSlippage) => wrapMethod('placeBet', marketId, outcome, amount, maxSlippage),
    getQuote: (marketId, outcome, amount) => wrapMethod('getQuote', marketId, outcome, amount),
    getPosition: (marketId) => wrapMethod('getPosition', marketId),
    getAllPositions: () => wrapMethod('getAllPositions'),
    sellShares: (marketId, outcome, shares) => wrapMethod('sellShares', marketId, outcome, shares),
    
    // Drafts
    createDraftProp: (options) => wrapMethod('createDraftProp', options),
    fundDraft: (draftId, amount, takeOpposingPosition) => wrapMethod('fundDraft', draftId, amount, takeOpposingPosition),
    getMyDrafts: () => wrapMethod('getMyDrafts'),
    editDraft: (draftId, updates) => wrapMethod('editDraft', draftId, updates),
    deleteDraft: (draftId) => wrapMethod('deleteDraft', draftId),
    
    // Oracle & Resolution
    signResolution: (marketId, winningOutcome, evidence) => wrapMethod('signResolution', marketId, winningOutcome, evidence),
    resolveMarket: (marketId, winningOutcome, reason) => wrapMethod('resolveMarket', marketId, winningOutcome, reason),
    proposeResolution: (marketId, outcome, evidence) => wrapMethod('proposeResolution', marketId, outcome, evidence),
    disputeResolution: (marketId, reason, proposedOutcome) => wrapMethod('disputeResolution', marketId, reason, proposedOutcome),
    voteOnDispute: (marketId, disputeId, decision, reasoning) => wrapMethod('voteOnDispute', marketId, disputeId, decision, reasoning),
    getOracleStats: (address) => wrapMethod('getOracleStats', address),
    listOracles: () => wrapMethod('listOracles'),
    
    // Account
    getBalance: () => wrapMethod('getBalance'),
    getTransactions: (limit) => wrapMethod('getTransactions', limit),
    
    // Liquidity
    addLiquidity: (marketId, amount) => wrapMethod('addLiquidity', marketId, amount),
    removeLiquidity: (marketId, shareFraction) => wrapMethod('removeLiquidity', marketId, shareFraction),
    getLPInfo: (marketId) => wrapMethod('getLPInfo', marketId),
    distributeLPFees: (marketId) => wrapMethod('distributeLPFees', marketId),
    
    // Insurance
    fileInsuranceClaim: (marketId, amount, reason) => wrapMethod('fileInsuranceClaim', marketId, amount, reason),
    getInsuranceFundInfo: () => wrapMethod('getInsuranceFundInfo'),
  }

  return <Layer2Context.Provider value={value}>{children}</Layer2Context.Provider>
}

export function useLayer2() {
  const context = useContext(Layer2Context)
  if (context === undefined) {
    throw new Error('useLayer2 must be used within a Layer2Provider')
  }
  return context
}
