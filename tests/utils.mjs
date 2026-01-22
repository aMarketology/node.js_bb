/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Shared utilities for all test files
 */

import { CONFIG, TEST_SEEDS } from './config.js'

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

export function log(message, color = 'reset') {
  if (CONFIG.VERBOSE || color === 'red') {
    console.log(`${colors[color]}${message}${colors.reset}`)
  }
}

export function logSection(title) {
  console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`)
  console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`)
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`)
}

export function logTest(name) {
  console.log(`${colors.blue}▶ TEST:${colors.reset} ${name}`)
}

export function logPass(message) {
  console.log(`  ${colors.green}✓ PASS:${colors.reset} ${message}`)
}

export function logFail(message, error = null) {
  console.log(`  ${colors.red}✗ FAIL:${colors.reset} ${message}`)
  if (error) {
    console.log(`  ${colors.red}  Error: ${error}${colors.reset}`)
  }
}

export function logSkip(message) {
  console.log(`  ${colors.yellow}⊘ SKIP:${colors.reset} ${message}`)
}

export function logInfo(message) {
  console.log(`  ${colors.magenta}ℹ INFO:${colors.reset} ${message}`)
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════

export class TestRunner {
  constructor(suiteName) {
    this.suiteName = suiteName
    this.tests = []
    this.passed = 0
    this.failed = 0
    this.skipped = 0
    this.startTime = null
  }

  /**
   * Add a test to the suite
   */
  test(name, fn, options = {}) {
    this.tests.push({ name, fn, options })
  }

  /**
   * Run all tests in the suite
   */
  async run() {
    logSection(this.suiteName)
    this.startTime = Date.now()

    for (const test of this.tests) {
      if (test.options.skip) {
        logSkip(test.name)
        this.skipped++
        continue
      }

      logTest(test.name)
      
      try {
        const timeout = test.options.timeout || CONFIG.TIMEOUT_MEDIUM
        await Promise.race([
          test.fn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Test timeout')), timeout)
          )
        ])
        logPass('Test completed successfully')
        this.passed++
      } catch (error) {
        logFail('Test failed', error.message)
        this.failed++
      }
    }

    this.printSummary()
    return { passed: this.passed, failed: this.failed, skipped: this.skipped }
  }

  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2)
    const total = this.passed + this.failed + this.skipped
    
    console.log(`\n${colors.cyan}${'─'.repeat(60)}${colors.reset}`)
    console.log(`${colors.bright}SUMMARY: ${this.suiteName}${colors.reset}`)
    console.log(`  Total:   ${total}`)
    console.log(`  ${colors.green}Passed:  ${this.passed}${colors.reset}`)
    console.log(`  ${colors.red}Failed:  ${this.failed}${colors.reset}`)
    console.log(`  ${colors.yellow}Skipped: ${this.skipped}${colors.reset}`)
    console.log(`  Time:    ${duration}s`)
    console.log(`${colors.cyan}${'─'.repeat(60)}${colors.reset}\n`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSERTION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`)
  }
}

export function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(`${message}: value is null or undefined`)
  }
}

export function assertGreaterThan(actual, expected, message) {
  if (actual <= expected) {
    throw new Error(`${message}: expected > ${expected}, got ${actual}`)
  }
}

export function assertLessThan(actual, expected, message) {
  if (actual >= expected) {
    throw new Error(`${message}: expected < ${expected}, got ${actual}`)
  }
}

export function assertInRange(value, min, max, message) {
  if (value < min || value > max) {
    throw new Error(`${message}: expected ${min}-${max}, got ${value}`)
  }
}

export function assertArrayLength(arr, length, message) {
  if (!Array.isArray(arr) || arr.length !== length) {
    throw new Error(`${message}: expected array of length ${length}, got ${arr?.length}`)
  }
}

export function assertHasProperty(obj, prop, message) {
  if (!obj || !(prop in obj)) {
    throw new Error(`${message}: object missing property '${prop}'`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ASYNC HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function retry(fn, maxAttempts = 3, delayMs = 1000) {
  let lastError
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxAttempts - 1) {
        await sleep(delayMs)
      }
    }
  }
  throw lastError
}

export async function waitFor(condition, timeoutMs = 10000, intervalMs = 500) {
  const startTime = Date.now()
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return true
    }
    await sleep(intervalMs)
  }
  throw new Error('Condition not met within timeout')
}

// ═══════════════════════════════════════════════════════════════════════════
// HTTP HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export async function checkServerHealth(url) {
  try {
    const response = await fetch(`${url}/health`)
    const data = await response.json()
    return data.status === 'ok' || response.ok
  } catch {
    return false
  }
}

export async function waitForServer(url, timeoutMs = 30000) {
  const startTime = Date.now()
  while (Date.now() - startTime < timeoutMs) {
    if (await checkServerHealth(url)) {
      return true
    }
    await sleep(1000)
  }
  throw new Error(`Server ${url} not available after ${timeoutMs}ms`)
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

export function generateUniqueId(prefix = 'test') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function generateRandomAmount(min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateTestMarket() {
  return {
    id: generateUniqueId('market'),
    question: `Test question ${Date.now()}?`,
    outcomes: ['Yes', 'No'],
    endTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  }
}

export default {
  TestRunner,
  colors,
  log,
  logSection,
  logTest,
  logPass,
  logFail,
  logSkip,
  logInfo,
  assert,
  assertEqual,
  assertNotNull,
  assertGreaterThan,
  assertLessThan,
  assertInRange,
  assertArrayLength,
  assertHasProperty,
  sleep,
  retry,
  waitFor,
  checkServerHealth,
  waitForServer,
  generateUniqueId,
  generateRandomAmount,
  generateTestMarket,
}
