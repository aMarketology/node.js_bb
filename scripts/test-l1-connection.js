/**
 * Test L1 Server Connection
 * Verifies that the L1 blockchain server is running and accessible
 */

const L1_API_URL = process.env.NEXT_PUBLIC_L1_API_URL || 'http://localhost:8080'

console.log('═══════════════════════════════════════════════════════════════')
console.log('🔍 L1 Server Connection Test')
console.log('═══════════════════════════════════════════════════════════════')
console.log('')
console.log('📡 L1 API URL:', L1_API_URL)
console.log('')

async function testL1Connection() {
  console.log('─────────────────────────────────────────────────────────────────')
  console.log('Test 1: Check if L1 server is running')
  console.log('─────────────────────────────────────────────────────────────────')
  
  try {
    // Test basic connectivity
    const response = await fetch(L1_API_URL)
    console.log('✅ L1 server is reachable')
    console.log('   Status:', response.status)
    console.log('   Status Text:', response.statusText)
    
    if (response.ok) {
      const text = await response.text()
      console.log('   Response:', text.substring(0, 200))
    }
  } catch (error) {
    console.log('❌ L1 server is NOT reachable')
    console.log('   Error:', error.message)
    console.log('')
    console.log('💡 Make sure the L1 server is running:')
    console.log('   • Check if the server is started')
    console.log('   • Verify it\'s listening on', L1_API_URL)
    return
  }
  
  console.log('')
  console.log('─────────────────────────────────────────────────────────────────')
  console.log('Test 2: Test common L1 endpoints')
  console.log('─────────────────────────────────────────────────────────────────')
  
  const testEndpoints = [
    '/health',
    '/status',
    '/info',
    '/balance/L1_52882D768C0F3E7932AAD1813CF8B19058D507A8',
    '/explorer/account/L1_52882D768C0F3E7932AAD1813CF8B19058D507A8/history',
    '/history/L1_52882D768C0F3E7932AAD1813CF8B19058D507A8'
  ]
  
  for (const endpoint of testEndpoints) {
    try {
      const url = `${L1_API_URL}${endpoint}`
      const response = await fetch(url)
      
      if (response.ok) {
        console.log('✅', endpoint, '→', response.status)
        try {
          const data = await response.json()
          console.log('   Response:', JSON.stringify(data).substring(0, 150))
        } catch (e) {
          const text = await response.text()
          console.log('   Response:', text.substring(0, 150))
        }
      } else {
        console.log('❌', endpoint, '→', response.status, response.statusText)
      }
    } catch (error) {
      console.log('❌', endpoint, '→ ERROR:', error.message)
    }
  }
  
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('Test Complete')
  console.log('═══════════════════════════════════════════════════════════════')
}

testL1Connection()
