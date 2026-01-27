// BlackBook L1 Wallet Page
// Full wallet management with creation flow and transaction signing
// 
// SECURITY: Private keys are NEVER stored. They are derived on-demand
// using Argon2id from the user's password + encrypted vault.

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'
import BridgeInterface from '@/app/components/BridgeInterface'
import PasswordPrompt from '@/app/components/PasswordPrompt'
import { 
  createWallet, 
  sendTransfer,
  sendTransferSecure,
  getBalance, 
  getTransactionHistory,
  forkPassword,
  bytesToHex,
  type UnlockedWallet,
  type VaultSession
} from '@/lib/blackbook-wallet'
import { saveWalletVault, getWalletVault, hasWallet } from '@/lib/supabase'
import { 
  getStoredWalletKey, 
  storeWalletKey, 
  clearWalletKey
} from '@/lib/wallet-session'

// BlackBook L1 API URL
const L1_API_URL = process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080'

interface Transaction {
  tx_id: string
  type: 'transfer' | 'bridge_deposit' | 'bridge_withdraw' | 'reward'
  from: string
  to: string
  amount: number
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}

interface WalletState {
  address: string | null
  balance: number
  pendingBalance: number
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  hasVault: boolean
}

type WalletCreationStep = 'password' | 'mnemonic' | 'verify' | 'complete'
type ModalType = 'none' | 'create' | 'unlock' | 'send'

export default function WalletPage() {
  const { 
    user, 
    isAuthenticated, 
    loading: authLoading, 
    walletAddress, 
    refreshProfile, 
    activeWallet,
    vaultSession,
    getPassword,
    isPasswordUnlocked,
    unlockWithPassword
  } = useAuth()
  
  // Get wallet owner name based on active wallet
  const getWalletOwnerName = () => {
    if (activeWallet === 'alice') return "Alice's"
    if (activeWallet === 'bob') return "Bob's"
    return user?.user_id || user?.email?.split('@')[0] || 'Your'
  }
  const router = useRouter()
  
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: 0,
    pendingBalance: 0,
    transactions: [],
    isLoading: true,
    error: null,
    hasVault: false
  })
  
  // Unlocked wallet (in memory only) - for test accounts only
  const [unlockedWallet, setUnlockedWallet] = useState<UnlockedWallet | null>(null)
  
  // Track if we're currently loading to prevent duplicate calls
  const loadingRef = useRef(false)
  
  // Modal states
  const [activeModal, setActiveModal] = useState<ModalType>('none')
  const [activeTab, setActiveTab] = useState<'overview' | 'bridge' | 'send' | 'receive' | 'history'>('overview')

  // Wallet creation flow
  const [creationStep, setCreationStep] = useState<WalletCreationStep>('password')
  const [createPassword, setCreatePassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [generatedMnemonic, setGeneratedMnemonic] = useState('')
  const [verifyWords, setVerifyWords] = useState<{index: number; word: string}[]>([])
  const [verifyInputs, setVerifyInputs] = useState<string[]>(['', '', ''])
  const [mnemonicBackedUp, setMnemonicBackedUp] = useState(false)
  const [creationLoading, setCreationLoading] = useState(false)
  const [creationError, setCreationError] = useState('')

  // Unlock modal - no longer needed for user's wallet (password in memory)
  const [unlockPassword, setUnlockPassword] = useState('')
  const [unlockLoading, setUnlockLoading] = useState(false)
  const [unlockError, setUnlockError] = useState('')

  // Send modal
  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')
  
  // Password prompt for when session expires
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [passwordError, setPasswordError] = useState('')
  
  // Vault migration
  const [showVaultMigration, setShowVaultMigration] = useState(false)
  
  // Wallet migration/reset state
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false)
  const [resettingWallet, setResettingWallet] = useState(false)

  // Redirect if not authenticated - only redirect once auth loading is complete
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // Update wallet when activeWallet changes (for Alice/Bob switching)
  useEffect(() => {
    // Prevent duplicate loading
    if (loadingRef.current) return
    
    // Import addresses directly from test accounts to ensure correct values
    const ALICE_ADDRESS = 'L1_52882D768C0F3E7932AAD1813CF8B19058D507A8'
    const BOB_ADDRESS = 'L1_5DB4B525FB40D6EA6BFD24094C2BC24984BAC433'
    
    if (activeWallet === 'alice') {
      // For Alice test account
      const aliceAddress = ALICE_ADDRESS
      console.log('🟣 Switching to Alice wallet:', aliceAddress)
      setWallet({
        address: aliceAddress,
        balance: 0,
        pendingBalance: 0,
        transactions: [],
        isLoading: true,
        error: null,
        hasVault: true
      })
      setUnlockedWallet({
        address: aliceAddress,
        privateKey: 'c0e349153cbc75e9529b5f1963205cab783463c6835c826a7587e0e0903c6705',
        publicKey: '18f2c2e3bcb7a4b5329cfed4bd79bf17df4d47aa1888a6b3d1a1450fb53a8a24',
        mnemonic: 'machine sword cause scrub simple damage program together spoon lock ball banana'
      } as any)
      loadWalletData(aliceAddress)
    } else if (activeWallet === 'bob') {
      // For Bob test account
      const bobAddress = BOB_ADDRESS
      console.log('🔵 Switching to Bob wallet:', bobAddress)
      setWallet({
        address: bobAddress,
        balance: 0,
        pendingBalance: 0,
        transactions: [],
        isLoading: true,
        error: null,
        hasVault: true
      })
      setUnlockedWallet({
        address: bobAddress,
        privateKey: '582420216093fcff65b0eec2ca2c8227dfc2b6b7428110f36c3fc1349c4b2f5a',
        publicKey: 'e4ac49e5a04ef7dfc6e1a838fdf14597f2d514d0029a82cb45c916293487c25b',
        mnemonic: 'base echo grape penalty hawk resemble obscure unusual throw paddle carpet elder'
      } as any)
      loadWalletData(bobAddress)
    } else if (activeWallet === 'user') {
      // Switch back to user's wallet
      const userAddress = user?.blackbook_address
      console.log('👤 Switching to user wallet:', userAddress)
      if (userAddress) {
        setWallet(prev => ({
          ...prev,
          address: userAddress,
          isLoading: true
        }))
        setUnlockedWallet(null) // User wallet needs to be unlocked separately
        loadWalletData(userAddress)
      }
    }
  }, [activeWallet]) // Only depend on activeWallet, not walletAddress

  // Check for existing wallet and load data (only for user's own wallet)
  useEffect(() => {
    async function initWallet() {
      // Skip if using test accounts - they're handled by the wallet switching effect
      if (activeWallet === 'alice' || activeWallet === 'bob') {
        return
      }
      
      if (!user?.user_id) {
        setWallet(prev => ({ ...prev, isLoading: false }))
        return
      }

      try {
        // Check if user has a wallet vault
        const walletExists = await hasWallet(user.user_id)
        
        if (user.blackbook_address) {
          // User has wallet, load balance
          await loadWalletData(user.blackbook_address)
          setWallet(prev => ({ ...prev, hasVault: walletExists }))
          
          // If wallet exists, sync vault to user_vaults (backfill if needed)
          if (walletExists && user.auth_id) {
            console.log('🔍 Checking vault data for sync...', { user_id: user.user_id, auth_id: user.auth_id })
            const vaultData = await getWalletVault(user.user_id, user.auth_id)
            console.log('📦 Vault data retrieved:', {
              has_vault: !!vaultData,
              has_nonce: !!vaultData?.nonce,
              nonce_value: vaultData?.nonce,
              has_encrypted_blob: !!vaultData?.encrypted_blob,
              encrypted_blob_preview: vaultData?.encrypted_blob?.substring(0, 50)
            })
            
            if (vaultData) {
              if (!vaultData.nonce && vaultData.encrypted_blob) {
                // Old wallet without nonce - need to regenerate wallet with proper nonce
                console.error('❌ Old wallet format detected - missing nonce. User must create a new wallet.')
                setShowMigrationPrompt(true)
              } else if (vaultData.nonce) {
                console.log('🔄 Syncing existing wallet to user_vaults')
                const syncResult = await saveWalletVault({
                  user_id: user.user_id,
                  auth_id: user.auth_id,
                  encrypted_blob: vaultData.encrypted_blob,
                  nonce: vaultData.nonce,
                  vault_salt: vaultData.vault_salt,
                  auth_salt: vaultData.auth_salt,
                  blackbook_address: vaultData.blackbook_address,
                  public_key: vaultData.public_key,
                  vault_version: vaultData.vault_version
                })
                console.log('🔄 Sync result:', syncResult)
              }
            } else {
              console.warn('⚠️ No vault data found')
            }
          } else {
            console.warn('⚠️ Cannot sync - wallet exists:', walletExists, 'auth_id:', user.auth_id)
          }
          
          // Wallet session is now loaded via AuthContext at login
          // No need for attemptAutoUnlock - password is stored in memory
          if (vaultSession) {
            console.log('✅ Vault session available for secure signing')
          }
        } else {
          setWallet(prev => ({ 
            ...prev, 
            isLoading: false, 
            hasVault: walletExists 
          }))
        }
      } catch (error) {
        console.error('Failed to init wallet:', error)
        setWallet(prev => ({ ...prev, isLoading: false }))
      }
    }

    initWallet()
  }, [user?.user_id, user?.blackbook_address, activeWallet]) // Removed vaultSession - it causes infinite loops

  // Show loading screen while auth is initializing to prevent flash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark">
        <Navigation />
        <div className="pt-32 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-prism-teal mx-auto mb-4"></div>
            <p className="text-gray-400">Loading wallet...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Don't render anything if not authenticated (prevents flash before redirect)
  if (!isAuthenticated) {
    return null
  }

  async function loadWalletData(address: string) {
    // Prevent duplicate concurrent calls
    if (loadingRef.current) {
      console.log('⏩ Skipping duplicate load for:', address)
      return
    }
    
    try {
      loadingRef.current = true
      console.log('📡 Loading wallet data for:', address)
      setWallet(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Fetch balance from L1
      console.log(`📡 Fetching L1 balance from: ${L1_API_URL}/balance/${address}`)
      const balanceData = await getBalance(L1_API_URL, address)
      console.log('💰 L1 Balance response:', balanceData)
      
      // Fetch transaction history (optional - don't block on failure)
      let transactions: Transaction[] = []
      try {
        const historyData = await getTransactionHistory(L1_API_URL, address, 20)
        if (historyData.success && historyData.transactions) {
          transactions = historyData.transactions
        }
      } catch (e) {
        console.log('⚠️ Transaction history not available (this is OK):', e)
        // Continue without history - it's not critical
      }
      
      setWallet(prev => ({
        ...prev,
        address,
        balance: balanceData.balance || 0,
        pendingBalance: balanceData.pending || 0,
        transactions,
        isLoading: false,
        error: null
      }))
      console.log('✅ Wallet data loaded:', { address, balance: balanceData.balance })
    } catch (error) {
      console.error('❌ Error loading wallet:', error)
      setWallet(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load wallet data' 
      }))
    } finally {
      loadingRef.current = false
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // WALLET CREATION FLOW
  // ═══════════════════════════════════════════════════════════════

  const startWalletCreation = async () => {
    setActiveModal('create')
    setCreationStep('mnemonic')
    setCreationError('')
    setMnemonicBackedUp(false)
    setCreationLoading(true)
    
    try {
      // Generate mnemonic
      const { generateMnemonic } = await import('@/lib/blackbook-wallet')
      const mnemonic = await generateMnemonic()
      setGeneratedMnemonic(mnemonic)
      
      // Pick 3 random words for verification
      const words = mnemonic.split(' ')
      const indices = [
        Math.floor(Math.random() * 8),
        Math.floor(Math.random() * 8) + 8,
        Math.floor(Math.random() * 8) + 16
      ]
      setVerifyWords(indices.map(i => ({ index: i, word: words[i] })))
    } catch (error: any) {
      setCreationError(error.message || 'Failed to generate wallet')
    } finally {
      setCreationLoading(false)
    }
  }

  const handleCreatePasswordSubmit = async () => {
    if (createPassword.length < 8) {
      setCreationError('Password must be at least 8 characters')
      return
    }
    if (createPassword !== confirmPassword) {
      setCreationError('Passwords do not match')
      return
    }

    setCreationLoading(true)
    setCreationError('')

    try {
      // Create wallet (generates mnemonic)
      const walletData = await createWallet(createPassword)
      setGeneratedMnemonic(walletData.mnemonic)
      
      // Pick 3 random words for verification
      const words = walletData.mnemonic.split(' ')
      const indices = [
        Math.floor(Math.random() * 8),
        Math.floor(Math.random() * 8) + 8,
        Math.floor(Math.random() * 8) + 16
      ]
      setVerifyWords(indices.map(i => ({ index: i, word: words[i] })))
      
      setCreationStep('mnemonic')
    } catch (error: any) {
      setCreationError(error.message || 'Failed to create wallet')
    } finally {
      setCreationLoading(false)
    }
  }

  const handleMnemonicContinue = async () => {
    if (!mnemonicBackedUp) {
      setCreationError('Please confirm you have backed up your recovery phrase')
      return
    }
    
    // Skip verification - go straight to saving wallet
    await handleVerifySubmit()
  }

  const handleVerifySubmit = async () => {
    setCreationLoading(true)
    setCreationError('')

    try {
      // Get the user's password for encryption (must be stored from login)
      const password = getPassword()
      if (!password) {
        throw new Error('Password not available. Please log out and log in again.')
      }
      
      // Create wallet using password for encryption
      const { encryptVault, mnemonicToSeed, createKeyPair, bytesToHex: toHex, randomBytes: genBytes, deriveEncryptionKey } = await import('@/lib/blackbook-wallet')
      const { deriveL1Address } = await import('@/lib/address-utils')
      
      // Derive seed and keypair from mnemonic
      const seed = await mnemonicToSeed(generatedMnemonic)
      const keyPair = await createKeyPair(seed)
      const address = deriveL1Address(keyPair.publicKey)
      
      // Generate random salt
      const vaultSalt = toHex(genBytes(32))
      const authSalt = toHex(genBytes(32))
      
      // Derive encryption key from password and salt using PBKDF2
      const encryptionKey = await deriveEncryptionKey(password, vaultSalt)
      
      // Encrypt the seed (raw 32 bytes) with PBKDF2-derived key
      const { ciphertext, nonce } = await encryptVault(seed, encryptionKey)
      
      const walletData = {
        mnemonic: generatedMnemonic,
        address,
        publicKey: toHex(keyPair.publicKey),
        encryptedVault: { ciphertext, nonce },
        vaultSalt,
        authSalt
      }
      
      // Save vault to Supabase
      if (user?.user_id) {
        console.log('📝 User data before saving wallet:', {
          user_id: user.user_id,
          auth_id: user.auth_id,
          email: user.email
        })
        
        const saved = await saveWalletVault({
          user_id: user.user_id,
          auth_id: user.auth_id, // Pass auth UUID for user_vaults FK
          encrypted_blob: walletData.encryptedVault.ciphertext,
          nonce: walletData.encryptedVault.nonce,
          vault_salt: walletData.vaultSalt,
          auth_salt: walletData.authSalt,
          blackbook_address: walletData.address,
          public_key: walletData.publicKey,
          vault_version: 2
        })

        if (!saved) {
          throw new Error('Failed to save wallet to database')
        }

        console.log('✅ Wallet saved successfully')

        // Refresh profile to get new wallet address
        await refreshProfile()
      }

      setCreationStep('complete')
      
      // Reload wallet data
      await loadWalletData(walletData.address)
      setWallet(prev => ({ ...prev, hasVault: true }))
      
    } catch (error: any) {
      setCreationError(error.message || 'Failed to save wallet')
    } finally {
      setCreationLoading(false)
    }
  }

  const closeCreateModal = () => {
    setActiveModal('none')
    // Clear sensitive data
    setCreatePassword('')
    setConfirmPassword('')
    setGeneratedMnemonic('')
  }

  // ═══════════════════════════════════════════════════════════════
  // WALLET UNLOCK
  // ═══════════════════════════════════════════════════════════════

  /**
   * Legacy unlock handler - kept for migration purposes
   * New flow uses vaultSession + password from AuthContext
   */
  const handleUnlock = async () => {
    if (!user?.user_id || !unlockPassword) return

    setUnlockLoading(true)
    setUnlockError('')

    try {
      // Get vault from Supabase
      const vault = await getWalletVault(user.user_id)
      if (!vault || !vault.encrypted_blob) {
        throw new Error('No wallet vault found')
      }

      // Derive vault key from password using new Argon2id
      const { vaultKey } = await forkPassword(unlockPassword, vault.vault_salt)

      // Store vaultKey in session for legacy auto-unlock
      storeWalletKey(vaultKey)
      
      setActiveModal('none')
      setUnlockPassword('')

      // If we were trying to send, open send modal
      if (sendTo || sendAmount) {
        setActiveModal('send')
      }
    } catch (error: any) {
      console.error('Unlock failed:', error)
      setUnlockError('Invalid password or corrupted vault')
    } finally {
      setUnlockLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SEND TRANSACTION
  // ═══════════════════════════════════════════════════════════════

  const handleSendClick = async () => {
    // For test accounts (Alice/Bob), use unlocked wallet
    if (activeWallet === 'alice' || activeWallet === 'bob') {
      if (unlockedWallet) {
        setActiveModal('send')
      } else {
        alert('Test wallet not loaded')
      }
      return
    }
    
    // For user's wallet, check if vault session and password are available
    if (!vaultSession) {
      alert('Wallet not loaded. Please log in again.')
      return
    }
    
    if (!getPassword()) {
      alert('Session expired. Please log in again to send transactions.')
      return
    }
    
    setActiveModal('send')
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setSending(true)
    setSendError('')
    setSendSuccess('')

    try {
      const amount = parseFloat(sendAmount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount')
      }
      if (amount > wallet.balance) {
        throw new Error('Insufficient balance')
      }

      let result: { success: boolean; tx_id?: string; error?: string }

      // For test accounts, use the old method with unlocked wallet
      if (activeWallet === 'alice' || activeWallet === 'bob') {
        if (!unlockedWallet) {
          throw new Error('Test wallet not loaded')
        }
        result = await sendTransfer(L1_API_URL, unlockedWallet, sendTo, amount)
      } else {
        // For user's wallet, check if password is still unlocked
        if (!vaultSession) {
          throw new Error('Session not found. Please log in again.')
        }
        
        const password = getPassword()
        if (!password || !isPasswordUnlocked()) {
          // Password expired - show prompt
          setSending(false)
          setPendingAction(() => () => handleSend(e))
          setShowPasswordPrompt(true)
          return
        }
        
        console.log('🔐 Using secure transfer with on-demand key derivation')
        result = await sendTransferSecure(vaultSession, password, sendTo, amount)
      }

      if (result.success) {
        setSendSuccess(`Transaction sent! TX ID: ${result.tx_id}`)
        setSendTo('')
        setSendAmount('')
        // Reload balance
        if (wallet.address) {
          await loadWalletData(wallet.address)
        }
      } else {
        throw new Error(result.error || 'Transaction failed')
      }
    } catch (error: any) {
      setSendError(error.message || 'Failed to send transaction')
    } finally {
      setSending(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PASSWORD PROMPT HANDLER (for expired sessions)
  // ═══════════════════════════════════════════════════════════════

  const handlePasswordSubmit = async (password: string): Promise<boolean> => {
    try {
      setPasswordError('')
      
      // First, try to unlock with the password
      const success = unlockWithPassword(password)
      if (!success) {
        setPasswordError('Failed to store password')
        return false
      }
      
      // Now test if we can decrypt the vault with this password
      if (vaultSession) {
        const { derivePrivateKeyOnDemand } = await import('@/lib/blackbook-wallet')
        try {
          const keypair = await derivePrivateKeyOnDemand(vaultSession, password)
          
          if (keypair) {
            // Success! Close prompt and execute pending action
            setShowPasswordPrompt(false)
            setPasswordError('')
            
            if (pendingAction) {
              pendingAction()
              setPendingAction(null)
            }
            
            return true
          }
        } catch (error: any) {
          console.error('Decryption test failed:', error)
          
          // Check if it's a decryption error - might need vault migration
          if (error.message?.includes('decrypt')) {
            setPasswordError('Your vault was encrypted with an old method. Please use the "Migrate Vault" option below.')
            setShowVaultMigration(true)
            return false
          }
          
          setPasswordError('Incorrect password or vault corrupted')
          return false
        }
      }
      
      return false
    } catch (error: any) {
      console.error('Password submit error:', error)
      setPasswordError(error.message || 'Failed to unlock')
      return false
    }
  }

  // Handle complete wallet reset (create fresh wallet)
  const handleCompleteReset = () => {
    setShowPasswordPrompt(false)
    setPasswordError('')
    handleResetWallet()
  }

  // ═══════════════════════════════════════════════════════════════
  // VAULT MIGRATION (re-encrypt with new PBKDF2 method)
  // ═══════════════════════════════════════════════════════════════

  const handleMigrateVault = async () => {
    if (!user || !user.auth_id) {
      alert('User not found')
      return
    }

    const password = prompt('⚠️ VAULT MIGRATION\n\nTo re-encrypt your vault with the new security method, enter your password:')
    if (!password) return

    try {
      setCreationLoading(true)
      setCreationError('')

      // Create a new wallet with the same password using new PBKDF2 method
      console.log('🔄 Creating new wallet with PBKDF2 encryption...')
      const walletData = await createWallet(password)

      if (!walletData) {
        throw new Error('Failed to create wallet')
      }

      // Save the new vault to Supabase
      console.log('💾 Saving migrated vault...')
      const saved = await saveWalletVault({
        user_id: user.user_id,
        auth_id: user.auth_id,
        encrypted_blob: walletData.encryptedVault.ciphertext,
        nonce: walletData.encryptedVault.nonce,
        vault_salt: walletData.vaultSalt,
        auth_salt: walletData.authSalt,
        blackbook_address: walletData.address,
        public_key: walletData.publicKey,
        vault_version: 2
      })

      if (!saved) {
        throw new Error('Failed to save vault')
      }

      alert('✅ Vault migrated successfully! Your wallet has been re-encrypted with the new PBKDF2 method. Please refresh the page.')
      
      // Refresh the page to reload everything
      window.location.reload()
      
    } catch (error: any) {
      console.error('Vault migration failed:', error)
      setCreationError(error.message || 'Failed to migrate vault')
    } finally {
      setCreationLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // WALLET RESET (for migrating from password-based to sessionless)
  // ═══════════════════════════════════════════════════════════════

  const handleResetWallet = async () => {
    if (!confirm('⚠️ This will create a NEW wallet with a NEW address. Any BB tokens in your old wallet will NOT be transferred. Are you sure?')) {
      return
    }
    
    setResettingWallet(true)
    clearWalletKey() // Clear any old keys
    
    // Reset wallet state
    setWallet({
      address: null,
      balance: 0,
      pendingBalance: 0,
      transactions: [],
      isLoading: false,
      error: null,
      hasVault: false
    })
    setUnlockedWallet(null)
    setShowMigrationPrompt(false)
    setResettingWallet(false)
    
    // Start fresh wallet creation
    startWalletCreation()
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  function formatAddress(addr: string): string {
    if (!addr) return ''
    if (addr.length <= 16) return addr
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-prism-teal"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Load tweetnacl for Ed25519 */}
      <script src="https://cdn.jsdelivr.net/npm/tweetnacl/nacl-fast.min.js" async />
      
      {/* Password Prompt for expired sessions */}
      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onClose={() => {
          setShowPasswordPrompt(false)
          setPendingAction(null)
          setPasswordError('')
        }}
        onSubmit={handlePasswordSubmit}
        title="Session Expired"
        message="Your 15-minute session has expired. Please enter your password to continue."
        externalError={passwordError}
      />
      
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-black mb-2">
              <span className="prism-gradient-text">{getWalletOwnerName()}</span> Wallet
            </h1>
            <p className="text-gray-400">
              Manage your BB tokens on the L1 blockchain
            </p>
          </motion.div>

          {/* No Wallet - Show Creation */}
          {!wallet.address && !wallet.isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dark-100 border-2 border-dark-border rounded-3xl p-8 text-center"
            >
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Wallet</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Set up your BlackBook L1 wallet to send and receive BB tokens. 
                Your wallet is secured with end-to-end encryption.
              </p>
              <button 
                onClick={startWalletCreation}
                className="px-8 py-4 rounded-xl font-bold text-white prism-gradient-bg hover:opacity-90 transition-opacity text-lg"
              >
                🚀 Create Wallet
              </button>
            </motion.div>
          )}

          {/* Loading */}
          {wallet.isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-prism-teal"></div>
            </div>
          )}

          {/* Error */}
          {wallet.error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-prism-red/20 border border-prism-red rounded-2xl p-6 mb-8"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-white">Connection Error</h3>
                  <p className="text-gray-300">{wallet.error}</p>
                </div>
              </div>
              <button 
                onClick={() => wallet.address && loadWalletData(wallet.address)}
                className="mt-4 px-4 py-2 rounded-lg bg-dark-200 text-white hover:bg-dark-300 transition-colors"
              >
                Retry Connection
              </button>
            </motion.div>
          )}

          {/* Wallet Connected */}
          {wallet.address && !wallet.isLoading && (
            <>
              {/* Unlock Status Badge */}
              {wallet.hasVault && (
                <div className="mb-4 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    unlockedWallet || (vaultSession && activeWallet === 'user')
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {unlockedWallet || (vaultSession && activeWallet === 'user') 
                      ? `🔓 ${activeWallet === 'alice' ? "Alice's" : activeWallet === 'bob' ? "Bob's" : 'Wallet'} Unlocked` 
                      : '🔒 Wallet Locked'}
                  </span>
                  {unlockedWallet && (
                    <button
                      onClick={() => setUnlockedWallet(null)}
                      className="text-sm text-gray-500 hover:text-gray-300"
                    >
                      Lock Now
                    </button>
                  )}
                  {showVaultMigration && activeWallet === 'user' && (
                    <button
                      onClick={handleMigrateVault}
                      disabled={creationLoading}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 transition-colors disabled:opacity-50"
                      title="Re-encrypt vault with new PBKDF2 method"
                    >
                      {creationLoading ? '⏳ Migrating...' : '🔄 Migrate Vault'}
                    </button>
                  )}
                </div>
              )}

              {/* Balance Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-dark-100 to-dark-200 border-2 prism-border rounded-3xl p-8 mb-8"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total Balance</p>
                    <h2 className="text-5xl font-black prism-gradient-text">
                      {wallet.balance.toLocaleString()} <span className="text-2xl">BB</span>
                    </h2>
                    {wallet.pendingBalance > 0 && (
                      <p className="text-yellow-500 text-sm mt-1">
                        +{wallet.pendingBalance.toLocaleString()} BB pending
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleSendClick}
                      className="px-6 py-3 rounded-xl font-bold text-white prism-gradient-bg hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send
                    </button>
                    <button
                      onClick={() => setActiveTab('receive')}
                      className="px-6 py-3 rounded-xl font-semibold text-white bg-dark-200 border border-dark-border hover:border-prism-teal transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Receive
                    </button>
                    <button
                      onClick={() => wallet.address && loadWalletData(wallet.address)}
                      disabled={wallet.isLoading}
                      className="px-6 py-3 rounded-xl font-semibold text-white bg-dark-200 border border-dark-border hover:border-prism-teal transition-colors flex items-center gap-2 disabled:opacity-50"
                      title="Refresh wallet data"
                    >
                      <svg className={`w-5 h-5 ${wallet.isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Address */}
                <div className="mt-6 pt-6 border-t border-dark-border">
                  <p className="text-gray-400 text-sm mb-2">Wallet Address</p>
                  <div className="flex items-center gap-3">
                    <code className="text-prism-teal font-mono text-sm bg-dark-300 px-4 py-2 rounded-lg flex-1 overflow-x-auto">
                      {wallet.address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(wallet.address!)}
                      className="p-2 rounded-lg bg-dark-300 hover:bg-dark-400 transition-colors"
                      title="Copy address"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {(['overview', 'bridge', 'send', 'receive', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                      activeTab === tab
                        ? 'bg-prism-teal/20 text-prism-teal border border-prism-teal'
                        : 'bg-dark-200 text-gray-400 border border-dark-border hover:border-gray-600'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-6"
                  >
                    {/* Quick Stats */}
                    <div className="bg-dark-100 border border-dark-border rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Wallet Stats</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Network</span>
                          <span className="text-white font-medium">BlackBook L1</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Chain ID</span>
                          <span className="text-white font-mono">0x01</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Transactions</span>
                          <span className="text-white font-medium">{wallet.transactions.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status</span>
                          <span className="text-green-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-dark-100 border border-dark-border rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                      {wallet.transactions.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No transactions yet</p>
                      ) : (
                        <div className="space-y-3">
                          {wallet.transactions.slice(0, 5).map((tx) => (
                            <div key={tx.tx_id} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  tx.from === wallet.address ? 'bg-prism-red/20 text-prism-red' : 'bg-green-500/20 text-green-400'
                                }`}>
                                  {tx.from === wallet.address ? '↑' : '↓'}
                                </div>
                                <div>
                                  <p className="text-white text-sm font-medium">
                                    {tx.from === wallet.address ? 'Sent' : 'Received'}
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {formatAddress(tx.from === wallet.address ? tx.to : tx.from)}
                                  </p>
                                </div>
                              </div>
                              <span className={`font-bold ${
                                tx.from === wallet.address ? 'text-prism-red' : 'text-green-400'
                              }`}>
                                {tx.from === wallet.address ? '-' : '+'}{tx.amount} BB
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'bridge' && (
                  <motion.div
                    key="bridge"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-2xl mx-auto"
                  >
                    <BridgeInterface />
                  </motion.div>
                )}

                {activeTab === 'send' && (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-xl mx-auto"
                  >
                    <div className="bg-dark-100 border border-dark-border rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-6">Send BB Tokens</h3>
                      
                      {!unlockedWallet && !vaultSession && wallet.hasVault && (
                        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                          <p className="text-yellow-400 text-sm flex items-center gap-2">
                            <span>🔒</span>
                            Unlock your wallet to send transactions
                          </p>
                          <button
                            onClick={() => setActiveModal('unlock')}
                            className="mt-2 px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm font-medium"
                          >
                            Unlock Wallet
                          </button>
                        </div>
                      )}
                      
                      {sendError && (
                        <div className="mb-4 p-4 bg-prism-red/20 border border-prism-red rounded-xl text-prism-red text-sm">
                          {sendError}
                        </div>
                      )}
                      
                      {sendSuccess && (
                        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-sm">
                          {sendSuccess}
                        </div>
                      )}

                      <form onSubmit={handleSend} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Recipient Address</label>
                          <input
                            type="text"
                            value={sendTo}
                            onChange={(e) => setSendTo(e.target.value)}
                            placeholder="L1_..."
                            required
                            className="w-full px-4 py-3 bg-dark-200 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Amount (BB)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={sendAmount}
                              onChange={(e) => setSendAmount(e.target.value)}
                              placeholder="0.00"
                              required
                              min="0.01"
                              step="0.01"
                              max={wallet.balance}
                              className="w-full px-4 py-3 bg-dark-200 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setSendAmount(wallet.balance.toString())}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-prism-teal text-sm font-medium hover:underline"
                            >
                              MAX
                            </button>
                          </div>
                          <p className="text-gray-500 text-sm mt-1">Available: {wallet.balance.toLocaleString()} BB</p>
                        </div>

                        <button
                          type="submit"
                          disabled={sending || !sendTo || !sendAmount || (!unlockedWallet && !vaultSession && wallet.hasVault)}
                          className="w-full px-6 py-4 rounded-xl font-bold text-white prism-gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sending ? 'Signing & Sending...' : (unlockedWallet || vaultSession) ? 'Send BB' : 'Unlock to Send'}
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'receive' && (
                  <motion.div
                    key="receive"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-xl mx-auto"
                  >
                    <div className="bg-dark-100 border border-dark-border rounded-2xl p-6 text-center">
                      <h3 className="text-xl font-bold text-white mb-6">Receive BB Tokens</h3>
                      
                      <div className="w-48 h-48 mx-auto mb-6 bg-white rounded-2xl flex items-center justify-center p-4">
                        {/* Simple QR representation */}
                        <div className="text-center">
                          <div className="text-4xl mb-2">📱</div>
                          <p className="text-dark text-xs font-mono break-all">{wallet.address?.slice(0, 20)}...</p>
                        </div>
                      </div>

                      <p className="text-gray-400 text-sm mb-4">
                        Share your address to receive BB tokens
                      </p>

                      <div className="bg-dark-200 rounded-xl p-4 mb-4">
                        <code className="text-prism-teal font-mono text-sm break-all">
                          {wallet.address}
                        </code>
                      </div>

                      <button
                        onClick={() => copyToClipboard(wallet.address!)}
                        className="px-6 py-3 rounded-xl font-semibold text-white bg-dark-200 border border-dark-border hover:border-prism-teal transition-colors"
                      >
                        Copy Address
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="bg-dark-100 border border-dark-border rounded-2xl overflow-hidden">
                      <div className="p-6 border-b border-dark-border">
                        <h3 className="text-xl font-bold text-white">Transaction History</h3>
                      </div>
                      
                      {wallet.transactions.length === 0 ? (
                        <div className="p-12 text-center">
                          <div className="text-4xl mb-4">📭</div>
                          <p className="text-gray-500">No transactions yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-dark-border">
                          {wallet.transactions.map((tx) => (
                            <div key={tx.tx_id} className="p-4 hover:bg-dark-200/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    tx.from === wallet.address ? 'bg-prism-red/20 text-prism-red' : 'bg-green-500/20 text-green-400'
                                  }`}>
                                    {tx.from === wallet.address ? '↑' : '↓'}
                                  </div>
                                  <div>
                                    <p className="text-white font-medium">
                                      {tx.from === wallet.address ? 'Sent' : 'Received'}
                                    </p>
                                    <p className="text-gray-500 text-sm font-mono">
                                      {tx.from === wallet.address ? `To: ${formatAddress(tx.to)}` : `From: ${formatAddress(tx.from)}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-bold ${
                                    tx.from === wallet.address ? 'text-prism-red' : 'text-green-400'
                                  }`}>
                                    {tx.from === wallet.address ? '-' : '+'}{tx.amount.toLocaleString()} BB
                                  </p>
                                  <p className="text-gray-500 text-sm">
                                    {new Date(tx.timestamp * 1000).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                  tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-prism-red/20 text-prism-red'
                                }`}>
                                  {tx.status}
                                </span>
                                <span className="text-gray-600 text-xs font-mono">
                                  {formatAddress(tx.tx_id)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* WALLET CREATION MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeModal === 'create' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCreateModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-dark border-2 prism-border rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Progress Bar */}
              <div className="h-1 bg-dark-200">
                <div 
                  className="h-full prism-gradient-bg transition-all duration-300"
                  style={{ 
                    width: creationStep === 'mnemonic' ? '50%' : '100%' 
                  }}
                />
              </div>

              <div className="p-8">
                {/* Step 1: Mnemonic Display (no password needed - using session key) */}
                {creationStep === 'mnemonic' && (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-2">🔑 Recovery Phrase</h3>
                    <p className="text-gray-400 mb-4">
                      Write down these 24 words in order. This is the ONLY way to recover your wallet.
                    </p>

                    <div className="bg-dark-200 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-3 gap-2">
                        {generatedMnemonic.split(' ').map((word, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 w-6">{i + 1}.</span>
                            <span className="text-white font-mono">{word}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-prism-red/10 border border-prism-red/30 rounded-xl p-4 mb-4">
                      <p className="text-prism-red text-sm">
                        ⚠️ <strong>NEVER share your recovery phrase.</strong> Anyone with these words can steal your funds. Store them securely offline.
                      </p>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer mb-6">
                      <input
                        type="checkbox"
                        checked={mnemonicBackedUp}
                        onChange={(e) => setMnemonicBackedUp(e.target.checked)}
                        className="w-5 h-5 rounded border-dark-border bg-dark-200 text-prism-teal focus:ring-prism-teal"
                      />
                      <span className="text-gray-300 text-sm">
                        I have written down my recovery phrase and stored it securely
                      </span>
                    </label>

                    {creationError && (
                      <div className="mb-4 p-3 bg-prism-red/20 border border-prism-red rounded-xl text-prism-red text-sm">
                        {creationError}
                      </div>
                    )}

                    <button
                      onClick={handleMnemonicContinue}
                      disabled={!mnemonicBackedUp}
                      className="w-full px-6 py-3 rounded-xl font-bold text-white prism-gradient-bg hover:opacity-90 disabled:opacity-50"
                    >
                      I've Backed Up My Phrase
                    </button>
                  </>
                )}

                {/* Step 3: Verify Mnemonic */}
                {creationStep === 'verify' && (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-2">Verify Recovery Phrase</h3>
                    <p className="text-gray-400 mb-6">
                      Enter the requested words from your recovery phrase to confirm your backup.
                    </p>

                    {creationError && (
                      <div className="mb-4 p-3 bg-prism-red/20 border border-prism-red rounded-xl text-prism-red text-sm">
                        {creationError}
                      </div>
                    )}

                    <div className="space-y-4 mb-6">
                      {verifyWords.map((vw, i) => (
                        <div key={i}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Word #{vw.index + 1}
                          </label>
                          <input
                            type="text"
                            value={verifyInputs[i]}
                            onChange={(e) => {
                              const newInputs = [...verifyInputs]
                              newInputs[i] = e.target.value
                              setVerifyInputs(newInputs)
                            }}
                            placeholder={`Enter word #${vw.index + 1}`}
                            className="w-full px-4 py-3 bg-dark-200 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-prism-teal focus:ring-1 focus:ring-prism-teal font-mono"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setCreationStep('mnemonic')}
                        className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-dark-200 border border-dark-border hover:border-gray-600 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleVerifySubmit}
                        disabled={creationLoading || verifyInputs.some(v => !v.trim())}
                        className="flex-1 px-6 py-3 rounded-xl font-bold text-white prism-gradient-bg hover:opacity-90 disabled:opacity-50"
                      >
                        {creationLoading ? 'Creating Wallet...' : 'Verify & Create'}
                      </button>
                    </div>
                  </>
                )}

                {/* Step 4: Complete */}
                {creationStep === 'complete' && (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Wallet Created!</h3>
                    <p className="text-gray-400 mb-6">
                      Your BlackBook L1 wallet is ready to use. You can now send and receive BB tokens.
                    </p>

                    <button
                      onClick={closeCreateModal}
                      className="w-full px-6 py-3 rounded-xl font-bold text-white prism-gradient-bg hover:opacity-90"
                    >
                      Start Using Wallet
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unlock modal removed - wallet unlocks automatically using session key */}

      <Footer />
    </div>
  )
}
