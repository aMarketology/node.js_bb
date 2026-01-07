import { NextResponse } from 'next/server'

// World Cup 2026 Match and Prop Bet Data
// All events stored on blockchain - this serves as the data layer

export interface PropBet {
  id: string
  type: 'player' | 'game' | 'special'
  question: string
  outcomes: string[]
  outcomePrices: string[]
  player?: string
  team?: string
}

export interface Match {
  id: string
  slug: string
  homeTeam: string
  homeTeamCode: string
  homeTeamFlag: string
  awayTeam: string
  awayTeamCode: string
  awayTeamFlag: string
  stage: 'group' | 'round-of-16' | 'quarter-final' | 'semi-final' | 'third-place' | 'final'
  group?: string
  venue: string
  city: string
  kickoff: string
  status: 'upcoming' | 'live' | 'finished'
  // Main match odds (Win/Draw/Win)
  homeWinOdds: string
  drawOdds: string
  awayWinOdds: string
  // Trading data
  volume: string
  liquidity: string
  // Prop bets nested under the match
  propBets: PropBet[]
}

// World Cup 2026 sample matches with prop bets
const worldCupMatches: Match[] = [
  {
    id: 'wc2026-001',
    slug: 'mexico-vs-canada-opening',
    homeTeam: 'Mexico',
    homeTeamCode: 'MEX',
    homeTeamFlag: '🇲🇽',
    awayTeam: 'Canada',
    awayTeamCode: 'CAN',
    awayTeamFlag: '🇨🇦',
    stage: 'group',
    group: 'A',
    venue: 'Estadio Azteca',
    city: 'Mexico City',
    kickoff: '2026-06-11T18:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.55',
    drawOdds: '0.25',
    awayWinOdds: '0.20',
    volume: '2450000',
    liquidity: '890000',
    propBets: [
      {
        id: 'prop-001-1',
        type: 'player',
        question: 'Will Santiago Giménez score in the first 15 minutes?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.12', '0.88'],
        player: 'Santiago Giménez',
        team: 'Mexico'
      },
      {
        id: 'prop-001-2',
        type: 'player',
        question: 'Will Alphonso Davies get an assist?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.35', '0.65'],
        player: 'Alphonso Davies',
        team: 'Canada'
      },
      {
        id: 'prop-001-3',
        type: 'game',
        question: 'Total goals Over/Under 2.5',
        outcomes: ['Over', 'Under'],
        outcomePrices: ['0.58', '0.42']
      },
      {
        id: 'prop-001-4',
        type: 'game',
        question: 'Both teams to score?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.62', '0.38']
      },
      {
        id: 'prop-001-5',
        type: 'special',
        question: 'Will there be a penalty awarded?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.28', '0.72']
      }
    ]
  },
  {
    id: 'wc2026-002',
    slug: 'usa-vs-england',
    homeTeam: 'United States',
    homeTeamCode: 'USA',
    homeTeamFlag: '🇺🇸',
    awayTeam: 'England',
    awayTeamCode: 'ENG',
    awayTeamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    stage: 'group',
    group: 'B',
    venue: 'MetLife Stadium',
    city: 'New Jersey',
    kickoff: '2026-06-12T21:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.28',
    drawOdds: '0.30',
    awayWinOdds: '0.42',
    volume: '8900000',
    liquidity: '3200000',
    propBets: [
      {
        id: 'prop-002-1',
        type: 'player',
        question: 'Will Harry Kane score anytime?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.45', '0.55'],
        player: 'Harry Kane',
        team: 'England'
      },
      {
        id: 'prop-002-2',
        type: 'player',
        question: 'Will Christian Pulisic score or assist?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.40', '0.60'],
        player: 'Christian Pulisic',
        team: 'United States'
      },
      {
        id: 'prop-002-3',
        type: 'player',
        question: 'Will Jude Bellingham score in the first half?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.22', '0.78'],
        player: 'Jude Bellingham',
        team: 'England'
      },
      {
        id: 'prop-002-4',
        type: 'game',
        question: 'First half Over/Under 1.5 goals',
        outcomes: ['Over', 'Under'],
        outcomePrices: ['0.48', '0.52']
      },
      {
        id: 'prop-002-5',
        type: 'game',
        question: 'Will there be a red card?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.15', '0.85']
      },
      {
        id: 'prop-002-6',
        type: 'special',
        question: 'Exact score 1-1?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.12', '0.88']
      }
    ]
  },
  {
    id: 'wc2026-003',
    slug: 'france-vs-brazil',
    homeTeam: 'France',
    homeTeamCode: 'FRA',
    homeTeamFlag: '🇫🇷',
    awayTeam: 'Brazil',
    awayTeamCode: 'BRA',
    awayTeamFlag: '🇧🇷',
    stage: 'group',
    group: 'C',
    venue: 'AT&T Stadium',
    city: 'Dallas',
    kickoff: '2026-06-13T20:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.38',
    drawOdds: '0.28',
    awayWinOdds: '0.34',
    volume: '12500000',
    liquidity: '4500000',
    propBets: [
      {
        id: 'prop-003-1',
        type: 'player',
        question: 'Will Kylian Mbappé score in the first 5 minutes?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.08', '0.92'],
        player: 'Kylian Mbappé',
        team: 'France'
      },
      {
        id: 'prop-003-2',
        type: 'player',
        question: 'Will Mbappé score a hat-trick?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.05', '0.95'],
        player: 'Kylian Mbappé',
        team: 'France'
      },
      {
        id: 'prop-003-3',
        type: 'player',
        question: 'Will Vinícius Jr score or assist?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.52', '0.48'],
        player: 'Vinícius Jr',
        team: 'Brazil'
      },
      {
        id: 'prop-003-4',
        type: 'player',
        question: 'Will Endrick score his first World Cup goal?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.30', '0.70'],
        player: 'Endrick',
        team: 'Brazil'
      },
      {
        id: 'prop-003-5',
        type: 'game',
        question: 'Total goals Over/Under 3.5',
        outcomes: ['Over', 'Under'],
        outcomePrices: ['0.42', '0.58']
      },
      {
        id: 'prop-003-6',
        type: 'game',
        question: 'Will there be a goal in stoppage time?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.35', '0.65']
      }
    ]
  },
  {
    id: 'wc2026-004',
    slug: 'argentina-vs-germany',
    homeTeam: 'Argentina',
    homeTeamCode: 'ARG',
    homeTeamFlag: '🇦🇷',
    awayTeam: 'Germany',
    awayTeamCode: 'GER',
    awayTeamFlag: '🇩🇪',
    stage: 'group',
    group: 'D',
    venue: 'SoFi Stadium',
    city: 'Los Angeles',
    kickoff: '2026-06-14T18:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.45',
    drawOdds: '0.28',
    awayWinOdds: '0.27',
    volume: '15200000',
    liquidity: '5800000',
    propBets: [
      {
        id: 'prop-004-1',
        type: 'player',
        question: 'Will Lionel Messi score or assist?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.55', '0.45'],
        player: 'Lionel Messi',
        team: 'Argentina'
      },
      {
        id: 'prop-004-2',
        type: 'player',
        question: 'Will Messi score a free kick goal?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.10', '0.90'],
        player: 'Lionel Messi',
        team: 'Argentina'
      },
      {
        id: 'prop-004-3',
        type: 'player',
        question: 'Will Florian Wirtz score from outside the box?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.15', '0.85'],
        player: 'Florian Wirtz',
        team: 'Germany'
      },
      {
        id: 'prop-004-4',
        type: 'player',
        question: 'Will Jamal Musiala get an assist?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.38', '0.62'],
        player: 'Jamal Musiala',
        team: 'Germany'
      },
      {
        id: 'prop-004-5',
        type: 'game',
        question: 'Will the match go to extra time?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.18', '0.82']
      },
      {
        id: 'prop-004-6',
        type: 'special',
        question: 'Will Messi score in what could be his final World Cup match?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.42', '0.58']
      }
    ]
  },
  {
    id: 'wc2026-005',
    slug: 'spain-vs-netherlands',
    homeTeam: 'Spain',
    homeTeamCode: 'ESP',
    homeTeamFlag: '🇪🇸',
    awayTeam: 'Netherlands',
    awayTeamCode: 'NED',
    awayTeamFlag: '🇳🇱',
    stage: 'group',
    group: 'E',
    venue: 'Hard Rock Stadium',
    city: 'Miami',
    kickoff: '2026-06-15T20:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.42',
    drawOdds: '0.30',
    awayWinOdds: '0.28',
    volume: '6800000',
    liquidity: '2100000',
    propBets: [
      {
        id: 'prop-005-1',
        type: 'player',
        question: 'Will Lamine Yamal score or assist?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.48', '0.52'],
        player: 'Lamine Yamal',
        team: 'Spain'
      },
      {
        id: 'prop-005-2',
        type: 'player',
        question: 'Will Cody Gakpo score?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.35', '0.65'],
        player: 'Cody Gakpo',
        team: 'Netherlands'
      },
      {
        id: 'prop-005-3',
        type: 'game',
        question: 'Total corners Over/Under 9.5',
        outcomes: ['Over', 'Under'],
        outcomePrices: ['0.55', '0.45']
      },
      {
        id: 'prop-005-4',
        type: 'game',
        question: 'Both teams to score in first half?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.28', '0.72']
      }
    ]
  },
  {
    id: 'wc2026-006',
    slug: 'portugal-vs-italy',
    homeTeam: 'Portugal',
    homeTeamCode: 'POR',
    homeTeamFlag: '🇵🇹',
    awayTeam: 'Italy',
    awayTeamCode: 'ITA',
    awayTeamFlag: '🇮🇹',
    stage: 'group',
    group: 'F',
    venue: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    kickoff: '2026-06-16T18:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.40',
    drawOdds: '0.32',
    awayWinOdds: '0.28',
    volume: '7200000',
    liquidity: '2800000',
    propBets: [
      {
        id: 'prop-006-1',
        type: 'player',
        question: 'Will Cristiano Ronaldo score in his 6th World Cup?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.38', '0.62'],
        player: 'Cristiano Ronaldo',
        team: 'Portugal'
      },
      {
        id: 'prop-006-2',
        type: 'player',
        question: 'Will Rafael Leão score or assist?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.42', '0.58'],
        player: 'Rafael Leão',
        team: 'Portugal'
      },
      {
        id: 'prop-006-3',
        type: 'game',
        question: 'Clean sheet for either team?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.45', '0.55']
      },
      {
        id: 'prop-006-4',
        type: 'special',
        question: 'Will Ronaldo celebrate with his iconic "SIUU"?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.38', '0.62']
      }
    ]
  },
  // Tournament Winner Markets
  {
    id: 'wc2026-winner-001',
    slug: 'tournament-winner-france',
    homeTeam: 'France',
    homeTeamCode: 'FRA',
    homeTeamFlag: '🇫🇷',
    awayTeam: 'Tournament',
    awayTeamCode: 'WC',
    awayTeamFlag: '🏆',
    stage: 'final',
    venue: 'MetLife Stadium',
    city: 'New Jersey',
    kickoff: '2026-07-19T20:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.18',
    drawOdds: '0',
    awayWinOdds: '0.82',
    volume: '45000000',
    liquidity: '12000000',
    propBets: []
  },
  {
    id: 'wc2026-winner-002',
    slug: 'tournament-winner-brazil',
    homeTeam: 'Brazil',
    homeTeamCode: 'BRA',
    homeTeamFlag: '🇧🇷',
    awayTeam: 'Tournament',
    awayTeamCode: 'WC',
    awayTeamFlag: '🏆',
    stage: 'final',
    venue: 'MetLife Stadium',
    city: 'New Jersey',
    kickoff: '2026-07-19T20:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.15',
    drawOdds: '0',
    awayWinOdds: '0.85',
    volume: '38000000',
    liquidity: '10000000',
    propBets: []
  },
  {
    id: 'wc2026-winner-003',
    slug: 'tournament-winner-argentina',
    homeTeam: 'Argentina',
    homeTeamCode: 'ARG',
    homeTeamFlag: '🇦🇷',
    awayTeam: 'Tournament',
    awayTeamCode: 'WC',
    awayTeamFlag: '🏆',
    stage: 'final',
    venue: 'MetLife Stadium',
    city: 'New Jersey',
    kickoff: '2026-07-19T20:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.16',
    drawOdds: '0',
    awayWinOdds: '0.84',
    volume: '42000000',
    liquidity: '11000000',
    propBets: []
  },
  {
    id: 'wc2026-winner-004',
    slug: 'tournament-winner-england',
    homeTeam: 'England',
    homeTeamCode: 'ENG',
    homeTeamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    awayTeam: 'Tournament',
    awayTeamCode: 'WC',
    awayTeamFlag: '🏆',
    stage: 'final',
    venue: 'MetLife Stadium',
    city: 'New Jersey',
    kickoff: '2026-07-19T20:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.12',
    drawOdds: '0',
    awayWinOdds: '0.88',
    volume: '28000000',
    liquidity: '8000000',
    propBets: []
  }
]

// Golden Boot contenders
const goldenBootMarkets: Match[] = [
  {
    id: 'wc2026-gb-001',
    slug: 'golden-boot-mbappe',
    homeTeam: 'Kylian Mbappé',
    homeTeamCode: 'FRA',
    homeTeamFlag: '🇫🇷',
    awayTeam: 'Golden Boot',
    awayTeamCode: 'GB',
    awayTeamFlag: '👟',
    stage: 'final',
    venue: 'Tournament Wide',
    city: 'USA/Mexico/Canada',
    kickoff: '2026-07-19T20:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.22',
    drawOdds: '0',
    awayWinOdds: '0.78',
    volume: '18000000',
    liquidity: '5500000',
    propBets: [
      {
        id: 'prop-gb-001-1',
        type: 'player',
        question: 'Will Mbappé score 5+ goals in the tournament?',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.35', '0.65'],
        player: 'Kylian Mbappé',
        team: 'France'
      }
    ]
  },
  {
    id: 'wc2026-gb-002',
    slug: 'golden-boot-haaland',
    homeTeam: 'Erling Haaland',
    homeTeamCode: 'NOR',
    homeTeamFlag: '🇳🇴',
    awayTeam: 'Golden Boot',
    awayTeamCode: 'GB',
    awayTeamFlag: '👟',
    stage: 'final',
    venue: 'Tournament Wide',
    city: 'USA/Mexico/Canada',
    kickoff: '2026-07-19T20:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.18',
    drawOdds: '0',
    awayWinOdds: '0.82',
    volume: '15000000',
    liquidity: '4800000',
    propBets: []
  },
  {
    id: 'wc2026-gb-003',
    slug: 'golden-boot-kane',
    homeTeam: 'Harry Kane',
    homeTeamCode: 'ENG',
    homeTeamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    awayTeam: 'Golden Boot',
    awayTeamCode: 'GB',
    awayTeamFlag: '👟',
    stage: 'final',
    venue: 'Tournament Wide',
    city: 'USA/Mexico/Canada',
    kickoff: '2026-07-19T20:00:00Z',
    status: 'upcoming',
    homeWinOdds: '0.14',
    drawOdds: '0',
    awayWinOdds: '0.86',
    volume: '12000000',
    liquidity: '3800000',
    propBets: []
  }
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    const stage = searchParams.get('stage') || '' // group, knockout, final
    const category = searchParams.get('category') || '' // matches, winners, golden-boot
    const matchId = searchParams.get('matchId') || '' // For fetching specific match with props
    
    let results: Match[] = []
    
    // If requesting a specific match (for prop bets modal)
    if (matchId) {
      const allMatches = [...worldCupMatches, ...goldenBootMarkets]
      const match = allMatches.find(m => m.id === matchId)
      if (match) {
        return NextResponse.json(match, {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        })
      }
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    
    // Filter by category
    if (category === 'golden-boot') {
      results = goldenBootMarkets
    } else if (category === 'winners') {
      results = worldCupMatches.filter(m => m.slug.startsWith('tournament-winner'))
    } else {
      // Default: group stage matches
      results = worldCupMatches.filter(m => !m.slug.startsWith('tournament-winner'))
    }
    
    // Filter by stage if specified
    if (stage) {
      results = results.filter(m => m.stage === stage)
    }
    
    // Apply limit
    results = results.slice(0, limit)

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('Error fetching World Cup markets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    )
  }
}
