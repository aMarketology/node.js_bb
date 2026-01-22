/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST RUNNER: Execute All Tests
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Usage:
 *   node tests/run-all.js           # Run all tests
 *   node tests/run-all.js --quick   # Run quick tests only
 *   node tests/run-all.js wallet    # Run only wallet tests
 */

import { spawn } from 'child_process'
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const TEST_FILES = [
  '01-wallet-generate.test.js',
  '02-wallet-login.test.js',
  '03-send-tokens.test.js',
  '04-receive-tokens.test.js',
  '05-place-bet.test.js',
  '06-payout-event.test.js',
  '07-bridge-l1-l2.test.js',
]

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function printHeader() {
  console.log('')
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`)
  console.log(`${colors.cyan}║${colors.reset}         ${colors.bold}BLACKBOOK PREDICTION MARKET TEST SUITE${colors.reset}               ${colors.cyan}║${colors.reset}`)
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`)
  console.log('')
}

function printSummary(results) {
  const total = results.length
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  
  console.log('')
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.bold}                           TEST SUMMARY${colors.reset}`)
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════════════${colors.reset}`)
  console.log('')
  
  for (const result of results) {
    const icon = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`
    const name = result.file.replace('.test.js', '')
    console.log(`  ${icon} ${name}`)
  }
  
  console.log('')
  console.log(`${colors.cyan}───────────────────────────────────────────────────────────────────────${colors.reset}`)
  console.log(`  ${colors.bold}Total:${colors.reset}  ${total}`)
  console.log(`  ${colors.green}Passed:${colors.reset} ${passed}`)
  console.log(`  ${colors.red}Failed:${colors.reset} ${failed}`)
  console.log(`${colors.cyan}───────────────────────────────────────────────────────────────────────${colors.reset}`)
  console.log('')
  
  if (failed === 0) {
    console.log(`  ${colors.green}${colors.bold}All tests passed! ✓${colors.reset}`)
  } else {
    console.log(`  ${colors.red}${colors.bold}Some tests failed. See output above.${colors.reset}`)
  }
  console.log('')
}

async function runTestFile(file) {
  return new Promise((resolve) => {
    const filePath = join(__dirname, file)
    
    console.log('')
    console.log(`${colors.blue}═══════════════════════════════════════════════════════════════════════${colors.reset}`)
    console.log(`${colors.bold}  Running: ${file}${colors.reset}`)
    console.log(`${colors.blue}═══════════════════════════════════════════════════════════════════════${colors.reset}`)
    console.log('')
    
    const child = spawn('node', [filePath], {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
    })
    
    child.on('close', (code) => {
      resolve({
        file,
        passed: code === 0,
        exitCode: code,
      })
    })
    
    child.on('error', (err) => {
      console.error(`${colors.red}Error running ${file}: ${err.message}${colors.reset}`)
      resolve({
        file,
        passed: false,
        exitCode: 1,
        error: err.message,
      })
    })
  })
}

function parseArgs(args) {
  const options = {
    filter: null,
    quick: false,
    help: false,
  }
  
  for (const arg of args.slice(2)) {
    if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--quick' || arg === '-q') {
      options.quick = true
    } else if (!arg.startsWith('-')) {
      options.filter = arg.toLowerCase()
    }
  }
  
  return options
}

function printHelp() {
  console.log(`
${colors.bold}BlackBook Prediction Market Test Runner${colors.reset}

${colors.bold}Usage:${colors.reset}
  node tests/run-all.js [options] [filter]

${colors.bold}Options:${colors.reset}
  --help, -h     Show this help message
  --quick, -q    Run quick tests only (skip slow integration tests)

${colors.bold}Filter:${colors.reset}
  Provide a keyword to run only tests matching that keyword.
  
${colors.bold}Examples:${colors.reset}
  node tests/run-all.js              # Run all tests
  node tests/run-all.js wallet       # Run wallet tests only
  node tests/run-all.js --quick      # Run quick tests
  node tests/run-all.js bet          # Run betting tests
  node tests/run-all.js bridge       # Run bridge tests

${colors.bold}Test Files:${colors.reset}
  01-wallet-generate.test.js    Wallet creation
  02-wallet-login.test.js       Login/authentication
  03-send-tokens.test.js        Token transfers (send)
  04-receive-tokens.test.js     Token transfers (receive)
  05-place-bet.test.js          Placing bets on markets
  06-payout-event.test.js       Market resolution & payouts
  07-bridge-l1-l2.test.js       L1 ↔ L2 bridging
`)
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const options = parseArgs(process.argv)
  
  if (options.help) {
    printHelp()
    process.exit(0)
  }
  
  printHeader()
  
  // Filter test files based on args
  let testFiles = TEST_FILES
  
  if (options.filter) {
    testFiles = TEST_FILES.filter(f => 
      f.toLowerCase().includes(options.filter)
    )
    
    if (testFiles.length === 0) {
      console.log(`${colors.yellow}No tests matching "${options.filter}"${colors.reset}`)
      console.log(`Available tests: ${TEST_FILES.join(', ')}`)
      process.exit(1)
    }
    
    console.log(`${colors.dim}Filtered to: ${testFiles.join(', ')}${colors.reset}`)
  }
  
  if (options.quick) {
    // Quick tests skip slow integration tests
    testFiles = testFiles.filter(f => 
      !f.includes('bridge') && !f.includes('payout')
    )
    console.log(`${colors.dim}Quick mode: skipping slow tests${colors.reset}`)
  }
  
  // Run tests sequentially
  const results = []
  const startTime = Date.now()
  
  for (const file of testFiles) {
    const result = await runTestFile(file)
    results.push(result)
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  
  // Print summary
  printSummary(results)
  
  console.log(`${colors.dim}Total time: ${duration}s${colors.reset}`)
  console.log('')
  
  // Exit with failure code if any tests failed
  const failed = results.filter(r => !r.passed).length
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error(`${colors.red}Test runner error: ${err.message}${colors.reset}`)
  process.exit(1)
})
