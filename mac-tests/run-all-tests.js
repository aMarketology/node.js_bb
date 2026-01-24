/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MAC WALLET TEST SUITE - Run All Phase Tests
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This script runs all phase tests using Mac's real wallet credentials.
 * 
 * Run: node mac-tests/run-all-tests.js
 * 
 * Or run individual tests:
 *   node mac-tests/phase1-user-wallet-signing.js
 *   node mac-tests/phase2-alphabetical-json-signing.js
 *   node mac-tests/phase3-activity-session-management.js
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tests = [
  {
    name: 'Phase 1: User Wallet L2 Signing',
    file: 'phase1-user-wallet-signing.js',
    description: 'Tests on-demand key derivation from encrypted vault'
  },
  {
    name: 'Phase 2: Alphabetical JSON Signing',
    file: 'phase2-alphabetical-json-signing.js',
    description: 'Tests JSON key sorting for L2 Rust serde_json compatibility'
  },
  {
    name: 'Phase 3: Activity-Based Session Management',
    file: 'phase3-activity-session-management.js',
    description: 'Tests 10-min sessions, 1-hr logout, $1000 threshold'
  }
];

function runTest(test) {
  return new Promise((resolve, reject) => {
    const testPath = path.join(__dirname, test.file);
    const proc = spawn('node', [testPath], {
      stdio: 'inherit',
      shell: true
    });
    
    proc.on('close', (code) => {
      resolve({ test, code });
    });
    
    proc.on('error', (error) => {
      reject({ test, error });
    });
  });
}

async function runAllTests() {
  console.log('╔' + '═'.repeat(70) + '╗');
  console.log('║' + ' '.repeat(15) + 'MAC WALLET INTEGRATION TEST SUITE' + ' '.repeat(22) + '║');
  console.log('║' + ' '.repeat(15) + 'Testing All Implementation Phases' + ' '.repeat(22) + '║');
  console.log('╚' + '═'.repeat(70) + '╝');
  
  console.log('\n📋 Test Suite Overview:');
  tests.forEach((test, i) => {
    console.log(`   ${i + 1}. ${test.name}`);
    console.log(`      ${test.description}`);
  });
  
  console.log('\n' + '─'.repeat(72));
  console.log('Starting tests...\n');
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n${'▼'.repeat(72)}`);
    console.log(`Running: ${test.name}`);
    console.log(`${'▼'.repeat(72)}\n`);
    
    try {
      const result = await runTest(test);
      results.push(result);
      
      if (result.code !== 0) {
        console.log(`\n⚠️  ${test.name} completed with warnings/failures`);
      }
    } catch (error) {
      results.push({ test, code: 1, error: error.error });
      console.log(`\n❌ ${test.name} failed to run: ${error.error?.message}`);
    }
    
    console.log(`\n${'▲'.repeat(72)}\n`);
  }
  
  // Summary
  console.log('\n' + '═'.repeat(72));
  console.log('📊 FINAL TEST SUITE RESULTS');
  console.log('═'.repeat(72));
  
  let allPassed = true;
  results.forEach((result, i) => {
    const status = result.code === 0 ? '✅ PASSED' : '❌ FAILED';
    if (result.code !== 0) allPassed = false;
    console.log(`   ${i + 1}. ${result.test.name}: ${status}`);
  });
  
  console.log('═'.repeat(72));
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Mac wallet integration is working correctly.\n');
    console.log('Summary of implemented features:');
    console.log('   ✓ On-demand private key derivation from vault');
    console.log('   ✓ Alphabetically sorted JSON for L2 Rust compatibility');
    console.log('   ✓ Activity-based session management (10min/1hr/$1000)');
    console.log('   ✓ Secure memory handling (keys cleared after use)');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above for details.\n');
    process.exit(1);
  }
}

runAllTests().catch(console.error);
