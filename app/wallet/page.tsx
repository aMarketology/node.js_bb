'use client'

import { useState } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useWallet } from '@/app/contexts/UnifiedWalletContext'
import { useFanCredit } from '@/app/contexts/FanCreditContext'
import { useRouter } from 'next/navigation'
import Navigation from '@/app/components/Navigation'
import Footer from '@/app/components/Footer'

export default function WalletPage() {
  const { user, isAuthenticated, activeWallet, activeWalletData, switchWallet, loading: authLoading } = useAuth()
  const { l1Balance, l2Balance, transactions, transferL1, withdrawToL1, bridgeToL2, mintTokens, loading: walletLoading } = useWallet()
  const { balance: fcBalance, transactions: fcTransactions, loading: fcLoading, formatFC } = useFanCredit()
  const router = useRouter()

  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bridgeAmount, setBridgeAmount] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [message, setMessage] = useState('')

  // Show loading while auth is initializing
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

  if (!isAuthenticated) {
    router.push('/')
    return null
  }

  const walletName = activeWallet === 'alice' ? 'Alice' : activeWallet === 'bob' ? 'Bob' : activeWallet === 'mac' ? 'Mac' : 'User'
  const l1Address = activeWalletData?.l1Address || ''
  const l2Address = activeWalletData?.l2Address || ''

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      setMessage('Invalid amount')
      return
    }

    setMessage('Processing withdrawal...')
    const result = await withdrawToL1(amount)
    setMessage(result.message)
    if (result.success) {
      setWithdrawAmount('')
    }
  }

  const handleBridge = async () => {
    const amount = parseFloat(bridgeAmount)
    if (isNaN(amount) || amount <= 0) {
      setMessage('Invalid amount')
      return
    }

    setMessage('Processing bridge...')
    const result = await bridgeToL2(amount)
    setMessage(result.message)
    if (result.success) {
      setBridgeAmount('')
    }
  }

  const handleMint = async () => {
    const amount = parseFloat(mintAmount)
    if (isNaN(amount) || amount <= 0) {
      setMessage('Invalid amount')
      return
    }

    setMessage('Minting tokens...')
    const result = await mintTokens(amount)
    setMessage(result.message)
    if (result.success) {
      setMintAmount('')
    }
  }

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount)
    if (isNaN(amount) || amount <= 0) {
      setMessage('Invalid amount')
      return
    }
    if (!transferTo || !transferTo.startsWith('L1_')) {
      setMessage('Invalid L1 address')
      return
    }

    setMessage('Sending transfer...')
    const result = await transferL1(transferTo, amount)
    setMessage(result.message)
    if (result.success) {
      setTransferTo('')
      setTransferAmount('')
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatTxId = (txId: string) => {
    return txId.length > 16 ? `${txId.slice(0, 8)}...${txId.slice(-8)}` : txId
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">{walletName} Wallet</h1>

          {/* Balances */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-dark-lighter p-6 rounded-lg border border-gray-800">
              <h3 className="text-gray-400 text-sm mb-2">L1 Balance</h3>
              <p className="text-3xl font-bold text-white">{l1Balance.available.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">Available</p>
              {l1Balance.locked > 0 && (
                <p className="text-sm text-gray-500">Locked: {l1Balance.locked.toFixed(2)}</p>
              )}
              <p className="text-xs text-gray-600 mt-2 font-mono break-all">{l1Address}</p>
            </div>

            <div className="bg-dark-lighter p-6 rounded-lg border border-gray-800">
              <h3 className="text-gray-400 text-sm mb-2">L2 Balance (BB)</h3>
              <p className="text-3xl font-bold text-prism-teal">{l2Balance.available.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">Available</p>
              {l2Balance.locked > 0 && (
                <p className="text-sm text-gray-500">Locked: {l2Balance.locked.toFixed(2)}</p>
              )}
              <p className="text-xs text-gray-600 mt-2 font-mono break-all">{l2Address}</p>
            </div>

            <div className="bg-dark-lighter p-6 rounded-lg border border-gray-800">
              <h3 className="text-gray-400 text-sm mb-2">FanCredit (FC)</h3>
              {fcLoading ? (
                <p className="text-2xl text-gray-400">Loading...</p>
              ) : fcBalance ? (
                <>
                  <p className="text-3xl font-bold text-purple-400">{formatFC(fcBalance.available)}</p>
                  <p className="text-sm text-gray-500 mt-1">Available</p>
                  {fcBalance.locked > 0 && (
                    <p className="text-sm text-gray-500">Locked: {formatFC(fcBalance.locked)}</p>
                  )}
                </>
              ) : (
                <p className="text-2xl text-gray-400">0 FC</p>
              )}
              <p className="text-xs text-purple-400 mt-2">Entertainment Only</p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Bridge L1 → L2 */}
            <div className="bg-dark-lighter p-6 rounded-lg border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Bridge L1 → L2</h3>
              <input
                type="number"
                value={bridgeAmount}
                onChange={(e) => setBridgeAmount(e.target.value)}
                placeholder="Amount"
                className="w-full bg-dark border border-gray-700 rounded px-4 py-2 text-white mb-3"
                disabled={walletLoading}
              />
              <button
                onClick={handleBridge}
                disabled={walletLoading || !bridgeAmount}
                className="w-full bg-prism-teal hover:bg-prism-teal/80 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 rounded transition"
              >
                {walletLoading ? 'Processing...' : 'Bridge to L2'}
              </button>
            </div>

            {/* Withdraw L2 → L1 */}
            <div className="bg-dark-lighter p-6 rounded-lg border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Withdraw L2 → L1</h3>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount"
                className="w-full bg-dark border border-gray-700 rounded px-4 py-2 text-white mb-3"
                disabled={walletLoading}
              />
              <button
                onClick={handleWithdraw}
                disabled={walletLoading || !withdrawAmount}
                className="w-full bg-prism-purple hover:bg-prism-purple/80 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 rounded transition"
              >
                {walletLoading ? 'Processing...' : 'Withdraw to L1'}
              </button>
            </div>
          </div>

          {/* Mint Tokens (Admin) */}
          <div className="bg-dark-lighter p-6 rounded-lg border border-gray-800 mb-8">
            <h3 className="text-white font-semibold mb-4">💰 Mint Tokens (Admin)</h3>
            <div className="flex gap-3">
              <input
                type="number"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                placeholder="Amount"
                className="flex-1 bg-dark border border-gray-700 rounded px-4 py-2 text-white"
                disabled={walletLoading}
              />
              <button
                onClick={handleMint}
                disabled={walletLoading || !mintAmount}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded transition"
              >
                {walletLoading ? 'Minting...' : 'Mint'}
              </button>
            </div>
          </div>

          {/* Transfer L1 → L1 */}
          <div className="bg-dark-lighter p-6 rounded-lg border border-gray-800 mb-8">
            <h3 className="text-white font-semibold mb-4">💸 Send Transfer (L1)</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="Recipient address (L1_...)"
                className="w-full bg-dark border border-gray-700 rounded px-4 py-2 text-white"
                disabled={walletLoading}
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 bg-dark border border-gray-700 rounded px-4 py-2 text-white"
                  disabled={walletLoading}
                />
                <button
                  onClick={handleTransfer}
                  disabled={walletLoading || !transferAmount || !transferTo}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded transition"
                >
                  {walletLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.includes('success') ? 'bg-green-900/20 border border-green-700 text-green-300' : 'bg-gray-800 border border-gray-700 text-gray-300'}`}>
              {message}
            </div>
          )}

          {/* Transaction History */}
          <div className="bg-dark-lighter p-6 rounded-lg border border-gray-800 mb-8">
            <h3 className="text-white font-semibold mb-4">Recent Transactions (BB)</h3>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx, index) => (
                  <div key={tx.tx_id || index} className="bg-dark p-4 rounded border border-gray-800 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-gray-400">{formatTxId(tx.tx_id)}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          tx.status === 'confirmed' ? 'bg-green-900/30 text-green-400' : 
                          tx.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' : 
                          'bg-red-900/30 text-red-400'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {tx.type} • {formatTimestamp(tx.timestamp)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${tx.to === l1Address ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.to === l1Address ? '+' : '-'}{tx.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tx.from === l1Address ? 'Sent' : 'Received'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FanCredit Transaction History */}
          {fcTransactions && fcTransactions.length > 0 && (
            <div className="bg-dark-lighter p-6 rounded-lg border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Recent FanCredit Transactions</h3>
              <div className="space-y-3">
                {fcTransactions.map((tx, index) => (
                  <div key={tx.id || index} className="bg-dark p-4 rounded border border-gray-800 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-purple-400">{formatTxId(tx.id)}</span>
                        <span className="text-xs px-2 py-1 rounded bg-purple-900/30 text-purple-400">
                          FC
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {tx.description} • {formatTimestamp(tx.timestamp)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${tx.to === l2Address ? 'text-green-400' : 'text-purple-400'}`}>
                        {tx.to === l2Address ? '+' : ''}{formatFC(tx.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tx.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
