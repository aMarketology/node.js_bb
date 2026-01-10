/**
 * BlackBook Test Accounts
 * Real wallets with actual L1/L2 balances for development testing
 * 
 * ⚠️ PRIVATE KEYS EXPOSED - For development/testing ONLY
 * These accounts have real balances on the BlackBook blockchain
 */

const L1_API = process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080'
const L2_API = process.env.NEXT_PUBLIC_L2_API_URL || 'http://localhost:1234'

/**
 * Test wallet credentials
 * Generated using BIP-39 + SLIP-0010 derivation at m/44'/1337'/0'/0'/0'
 */
export const TEST_ACCOUNTS = {
  alice: {
    name: 'Alice',
    username: 'alice_test',
    email: 'alice@blackbook.test',
    
    // BIP-39 Mnemonic (12 words)
    mnemonic: 'machine sword cause scrub simple damage program together spoon lock ball banana',
    
    // Ed25519 Keys
    publicKey: 'c0e349153cbc75e9529b5f1963205cab783463c6835c826a7587e0e0903c6705',
    privateKey: '18f2c2e3bcb7a4b5329cfed4bd79bf17df4d47aa1888a6b3d1a1450fb53a8a24',
    
    // Blockchain Addresses (160-bit)
    l1Address: 'L1_BF1565F0D56ED917FDF8263CCCB020706F5FB5DD',
    l2Address: 'L2_BF1565F0D56ED917FDF8263CCCB020706F5FB5DD',
    
    // Derivation
    derivationPath: "m/44'/1337'/0'/0'/0'",
    
    // Capabilities
    capabilities: [
      'Sign transactions (Ed25519)',
      'L1 transfers',
      'Bridge L1 → L2',
      'Place bets on L2',
      'Withdraw L2 → L1',
      'Social mining',
    ],
  },
  
  bob: {
    name: 'Bob',
    username: 'bob_test',
    email: 'bob@blackbook.test',
    
    // BIP-39 Mnemonic (12 words)
    mnemonic: 'base echo grape penalty hawk resemble obscure unusual throw paddle carpet elder',
    
    // Ed25519 Keys
    publicKey: '582420216093fcff65b0eec2ca2c8227dfc2b6b7428110f36c3fc1349c4b2f5a',
    privateKey: 'e4ac49e5a04ef7dfc6e1a838fdf14597f2d514d0029a82cb45c916293487c25b',
    
    // Blockchain Addresses (160-bit)
    l1Address: 'L1_AE1CA8E0144C2D8DCFAC3748B36AE166D52F71D9',
    l2Address: 'L2_AE1CA8E0144C2D8DCFAC3748B36AE166D52F71D9',
    
    // Derivation
    derivationPath: "m/44'/1337'/0'/0'/0'",
    
    // Capabilities
    capabilities: [
      'Sign transactions (Ed25519)',
      'L1 transfers',
      'Bridge L1 → L2',
      'Place bets on L2',
      'Withdraw L2 → L1',
      'Social mining',
    ],
  },
}

/**
 * Get L1 balance for an account
 * @param {string} address - L1 address (e.g., 'L1_BF1565F0D56ED917FDF8263CCCB020706F5FB5DD')
 * @returns {Promise<{available: string, locked: string, total: string}>}
 */
export async function getL1Balance(address) {
  try {
    const response = await fetch(`${L1_API}/balance/${address}`)
    if (!response.ok) {
      throw new Error(`L1 API returned ${response.status}`)
    }
    const data = await response.json()
    return {
      available: data.available || '0',
      locked: data.locked || '0',
      total: (BigInt(data.available || 0) + BigInt(data.locked || 0)).toString(),
    }
  } catch (error) {
    console.error(`Failed to fetch L1 balance for ${address}:`, error.message)
    return { available: '0', locked: '0', total: '0' }
  }
}

/**
 * Get L2 balance for an account
 * @param {string} address - L2 address (e.g., 'L2_BF1565F0D56ED917FDF8263CCCB020706F5FB5DD')
 * @returns {Promise<{balance: string}>}
 */
export async function getL2Balance(address) {
  try {
    const response = await fetch(`${L2_API}/balance/${address}`)
    if (!response.ok) {
      throw new Error(`L2 API returned ${response.status}`)
    }
    const data = await response.json()
    return {
      balance: data.balance || '0',
    }
  } catch (error) {
    console.error(`Failed to fetch L2 balance for ${address}:`, error.message)
    return { balance: '0' }
  }
}

/**
 * Get complete account info with live balances
 * @param {'alice' | 'bob'} accountName
 * @returns {Promise<Object>}
 */
export async function getAccountWithBalances(accountName) {
  const account = TEST_ACCOUNTS[accountName]
  if (!account) {
    throw new Error(`Unknown account: ${accountName}`)
  }
  
  const [l1Balance, l2Balance] = await Promise.all([
    getL1Balance(account.l1Address),
    getL2Balance(account.l2Address),
  ])
  
  return {
    ...account,
    balances: {
      l1: l1Balance,
      l2: l2Balance,
    },
  }
}

/**
 * Sign a transaction using test account credentials
 * @param {'alice' | 'bob'} accountName
 * @param {Object} transaction - Transaction data to sign
 * @returns {Promise<string>} Signature
 */
export async function signTransaction(accountName, transaction) {
  const account = TEST_ACCOUNTS[accountName]
  if (!account) {
    throw new Error(`Unknown account: ${accountName}`)
  }
  
  // Import BlackBook SDK signing function
  const { signTransfer } = await import('@/lib/blackbook-wallet')
  
  return signTransfer(transaction, account.privateKey)
}

/**
 * Get test account by address (L1 or L2)
 * @param {string} address - Blockchain address
 * @returns {Object|null}
 */
export function getAccountByAddress(address) {
  for (const [name, account] of Object.entries(TEST_ACCOUNTS)) {
    if (account.l1Address === address || account.l2Address === address) {
      return { name, ...account }
    }
  }
  return null
}

/**
 * Check if an address belongs to a test account
 * @param {string} address - Blockchain address
 * @returns {boolean}
 */
export function isTestAccount(address) {
  return getAccountByAddress(address) !== null
}

/**
 * Format balance for display
 * @param {string} balance - Balance in smallest unit
 * @returns {string} Formatted balance with commas
 */
export function formatBalance(balance) {
  return parseInt(balance).toLocaleString('en-US')
}

/**
 * Print account summary to console
 * @param {'alice' | 'bob'} accountName
 */
export async function printAccountSummary(accountName) {
  const account = await getAccountWithBalances(accountName)
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`👤 ${account.name.toUpperCase()}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`Email:        ${account.email}`)
  console.log(`L1 Address:   ${account.l1Address}`)
  console.log(`L2 Address:   ${account.l2Address}`)
  console.log(`\nBalances:`)
  console.log(`  L1 Available: ${formatBalance(account.balances.l1.available)} BB`)
  console.log(`  L1 Locked:    ${formatBalance(account.balances.l1.locked)} BB`)
  console.log(`  L2 Balance:   ${formatBalance(account.balances.l2.balance)} BB`)
  console.log(`  Total:        ${formatBalance(account.balances.l1.total)} BB`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

/**
 * Print all test accounts
 */
export async function printAllAccounts() {
  console.log('\n🧪 BLACKBOOK TEST ACCOUNTS')
  console.log('⚠️  These are real wallets with actual balances\n')
  
  await printAccountSummary('alice')
  await printAccountSummary('bob')
  
  console.log('💡 Use these accounts for testing predictions and transfers')
  console.log('📝 Import with: import { TEST_ACCOUNTS } from "@/lib/test-accounts"\n')
}

// Export individual accounts for convenience
export const ALICE = TEST_ACCOUNTS.alice
export const BOB = TEST_ACCOUNTS.bob

// Export addresses for quick access
export const ALICE_L1 = TEST_ACCOUNTS.alice.l1Address
export const ALICE_L2 = TEST_ACCOUNTS.alice.l2Address
export const BOB_L1 = TEST_ACCOUNTS.bob.l1Address
export const BOB_L2 = TEST_ACCOUNTS.bob.l2Address

export default TEST_ACCOUNTS
