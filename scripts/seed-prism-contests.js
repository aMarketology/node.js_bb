/**
 * PRISM Contest Seeder
 * Uploads the 6 PRISM contests to Supabase
 * 
 * Run: node scripts/seed-prism-contests.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env manually (check both .env and .env.local)
const envFiles = ['.env', '.env.local']
for (const envFile of envFiles) {
  const envPath = path.join(__dirname, '..', envFile)
  if (fs.existsSync(envPath)) {
    console.log(`Loading ${envFile}...`)
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      if (line && !line.startsWith('#') && line.includes('=')) {
        const eqIndex = line.indexOf('=')
        const key = line.substring(0, eqIndex).trim()
        const value = line.substring(eqIndex + 1).trim()
        if (key) {
          process.env[key] = value
        }
      }
    })
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

console.log('✅ Supabase credentials loaded\n')

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper: Get future timestamp
const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

// =====================================================
// THE 6 PRISM CONTESTS
// =====================================================
const contests = [
  // CONTEST 1: World Cup Semifinals - Dream Team (Roster, Sports)
  {
    title: 'World Cup Semifinals - Dream Team',
    description: 'Build your ultimate 5-player squad from both semifinal matches. Score points based on goals, assists, saves, and clean sheets.',
    rules: 'Select 5 players within the $50,000 salary cap. Points: Goal = 10pts, Assist = 5pts, Clean Sheet = 3pts, Save = 1pt.',
    game_type: 'roster',
    category: 'sports',
    entry_fee: 20,
    prize_pool: 1000,
    max_entries: 50,
    locks_at: daysFromNow(2),
    settles_at: daysFromNow(3),
    status: 'upcoming',
    payout_structure: [
      { place: 1, percentage: 50 },
      { place: 2, percentage: 25 },
      { place: 3, percentage: 15 },
      { place: 4, percentage: 10 }
    ],
    oracle_source: 'FIFA Official Stats API',
    tags: ['prism', 'sports', 'world-cup', 'roster', 'featured'],
    featured: true,
    game_data: {
      salary_cap: 50000,
      roster_slots: 5,
      min_teams: 2,
      scoring: { goal: 10, assist: 5, clean_sheet: 3, save: 1 },
      players: [
        { id: 'mbappe', name: 'Kylian Mbappé', team: 'France', position: 'FWD', salary: 12000, avg_score: 18.5, stats: { goals: 4, assists: 2 } },
        { id: 'vinicius', name: 'Vinícius Jr', team: 'Brazil', position: 'FWD', salary: 11000, avg_score: 16.2, stats: { goals: 3, assists: 3 } },
        { id: 'bellingham', name: 'Jude Bellingham', team: 'England', position: 'MID', salary: 10500, avg_score: 15.8, stats: { goals: 3, assists: 2 } },
        { id: 'rodri', name: 'Rodri', team: 'Spain', position: 'MID', salary: 9500, avg_score: 12.4, stats: { tackles: 12, passes: 156 } },
        { id: 'saliba', name: 'William Saliba', team: 'France', position: 'DEF', salary: 8500, avg_score: 10.2, stats: { clean_sheets: 3, blocks: 8 } },
        { id: 'gvardiol', name: 'Joško Gvardiol', team: 'Croatia', position: 'DEF', salary: 8000, avg_score: 9.8, stats: { clean_sheets: 2, tackles: 10 } },
        { id: 'donnarumma', name: 'Gianluigi Donnarumma', team: 'Italy', position: 'GK', salary: 7500, avg_score: 11.5, stats: { saves: 18, clean_sheets: 2 } },
        { id: 'saka', name: 'Bukayo Saka', team: 'England', position: 'FWD', salary: 10000, avg_score: 14.6, stats: { goals: 2, assists: 4 } },
        { id: 'pedri', name: 'Pedri', team: 'Spain', position: 'MID', salary: 9000, avg_score: 11.8, stats: { assists: 3, key_passes: 12 } },
        { id: 'martinez', name: 'Emiliano Martínez', team: 'Argentina', position: 'GK', salary: 7000, avg_score: 10.8, stats: { saves: 15, penalty_saves: 2 } }
      ]
    }
  },

  // CONTEST 2: Beast Games Week 3 - Creator League (Roster, YouTube)
  {
    title: 'Beast Games Week 3 - Creator League',
    description: "Draft your team of 4 contestants for this week's Beast Games challenges. Points based on challenge wins, survival, and viral moments.",
    rules: 'Select 4 contestants within the $40,000 budget. Points: Challenge Win = 15pts, Survival = 5pts, Viral Moment = 10pts, Elimination = -20pts.',
    game_type: 'roster',
    category: 'youtube',
    entry_fee: 20,
    prize_pool: 800,
    max_entries: 40,
    locks_at: daysFromNow(1),
    settles_at: daysFromNow(2),
    status: 'upcoming',
    payout_structure: [
      { place: 1, percentage: 50 },
      { place: 2, percentage: 30 },
      { place: 3, percentage: 20 }
    ],
    oracle_source: 'Beast Games Official + Social Blade',
    tags: ['prism', 'youtube', 'beast-games', 'roster', 'trending'],
    featured: true,
    game_data: {
      salary_cap: 40000,
      roster_slots: 4,
      scoring: { challenge_win: 15, survival: 5, viral_moment: 10, elimination: -20 },
      contestants: [
        { id: 'contestant1', name: 'Alex TheGamer', salary: 12000, avg_score: 22.5, category: 'Gaming', stats: { survival_rate: '85%', challenge_wins: 3 } },
        { id: 'contestant2', name: 'Sarah Fitness', salary: 11000, avg_score: 19.8, category: 'Fitness', stats: { survival_rate: '90%', challenge_wins: 2 } },
        { id: 'contestant3', name: 'Mike Comedy', salary: 10000, avg_score: 18.2, category: 'Comedy', stats: { survival_rate: '75%', challenge_wins: 2 } },
        { id: 'contestant4', name: 'Emma Vlogs', salary: 9500, avg_score: 16.5, category: 'Lifestyle', stats: { survival_rate: '80%', challenge_wins: 1 } },
        { id: 'contestant5', name: 'Jake Adventure', salary: 9000, avg_score: 15.8, category: 'Adventure', stats: { survival_rate: '70%', challenge_wins: 2 } },
        { id: 'contestant6', name: 'Lisa Tech', salary: 8500, avg_score: 14.2, category: 'Tech', stats: { survival_rate: '65%', challenge_wins: 1 } },
        { id: 'contestant7', name: 'Tom Music', salary: 8000, avg_score: 13.5, category: 'Music', stats: { survival_rate: '60%', challenge_wins: 1 } },
        { id: 'contestant8', name: 'Nina Art', salary: 7500, avg_score: 12.0, category: 'Art', stats: { survival_rate: '55%', challenge_wins: 0 } }
      ]
    }
  },

  // CONTEST 3: Striker Clash - Mbappé vs Vinícius Jr (Duel, Sports, LIVE)
  {
    title: 'Striker Clash: Mbappé vs Vinícius Jr',
    description: 'Who will dominate the World Cup semifinal? Pick the player with more combined goals + assists in their match.',
    rules: 'Winner is determined by total goals + assists. If tied, the player with more shots on target wins.',
    game_type: 'duel',
    category: 'sports',
    entry_fee: 10,
    prize_pool: 500,
    max_entries: 100,
    locks_at: hoursFromNow(4),
    settles_at: hoursFromNow(6),
    status: 'live',
    payout_structure: [{ place: 1, percentage: 100 }],
    oracle_source: 'FIFA Official Stats',
    tags: ['prism', 'sports', 'duel', 'live', 'world-cup'],
    featured: true,
    game_data: {
      metric: 'goals_plus_assists',
      tiebreaker: 'shots_on_target',
      entities: [
        {
          name: 'Kylian Mbappé',
          team: 'France',
          avatar_url: '/avatars/mbappe.jpg',
          stats: [
            { label: 'Goals This Tournament', value: 4, trend: 'up' },
            { label: 'Assists', value: 2, trend: 'neutral' },
            { label: 'Shots/Game', value: 5.2, trend: 'up' },
            { label: 'Form Rating', value: '9.1', trend: 'up' }
          ]
        },
        {
          name: 'Vinícius Jr',
          team: 'Brazil',
          avatar_url: '/avatars/vinicius.jpg',
          stats: [
            { label: 'Goals This Tournament', value: 3, trend: 'up' },
            { label: 'Assists', value: 3, trend: 'up' },
            { label: 'Shots/Game', value: 4.8, trend: 'neutral' },
            { label: 'Form Rating', value: '8.9', trend: 'up' }
          ]
        }
      ],
      current_scores: { 'Kylian Mbappé': 1, 'Vinícius Jr': 0 }
    }
  },

  // CONTEST 4: Virality Clash - MrBeast vs IShowSpeed (Duel, YouTube, LIVE)
  {
    title: 'Virality Clash: MrBeast vs IShowSpeed',
    description: 'Two YouTube titans go head-to-head! Predict who gets more views on their next video released within 24 hours.',
    rules: 'Winner determined by total views after 24 hours from video publish time. Only main channel uploads count.',
    game_type: 'duel',
    category: 'youtube',
    entry_fee: 10,
    prize_pool: 600,
    max_entries: 100,
    locks_at: hoursFromNow(6),
    settles_at: hoursFromNow(30),
    status: 'live',
    payout_structure: [{ place: 1, percentage: 100 }],
    oracle_source: 'YouTube Data API + Social Blade',
    tags: ['prism', 'youtube', 'duel', 'live', 'trending'],
    featured: true,
    game_data: {
      metric: 'video_views_24h',
      tiebreaker: 'likes',
      entities: [
        {
          name: 'MrBeast',
          team: '@MrBeast',
          avatar_url: '/avatars/mrbeast.jpg',
          stats: [
            { label: 'Subscribers', value: '320M', trend: 'up' },
            { label: 'Avg Views (24h)', value: '45M', trend: 'up' },
            { label: 'Last Video Views', value: '52M', trend: 'up' },
            { label: 'Upload Streak', value: 'Weekly', trend: 'neutral' }
          ]
        },
        {
          name: 'IShowSpeed',
          team: '@IShowSpeed',
          avatar_url: '/avatars/ishowspeed.jpg',
          stats: [
            { label: 'Subscribers', value: '28M', trend: 'up' },
            { label: 'Avg Views (24h)', value: '8M', trend: 'up' },
            { label: 'Last Video Views', value: '12M', trend: 'up' },
            { label: 'Stream Hours/Week', value: '40+', trend: 'neutral' }
          ]
        }
      ],
      current_scores: { 'MrBeast': 0, 'IShowSpeed': 0 }
    }
  },

  // CONTEST 5: USA vs England - Match Bingo (Bingo, Sports)
  {
    title: 'USA vs England - Match Bingo',
    description: 'Predict match events! Select 5 squares you think will happen. Complete a line for bonus points!',
    rules: 'Select exactly 5 predictions. Each correct = 10pts. Complete a line (row/col/diagonal) = 25pt bonus.',
    game_type: 'bingo',
    category: 'sports',
    entry_fee: 5,
    prize_pool: 250,
    max_entries: 50,
    locks_at: daysFromNow(1),
    settles_at: daysFromNow(2),
    status: 'upcoming',
    payout_structure: [
      { place: 1, percentage: 50 },
      { place: 2, percentage: 30 },
      { place: 3, percentage: 20 }
    ],
    oracle_source: 'FIFA Official Match Events',
    tags: ['prism', 'sports', 'bingo', 'world-cup'],
    featured: false,
    game_data: {
      max_selections: 5,
      points_per_correct: 10,
      line_bonus: 25,
      max_lines: 3,
      squares: [
        { id: 'sq1', text: 'Goal in first 15 min', completed: false },
        { id: 'sq2', text: 'Penalty awarded', completed: false },
        { id: 'sq3', text: 'Red card shown', completed: false },
        { id: 'sq4', text: 'Hat-trick scored', completed: false },
        { id: 'sq5', text: 'Own goal', completed: false },
        { id: 'sq6', text: 'VAR review', completed: false },
        { id: 'sq7', text: 'Goal from outside box', completed: false },
        { id: 'sq8', text: 'Goalkeeper saves penalty', completed: false },
        { id: 'sq9', text: '5+ total goals', completed: false }
      ],
      winning_lines: [
        ['sq1', 'sq2', 'sq3'],
        ['sq4', 'sq5', 'sq6'],
        ['sq7', 'sq8', 'sq9'],
        ['sq1', 'sq4', 'sq7'],
        ['sq2', 'sq5', 'sq8'],
        ['sq3', 'sq6', 'sq9'],
        ['sq1', 'sq5', 'sq9'],
        ['sq3', 'sq5', 'sq7']
      ]
    }
  },

  // CONTEST 6: MrBeast Next Video - Content Bingo (Bingo, YouTube)
  {
    title: 'MrBeast Next Video - Content Bingo',
    description: "Predict what happens in MrBeast's next main channel upload! Pick 5 events you think will occur.",
    rules: 'Select 5 predictions about video content. Each correct = 10pts. Line bonus = 25pts.',
    game_type: 'bingo',
    category: 'youtube',
    entry_fee: 5,
    prize_pool: 300,
    max_entries: 60,
    locks_at: hoursFromNow(12),
    settles_at: hoursFromNow(60),
    status: 'upcoming',
    payout_structure: [
      { place: 1, percentage: 50 },
      { place: 2, percentage: 30 },
      { place: 3, percentage: 20 }
    ],
    oracle_source: 'YouTube Data API + Manual Verification',
    tags: ['prism', 'youtube', 'bingo', 'mrbeast'],
    featured: false,
    game_data: {
      max_selections: 5,
      points_per_correct: 10,
      line_bonus: 25,
      max_lines: 3,
      squares: [
        { id: 'sq1', text: 'Gives away $100K+', completed: false },
        { id: 'sq2', text: 'Celebrity cameo', completed: false },
        { id: 'sq3', text: 'Chris appears', completed: false },
        { id: 'sq4', text: 'Chandler loses', completed: false },
        { id: 'sq5', text: '50M+ views in 24h', completed: false },
        { id: 'sq6', text: 'Video over 20 min', completed: false },
        { id: 'sq7', text: 'Feastables plug', completed: false },
        { id: 'sq8', text: 'Subscriber milestone mentioned', completed: false },
        { id: 'sq9', text: 'Physical challenge', completed: false }
      ],
      winning_lines: [
        ['sq1', 'sq2', 'sq3'],
        ['sq4', 'sq5', 'sq6'],
        ['sq7', 'sq8', 'sq9'],
        ['sq1', 'sq4', 'sq7'],
        ['sq2', 'sq5', 'sq8'],
        ['sq3', 'sq6', 'sq9'],
        ['sq1', 'sq5', 'sq9'],
        ['sq3', 'sq5', 'sq7']
      ]
    }
  }
]

// =====================================================
// SEED FUNCTION
// =====================================================
async function seedContests() {
  console.log('🎮 PRISM Contest Seeder')
  console.log('========================\n')

  // Check if table exists first
  const { data: tableCheck, error: tableError } = await supabase
    .from('contests_metadata')
  // Check if table exists first
  const { data: tableCheck, error: tableError } = await supabase
    .from('prism')
    .select('id')
    .limit(1)

  if (tableError && tableError.code === '42P01') {
    console.log('⚠️  Table "prism" does not exist.')
    console.log('📋 Please run the SQL migration first:')
    console.log('   Copy scripts/seed-prism-contests.sql to Supabase SQL Editor')
    process.exit(1)
  }

  // Delete existing PRISM contests
  console.log('🗑️  Clearing existing PRISM contests...')
  const { error: deleteError } = await supabase
    .from('prism')
    .delete()
    .contains('tags', ['prism'])

  if (deleteError) {
    console.log('⚠️  Could not delete existing contests:', deleteError.message)
  }

  // Insert new contests
  console.log('📥 Inserting 6 PRISM contests...\n')
  
  for (const contest of contests) {
    const { data, error } = await supabase
      .from('prism')
      .insert(contest)
      .select('id, title, game_type, entry_fee, prize_pool, status')
      .single()

    if (error) {
      console.log(`❌ ${contest.title}`)
      console.log(`   Error: ${error.message}\n`)
    } else {
      const icon = {
        duel: '⚔️',
        roster: '👥',
        bingo: '🎯'
      }[contest.game_type] || '🎮'
      
      const statusBadge = contest.status === 'live' ? '🔴 LIVE' : '⏰'
      
      console.log(`✅ ${icon} ${data.title}`)
      console.log(`   ${statusBadge} | ${data.entry_fee} $BB entry | ${data.prize_pool} $BB pool\n`)
    }
  }

  // Verify
  console.log('========================')
  console.log('📊 Verification:\n')
  
  const { data: allContests, error: verifyError } = await supabase
    .from('prism')
    .select('id, title, game_type, category, entry_fee, prize_pool, status')
    .contains('tags', ['prism'])
    .order('entry_fee', { ascending: false })

  if (verifyError) {
    console.log('❌ Could not verify:', verifyError.message)
  } else {
    console.log(`Found ${allContests.length} PRISM contests:\n`)
    allContests.forEach((c, i) => {
      console.log(`${i + 1}. ${c.title}`)
      console.log(`   Type: ${c.game_type} | Category: ${c.category}`)
      console.log(`   Entry: ${c.entry_fee} $BB | Pool: ${c.prize_pool} $BB | Status: ${c.status}\n`)
    })
  }

  console.log('🎉 Done! Contests are ready at /contest/[id]')
}

// Run
seedContests().catch(console.error)
