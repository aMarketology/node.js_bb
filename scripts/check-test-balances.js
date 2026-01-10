#!/usr/bin/env node

/**
 * CLI tool to check test account balances
 * Usage: node scripts/check-test-balances.js
 */

import { printAllAccounts } from '../lib/test-accounts.js'

printAllAccounts().catch(console.error)
