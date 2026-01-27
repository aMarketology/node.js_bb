/**
 * TEST: Rain Contest Settlement
 * 
 * This script tests the PRISM settlement system with:
 * - Alice (picks YES - it WILL rain)
 * - Bob (picks NO - it will NOT rain)
 * 
 * The mock oracle says "YES" (it rained), so Alice should win!
 * 
 * Prerequisites:
 * 1. Run scripts/seed-prism-contests.sql in Supabase (creates prism tables)
 * 2. Run scripts/setup-test-profiles.sql in Supabase (creates Alice & Bob profiles)
 * 3. Run scripts/test-rain-contest.sql in Supabase (creates test contest)
 * 
 * Then run this script: node scripts/test-rain-settlement.js
 */

const SETTLEMENT_API = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/prism/settle`
  : 'http://localhost:3001/api/prism/settle'

// The contest ID we set in test-rain-contest.sql
const CONTEST_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

// Admin key from .env (DEALER_PRIVATE_KEY)
const ADMIN_KEY = 'e5284bcb4d8fb72a8969d48a888512b1f42fe5c57d1ae5119a09785ba13654ae'

async function testSettlement() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('🧪 PRISM Settlement Test: "Will It Rain Tomorrow?"')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log('📊 Contest Setup:')
  console.log('   • Alice picked: YES (it will rain)')
  console.log('   • Bob picked: NO (it will not rain)')
  console.log('   • Entry fee: 10 FC each')
  console.log('   • Prize pool: 20 FC')
  console.log('')
  console.log('🌧️  Oracle Result: It DID rain (YES is correct)')
  console.log('   • Expected winner: ALICE')
  console.log('')
  console.log('─────────────────────────────────────────────────────────────────')
  console.log('')
  
  try {
    console.log('📡 Calling Settlement API...')
    console.log(`   URL: ${SETTLEMENT_API}`)
    console.log(`   Contest ID: ${CONTEST_ID}`)
    console.log('')
    
    const response = await fetch(SETTLEMENT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contest_id: CONTEST_ID,
        admin_key: ADMIN_KEY
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.log('❌ Settlement Failed!')
      console.log('')
      console.log('Error:', result.error)
      console.log('Message:', result.message)
      if (result.details) {
        console.log('Details:', JSON.stringify(result.details, null, 2))
      }
      return
    }
    
    console.log('✅ Settlement Successful!')
    console.log('')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📋 RESULTS')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('')
    console.log(`Contest: ${result.contest_title}`)
    console.log(`Settled at: ${result.settled_at_date}`)
    console.log('')
    console.log('Oracle Data:')
    console.log(`   Source: ${result.oracle?.source}`)
    console.log(`   Signature: ${result.oracle?.signature}`)
    console.log('')
    console.log('─────────────────────────────────────────────────────────────────')
    console.log('💰 PAYOUTS')
    console.log('─────────────────────────────────────────────────────────────────')
    console.log('')
    
    if (result.results?.payouts) {
      for (const payout of result.results.payouts) {
        const status = payout.credited ? '✅' : '❌'
        const name = payout.user_id.includes('alice') ? '👩 Alice' : 
                     payout.user_id.includes('bob') ? '👨 Bob' : payout.user_id
        console.log(`${status} Rank #${payout.rank}: ${name}`)
        console.log(`      Score: ${payout.score}`)
        console.log(`      Payout: ${payout.payout} FC`)
        console.log('')
      }
    }
    
    console.log('─────────────────────────────────────────────────────────────────')
    console.log('📊 SUMMARY')
    console.log('─────────────────────────────────────────────────────────────────')
    console.log(`   Total Entries: ${result.results?.total_entries}`)
    console.log(`   Prize Pool: ${result.results?.prize_pool} FC`)
    console.log(`   Total Paid Out: ${result.results?.total_paid_out} FC`)
    console.log(`   Successful Payouts: ${result.results?.successful_payouts}`)
    console.log(`   Failed Payouts: ${result.results?.failed_payouts}`)
    console.log('')
    console.log('═══════════════════════════════════════════════════════════════')
    
  } catch (error) {
    console.log('❌ Request Failed!')
    console.log('Error:', error.message)
    console.log('')
    console.log('Make sure:')
    console.log('  1. Your Next.js server is running (npm run dev)')
    console.log('  2. You ran the SQL scripts in Supabase')
    console.log('  3. DEALER_PRIVATE_KEY is set in .env')
  }
}

testSettlement()
