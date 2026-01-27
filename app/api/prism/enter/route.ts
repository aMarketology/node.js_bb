// =====================================================
// PRISM Entry API - Server-Side Lock Enforcement
// Prevents past-posting fraud by validating timestamps
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface EntryRequest {
  contest_id: string
  user_id: string
  picks: any // DuelPick | RosterPick[] | BingoPick[]
  entry_fee: number
  signature?: string // Optional: user's signature for proof of consent
}

export async function POST(req: NextRequest) {
  try {
    const body: EntryRequest = await req.json()
    const { contest_id, user_id, picks, entry_fee, signature } = body

    // ========================================
    // 1. Validate required fields
    // ========================================
    if (!contest_id || !user_id || !picks) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'contest_id, user_id, and picks are required' },
        { status: 400 }
      )
    }

    // ========================================
    // 2. Fetch contest with lock data
    // ========================================
    const { data: contest, error: contestError } = await supabase
      .from('prism')
      .select(`
        id, title, status, entry_fee, max_entries, current_entries,
        lock_timestamp, buffer_minutes, lock_type,
        game_type, game_data
      `)
      .eq('id', contest_id)
      .single()

    if (contestError || !contest) {
      return NextResponse.json(
        { error: 'CONTEST_NOT_FOUND', message: 'Contest does not exist' },
        { status: 404 }
      )
    }

    // ========================================
    // 3. CRITICAL: Past-Posting Check
    // ========================================
    const nowUnix = Math.floor(Date.now() / 1000)
    const bufferSeconds = (contest.buffer_minutes || 5) * 60
    const effectiveLockTime = contest.lock_timestamp - bufferSeconds

    if (nowUnix >= effectiveLockTime) {
      const lockDate = new Date(contest.lock_timestamp * 1000).toISOString()
      const effectiveLockDate = new Date(effectiveLockTime * 1000).toISOString()
      
      return NextResponse.json({
        error: 'ENTRY_LOCKED',
        message: 'Contest entries have closed',
        details: {
          lock_timestamp: contest.lock_timestamp,
          buffer_minutes: contest.buffer_minutes,
          effective_lock: effectiveLockTime,
          current_time: nowUnix,
          lock_date: lockDate,
          effective_lock_date: effectiveLockDate,
          seconds_late: nowUnix - effectiveLockTime
        }
      }, { status: 400 })
    }

    // ========================================
    // 4. Validate contest status
    // ========================================
    if (contest.status === 'locked' || contest.status === 'settled' || contest.status === 'cancelled') {
      return NextResponse.json({
        error: 'CONTEST_UNAVAILABLE',
        message: `Contest is ${contest.status} and not accepting entries`,
        status: contest.status
      }, { status: 400 })
    }

    // ========================================
    // 5. Check max entries
    // ========================================
    if (contest.current_entries >= contest.max_entries) {
      return NextResponse.json({
        error: 'CONTEST_FULL',
        message: 'Contest has reached maximum entries',
        max_entries: contest.max_entries,
        current_entries: contest.current_entries
      }, { status: 400 })
    }

    // ========================================
    // 6. Validate entry fee matches
    // ========================================
    if (entry_fee !== contest.entry_fee) {
      return NextResponse.json({
        error: 'INVALID_ENTRY_FEE',
        message: `Entry fee must be ${contest.entry_fee} $BB`,
        expected: contest.entry_fee,
        received: entry_fee
      }, { status: 400 })
    }

    // ========================================
    // 7. Validate picks based on game type
    // ========================================
    const picksValidation = validatePicks(contest.game_type, picks, contest.game_data)
    if (!picksValidation.valid) {
      return NextResponse.json({
        error: 'INVALID_PICKS',
        message: picksValidation.message,
        details: picksValidation.details
      }, { status: 400 })
    }

    // ========================================
    // 8. Check for duplicate entry
    // ========================================
    const { data: existingEntry } = await supabase
      .from('prism_entries')
      .select('id')
      .eq('contest_id', contest_id)
      .eq('user_id', user_id)
      .single()

    if (existingEntry) {
      return NextResponse.json({
        error: 'DUPLICATE_ENTRY',
        message: 'You have already entered this contest',
        existing_entry_id: existingEntry.id
      }, { status: 400 })
    }

    // ========================================
    // 9. CRITICAL: Deduct Fan Credit Balance
    // ========================================
    // Check user's Fan Credit balance first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fan_gold_balance, id')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        error: 'USER_NOT_FOUND',
        message: 'User profile not found'
      }, { status: 404 })
    }

    const currentBalance = profile.fan_gold_balance || 0
    
    if (currentBalance < entry_fee) {
      return NextResponse.json({
        error: 'INSUFFICIENT_BALANCE',
        message: 'Insufficient Fan Credit balance',
        details: {
          required: entry_fee,
          current_balance: currentBalance,
          shortfall: entry_fee - currentBalance
        }
      }, { status: 400 })
    }

    // Deduct entry fee from user's balance
    const newBalance = currentBalance - entry_fee
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ fan_gold_balance: newBalance })
      .eq('id', user_id)

    if (balanceError) {
      console.error('[PRISM Entry] Failed to deduct balance:', balanceError)
      return NextResponse.json({
        error: 'BALANCE_DEDUCTION_FAILED',
        message: 'Failed to deduct entry fee from balance'
      }, { status: 500 })
    }

    console.log(`[PRISM Entry] Deducted ${entry_fee} FC from user ${user_id} (${currentBalance} → ${newBalance} FC)`)

    // ========================================
    // 10. Create entry with timestamp proof
    // ========================================
    const { data: entry, error: entryError } = await supabase
      .from('prism_entries')
      .insert({
        contest_id,
        user_id,
        picks,
        entry_fee,
        entry_timestamp: nowUnix,
        entry_signature: signature || null,
        locked: false
      })
      .select()
      .single()

    if (entryError) {
      console.error('[PRISM Entry] Insert error:', entryError)
      return NextResponse.json({
        error: 'ENTRY_FAILED',
        message: 'Failed to create entry',
        details: entryError.message
      }, { status: 500 })
    }

    // ========================================
    // ========================================
    // 11. Increment contest entry count
    // ========================================
    await supabase
      .from('prism')
      .update({ current_entries: contest.current_entries + 1 })
      .eq('id', contest_id)

    // ========================================
    // 12. Return success with timing info + balance
    // ========================================
    const timeUntilLock = effectiveLockTime - nowUnix
    
    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        contest_id: entry.contest_id,
        user_id: entry.user_id,
        picks: entry.picks,
        entry_timestamp: entry.entry_timestamp,
        created_at: entry.created_at
      },
      balance: {
        previous: currentBalance,
        deducted: entry_fee,
        new: newBalance
      },
      timing: {
        entry_timestamp: nowUnix,
        entry_date: new Date(nowUnix * 1000).toISOString(),
        lock_timestamp: contest.lock_timestamp,
        effective_lock: effectiveLockTime,
        time_until_lock_seconds: timeUntilLock,
        time_until_lock_human: formatTimeRemaining(timeUntilLock)
      },
      contest: {
        title: contest.title,
        entry_fee: contest.entry_fee,
        current_entries: contest.current_entries + 1,
        max_entries: contest.max_entries
      }
    })

  } catch (error) {
    console.error('[PRISM Entry] Unexpected error:', error)
    return NextResponse.json({
      error: 'SERVER_ERROR',
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
}

// ========================================
// Helper: Validate picks based on game type
// ========================================
function validatePicks(
  gameType: string,
  picks: any,
  gameData: any
): { valid: boolean; message?: string; details?: any } {
  
  switch (gameType) {
    case 'duel':
      // Duel: picks should be { selection: "Player A" | "Player B" }
      if (!picks.selection) {
        return { valid: false, message: 'Duel requires a selection', details: { required: 'selection' } }
      }
      const validOptions = gameData?.entities?.map((e: any) => e.name) || []
      if (validOptions.length && !validOptions.includes(picks.selection)) {
        return { 
          valid: false, 
          message: 'Invalid selection', 
          details: { valid_options: validOptions, received: picks.selection } 
        }
      }
      return { valid: true }

    case 'roster':
      // Roster: picks should be { players: ["id1", "id2", ...] }
      if (!picks.players || !Array.isArray(picks.players)) {
        return { valid: false, message: 'Roster requires players array', details: { required: 'players[]' } }
      }
      const requiredSlots = gameData?.roster_slots || 5
      if (picks.players.length !== requiredSlots) {
        return { 
          valid: false, 
          message: `Must select exactly ${requiredSlots} players`, 
          details: { required: requiredSlots, received: picks.players.length } 
        }
      }
      // Validate salary cap if applicable
      if (gameData?.salary_cap && gameData?.players) {
        const totalSalary = picks.players.reduce((sum: number, playerId: string) => {
          const player = gameData.players.find((p: any) => p.id === playerId)
          return sum + (player?.salary || 0)
        }, 0)
        if (totalSalary > gameData.salary_cap) {
          return { 
            valid: false, 
            message: 'Roster exceeds salary cap', 
            details: { salary_cap: gameData.salary_cap, total_salary: totalSalary } 
          }
        }
      }
      return { valid: true }

    case 'bingo':
      // Bingo: picks should be { selections: ["sq1", "sq2", ...] }
      if (!picks.selections || !Array.isArray(picks.selections)) {
        return { valid: false, message: 'Bingo requires selections array', details: { required: 'selections[]' } }
      }
      const maxSelections = gameData?.max_selections || 5
      if (picks.selections.length !== maxSelections) {
        return { 
          valid: false, 
          message: `Must select exactly ${maxSelections} squares`, 
          details: { required: maxSelections, received: picks.selections.length } 
        }
      }
      // Validate all selections are valid squares
      const validSquares = gameData?.squares?.map((s: any) => s.id) || []
      const invalidSelections = picks.selections.filter((s: string) => !validSquares.includes(s))
      if (invalidSelections.length > 0) {
        return { 
          valid: false, 
          message: 'Invalid square selections', 
          details: { invalid: invalidSelections, valid: validSquares } 
        }
      }
      return { valid: true }

    default:
      return { valid: false, message: `Unknown game type: ${gameType}` }
  }
}

// ========================================
// Helper: Format time remaining
// ========================================
function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'LOCKED'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}
