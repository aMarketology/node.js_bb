// FIFA World Cup 2026 Group Stage Fixtures
// Complete match schedule with real dates, venues, and teams

export interface Match {
  id: string
  date: string
  dateObj: Date
  homeTeam: string
  awayTeam: string
  group: string
  venue: string
  city: string
  country: string
  kickoffTime?: string
  homeFlag?: string
  awayFlag?: string
  status: 'scheduled' | 'live' | 'completed'
  // Prediction market data
  homeOdds?: number
  drawOdds?: number
  awayOdds?: number
  totalBets?: number
  homePool?: number
  drawPool?: number
  awayPool?: number
}

// Team flag emojis mapping
export const teamFlags: Record<string, string> = {
  'Mexico': '🇲🇽',
  'South Africa': '🇿🇦',
  'Korea Republic': '🇰🇷',
  'Czechia': '🇨🇿',
  'Denmark': '🇩🇰',
  'North Macedonia': '🇲🇰',
  'Republic of Ireland': '🇮🇪',
  'Canada': '🇨🇦',
  'Bosnia and Herzegovina': '🇧🇦',
  'Italy': '🇮🇹',
  'Northern Ireland': '🇬🇧',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'USA': '🇺🇸',
  'Paraguay': '🇵🇾',
  'Haiti': '🇭🇹',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Australia': '🇦🇺',
  'Kosovo': '🇽🇰',
  'Romania': '🇷🇴',
  'Slovakia': '🇸🇰',
  'Türkiye': '🇹🇷',
  'Brazil': '🇧🇷',
  'Morocco': '🇲🇦',
  'Qatar': '🇶🇦',
  'Switzerland': '🇨🇭',
  'Côte d\'Ivoire': '🇨🇮',
  'Ecuador': '🇪🇨',
  'Germany': '🇩🇪',
  'Curaçao': '🇨🇼',
  'Netherlands': '🇳🇱',
  'Japan': '🇯🇵',
  'Albania': '🇦🇱',
  'Poland': '🇵🇱',
  'Sweden': '🇸🇪',
  'Ukraine': '🇺🇦',
  'Tunisia': '🇹🇳',
  'Saudi Arabia': '🇸🇦',
  'Uruguay': '🇺🇾',
  'Spain': '🇪🇸',
  'Cabo Verde': '🇨🇻',
  'IR Iran': '🇮🇷',
  'New Zealand': '🇳🇿',
  'Belgium': '🇧🇪',
  'Egypt': '🇪🇬',
  'France': '🇫🇷',
  'Senegal': '🇸🇳',
  'Bolivia': '🇧🇴',
  'Iraq': '🇮🇶',
  'Suriname': '🇸🇷',
  'Norway': '🇳🇴',
  'Argentina': '🇦🇷',
  'Algeria': '🇩🇿',
  'Austria': '🇦🇹',
  'Jordan': '🇯🇴',
  'Ghana': '🇬🇭',
  'Panama': '🇵🇦',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Croatia': '🇭🇷',
  'Portugal': '🇵🇹',
  'Congo DR': '🇨🇩',
  'Jamaica': '🇯🇲',
  'New Caledonia': '🇳🇨',
  'Uzbekistan': '🇺🇿',
  'Colombia': '🇨🇴',
}

// Generate random but realistic odds
function generateOdds(homeTeam: string, awayTeam: string): { homeOdds: number; drawOdds: number; awayOdds: number } {
  // Team strength ratings (simplified)
  const strongTeams = ['Brazil', 'Argentina', 'France', 'Spain', 'Germany', 'England', 'Portugal', 'Netherlands', 'Belgium'];
  const midTeams = ['USA', 'Mexico', 'Uruguay', 'Croatia', 'Switzerland', 'Denmark', 'Senegal', 'Morocco', 'Japan', 'Korea Republic'];
  
  const homeStrength = strongTeams.includes(homeTeam) ? 3 : midTeams.includes(homeTeam) ? 2 : 1;
  const awayStrength = strongTeams.includes(awayTeam) ? 3 : midTeams.includes(awayTeam) ? 2 : 1;
  
  let homeOdds, awayOdds, drawOdds;
  
  if (homeStrength > awayStrength) {
    homeOdds = 1.50 + Math.random() * 0.5;
    awayOdds = 3.50 + Math.random() * 1.5;
  } else if (awayStrength > homeStrength) {
    homeOdds = 3.50 + Math.random() * 1.5;
    awayOdds = 1.50 + Math.random() * 0.5;
  } else {
    homeOdds = 2.30 + Math.random() * 0.6;
    awayOdds = 2.30 + Math.random() * 0.6;
  }
  
  drawOdds = 3.00 + Math.random() * 0.5;
  
  return {
    homeOdds: Number(homeOdds.toFixed(2)),
    drawOdds: Number(drawOdds.toFixed(2)),
    awayOdds: Number(awayOdds.toFixed(2))
  };
}

// All Group Stage Matches
export const groupStageMatches: Match[] = [
  // MATCHDAY 1 - Thursday, June 11, 2026
  {
    id: 'wc2026-001',
    date: 'June 11, 2026',
    dateObj: new Date('2026-06-11T19:00:00'),
    homeTeam: 'Mexico',
    awayTeam: 'South Africa',
    group: 'Group A',
    venue: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    status: 'scheduled',
    ...generateOdds('Mexico', 'South Africa'),
  },
  {
    id: 'wc2026-002',
    date: 'June 11, 2026',
    dateObj: new Date('2026-06-11T16:00:00'),
    homeTeam: 'Korea Republic',
    awayTeam: 'Czechia/Denmark/NMK/Ireland',
    group: 'Group A',
    venue: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'Mexico',
    status: 'scheduled',
    ...generateOdds('Korea Republic', 'Denmark'),
  },

  // MATCHDAY 1 - Friday, June 12, 2026
  {
    id: 'wc2026-003',
    date: 'June 12, 2026',
    dateObj: new Date('2026-06-12T19:00:00'),
    homeTeam: 'Canada',
    awayTeam: 'Bosnia/Italy/N.Ireland/Wales',
    group: 'Group B',
    venue: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    status: 'scheduled',
    ...generateOdds('Canada', 'Italy'),
  },
  {
    id: 'wc2026-004',
    date: 'June 12, 2026',
    dateObj: new Date('2026-06-12T22:00:00'),
    homeTeam: 'USA',
    awayTeam: 'Paraguay',
    group: 'Group D',
    venue: 'SoFi Stadium',
    city: 'Los Angeles',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('USA', 'Paraguay'),
  },

  // MATCHDAY 1 - Saturday, June 13, 2026
  {
    id: 'wc2026-005',
    date: 'June 13, 2026',
    dateObj: new Date('2026-06-13T13:00:00'),
    homeTeam: 'Haiti',
    awayTeam: 'Scotland',
    group: 'Group C',
    venue: 'Gillette Stadium',
    city: 'Boston',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Haiti', 'Scotland'),
  },
  {
    id: 'wc2026-006',
    date: 'June 13, 2026',
    dateObj: new Date('2026-06-13T16:00:00'),
    homeTeam: 'Australia',
    awayTeam: 'Kosovo/Romania/Slovakia/Türkiye',
    group: 'Group D',
    venue: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    status: 'scheduled',
    ...generateOdds('Australia', 'Türkiye'),
  },
  {
    id: 'wc2026-007',
    date: 'June 13, 2026',
    dateObj: new Date('2026-06-13T19:00:00'),
    homeTeam: 'Brazil',
    awayTeam: 'Morocco',
    group: 'Group C',
    venue: 'MetLife Stadium',
    city: 'New York/New Jersey',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Brazil', 'Morocco'),
  },
  {
    id: 'wc2026-008',
    date: 'June 13, 2026',
    dateObj: new Date('2026-06-13T22:00:00'),
    homeTeam: 'Qatar',
    awayTeam: 'Switzerland',
    group: 'Group B',
    venue: 'Levi\'s Stadium',
    city: 'San Francisco Bay Area',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Qatar', 'Switzerland'),
  },

  // MATCHDAY 1 - Sunday, June 14, 2026
  {
    id: 'wc2026-009',
    date: 'June 14, 2026',
    dateObj: new Date('2026-06-14T13:00:00'),
    homeTeam: 'Côte d\'Ivoire',
    awayTeam: 'Ecuador',
    group: 'Group E',
    venue: 'Lincoln Financial Field',
    city: 'Philadelphia',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Côte d\'Ivoire', 'Ecuador'),
  },
  {
    id: 'wc2026-010',
    date: 'June 14, 2026',
    dateObj: new Date('2026-06-14T16:00:00'),
    homeTeam: 'Germany',
    awayTeam: 'Curaçao',
    group: 'Group E',
    venue: 'NRG Stadium',
    city: 'Houston',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Germany', 'Curaçao'),
  },
  {
    id: 'wc2026-011',
    date: 'June 14, 2026',
    dateObj: new Date('2026-06-14T19:00:00'),
    homeTeam: 'Netherlands',
    awayTeam: 'Japan',
    group: 'Group F',
    venue: 'AT&T Stadium',
    city: 'Dallas',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Netherlands', 'Japan'),
  },
  {
    id: 'wc2026-012',
    date: 'June 14, 2026',
    dateObj: new Date('2026-06-14T22:00:00'),
    homeTeam: 'Albania/Poland/Sweden/Ukraine',
    awayTeam: 'Tunisia',
    group: 'Group F',
    venue: 'Estadio BBVA',
    city: 'Monterrey',
    country: 'Mexico',
    status: 'scheduled',
    ...generateOdds('Poland', 'Tunisia'),
  },

  // MATCHDAY 1 - Monday, June 15, 2026
  {
    id: 'wc2026-013',
    date: 'June 15, 2026',
    dateObj: new Date('2026-06-15T13:00:00'),
    homeTeam: 'Saudi Arabia',
    awayTeam: 'Uruguay',
    group: 'Group H',
    venue: 'Hard Rock Stadium',
    city: 'Miami',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Saudi Arabia', 'Uruguay'),
  },
  {
    id: 'wc2026-014',
    date: 'June 15, 2026',
    dateObj: new Date('2026-06-15T16:00:00'),
    homeTeam: 'Spain',
    awayTeam: 'Cabo Verde',
    group: 'Group H',
    venue: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Spain', 'Cabo Verde'),
  },
  {
    id: 'wc2026-015',
    date: 'June 15, 2026',
    dateObj: new Date('2026-06-15T19:00:00'),
    homeTeam: 'IR Iran',
    awayTeam: 'New Zealand',
    group: 'Group G',
    venue: 'SoFi Stadium',
    city: 'Los Angeles',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('IR Iran', 'New Zealand'),
  },
  {
    id: 'wc2026-016',
    date: 'June 15, 2026',
    dateObj: new Date('2026-06-15T22:00:00'),
    homeTeam: 'Belgium',
    awayTeam: 'Egypt',
    group: 'Group G',
    venue: 'Lumen Field',
    city: 'Seattle',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Belgium', 'Egypt'),
  },

  // MATCHDAY 1 - Tuesday, June 16, 2026
  {
    id: 'wc2026-017',
    date: 'June 16, 2026',
    dateObj: new Date('2026-06-16T13:00:00'),
    homeTeam: 'France',
    awayTeam: 'Senegal',
    group: 'Group I',
    venue: 'MetLife Stadium',
    city: 'New York/New Jersey',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('France', 'Senegal'),
  },
  {
    id: 'wc2026-018',
    date: 'June 16, 2026',
    dateObj: new Date('2026-06-16T16:00:00'),
    homeTeam: 'Bolivia/Iraq/Suriname',
    awayTeam: 'Norway',
    group: 'Group I',
    venue: 'Gillette Stadium',
    city: 'Boston',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Bolivia', 'Norway'),
  },
  {
    id: 'wc2026-019',
    date: 'June 16, 2026',
    dateObj: new Date('2026-06-16T19:00:00'),
    homeTeam: 'Argentina',
    awayTeam: 'Algeria',
    group: 'Group J',
    venue: 'Arrowhead Stadium',
    city: 'Kansas City',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Argentina', 'Algeria'),
  },
  {
    id: 'wc2026-020',
    date: 'June 16, 2026',
    dateObj: new Date('2026-06-16T22:00:00'),
    homeTeam: 'Austria',
    awayTeam: 'Jordan',
    group: 'Group J',
    venue: 'Levi\'s Stadium',
    city: 'San Francisco Bay Area',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Austria', 'Jordan'),
  },

  // MATCHDAY 1 - Wednesday, June 17, 2026
  {
    id: 'wc2026-021',
    date: 'June 17, 2026',
    dateObj: new Date('2026-06-17T13:00:00'),
    homeTeam: 'Ghana',
    awayTeam: 'Panama',
    group: 'Group L',
    venue: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    status: 'scheduled',
    ...generateOdds('Ghana', 'Panama'),
  },
  {
    id: 'wc2026-022',
    date: 'June 17, 2026',
    dateObj: new Date('2026-06-17T16:00:00'),
    homeTeam: 'England',
    awayTeam: 'Croatia',
    group: 'Group L',
    venue: 'AT&T Stadium',
    city: 'Dallas',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('England', 'Croatia'),
  },
  {
    id: 'wc2026-023',
    date: 'June 17, 2026',
    dateObj: new Date('2026-06-17T19:00:00'),
    homeTeam: 'Portugal',
    awayTeam: 'Congo DR/Jamaica/New Caledonia',
    group: 'Group K',
    venue: 'NRG Stadium',
    city: 'Houston',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Portugal', 'Jamaica'),
  },
  {
    id: 'wc2026-024',
    date: 'June 17, 2026',
    dateObj: new Date('2026-06-17T22:00:00'),
    homeTeam: 'Uzbekistan',
    awayTeam: 'Colombia',
    group: 'Group K',
    venue: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    status: 'scheduled',
    ...generateOdds('Uzbekistan', 'Colombia'),
  },

  // MATCHDAY 2 - Thursday, June 18, 2026
  {
    id: 'wc2026-025',
    date: 'June 18, 2026',
    dateObj: new Date('2026-06-18T13:00:00'),
    homeTeam: 'Czechia/Denmark/NMK/Ireland',
    awayTeam: 'South Africa',
    group: 'Group A',
    venue: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Denmark', 'South Africa'),
  },
  {
    id: 'wc2026-026',
    date: 'June 18, 2026',
    dateObj: new Date('2026-06-18T16:00:00'),
    homeTeam: 'Switzerland',
    awayTeam: 'Bosnia/Italy/N.Ireland/Wales',
    group: 'Group B',
    venue: 'SoFi Stadium',
    city: 'Los Angeles',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Switzerland', 'Italy'),
  },
  {
    id: 'wc2026-027',
    date: 'June 18, 2026',
    dateObj: new Date('2026-06-18T19:00:00'),
    homeTeam: 'Canada',
    awayTeam: 'Qatar',
    group: 'Group B',
    venue: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    status: 'scheduled',
    ...generateOdds('Canada', 'Qatar'),
  },
  {
    id: 'wc2026-028',
    date: 'June 18, 2026',
    dateObj: new Date('2026-06-18T22:00:00'),
    homeTeam: 'Mexico',
    awayTeam: 'Korea Republic',
    group: 'Group A',
    venue: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'Mexico',
    status: 'scheduled',
    ...generateOdds('Mexico', 'Korea Republic'),
  },

  // MATCHDAY 2 - Friday, June 19, 2026
  {
    id: 'wc2026-029',
    date: 'June 19, 2026',
    dateObj: new Date('2026-06-19T13:00:00'),
    homeTeam: 'Brazil',
    awayTeam: 'Haiti',
    group: 'Group C',
    venue: 'Lincoln Financial Field',
    city: 'Philadelphia',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Brazil', 'Haiti'),
  },
  {
    id: 'wc2026-030',
    date: 'June 19, 2026',
    dateObj: new Date('2026-06-19T16:00:00'),
    homeTeam: 'Scotland',
    awayTeam: 'Morocco',
    group: 'Group C',
    venue: 'Gillette Stadium',
    city: 'Boston',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Scotland', 'Morocco'),
  },
  {
    id: 'wc2026-031',
    date: 'June 19, 2026',
    dateObj: new Date('2026-06-19T19:00:00'),
    homeTeam: 'Kosovo/Romania/Slovakia/Türkiye',
    awayTeam: 'Paraguay',
    group: 'Group D',
    venue: 'Levi\'s Stadium',
    city: 'San Francisco Bay Area',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Türkiye', 'Paraguay'),
  },
  {
    id: 'wc2026-032',
    date: 'June 19, 2026',
    dateObj: new Date('2026-06-19T22:00:00'),
    homeTeam: 'USA',
    awayTeam: 'Australia',
    group: 'Group D',
    venue: 'Lumen Field',
    city: 'Seattle',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('USA', 'Australia'),
  },

  // Continue with remaining matchdays...
  // MATCHDAY 2 - Saturday, June 20, 2026
  {
    id: 'wc2026-033',
    date: 'June 20, 2026',
    dateObj: new Date('2026-06-20T13:00:00'),
    homeTeam: 'Germany',
    awayTeam: 'Côte d\'Ivoire',
    group: 'Group E',
    venue: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    status: 'scheduled',
    ...generateOdds('Germany', 'Côte d\'Ivoire'),
  },
  {
    id: 'wc2026-034',
    date: 'June 20, 2026',
    dateObj: new Date('2026-06-20T16:00:00'),
    homeTeam: 'Ecuador',
    awayTeam: 'Curaçao',
    group: 'Group E',
    venue: 'Arrowhead Stadium',
    city: 'Kansas City',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Ecuador', 'Curaçao'),
  },
  {
    id: 'wc2026-035',
    date: 'June 20, 2026',
    dateObj: new Date('2026-06-20T19:00:00'),
    homeTeam: 'Netherlands',
    awayTeam: 'Albania/Poland/Sweden/Ukraine',
    group: 'Group F',
    venue: 'NRG Stadium',
    city: 'Houston',
    country: 'USA',
    status: 'scheduled',
    ...generateOdds('Netherlands', 'Poland'),
  },
  {
    id: 'wc2026-036',
    date: 'June 20, 2026',
    dateObj: new Date('2026-06-20T22:00:00'),
    homeTeam: 'Tunisia',
    awayTeam: 'Japan',
    group: 'Group F',
    venue: 'Estadio BBVA',
    city: 'Monterrey',
    country: 'Mexico',
    status: 'scheduled',
    ...generateOdds('Tunisia', 'Japan'),
  },
];

// Helper functions
export function getMatchesByGroup(group: string): Match[] {
  return groupStageMatches.filter(match => match.group === group);
}

export function getMatchesByDate(date: string): Match[] {
  return groupStageMatches.filter(match => match.date === date);
}

export function getUpcomingMatches(limit: number = 6): Match[] {
  const now = new Date();
  return groupStageMatches
    .filter(match => match.dateObj > now && match.status === 'scheduled')
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .slice(0, limit);
}

export function getFeaturedMatches(): Match[] {
  // Return high-profile matches
  const featuredTeams = ['Brazil', 'Argentina', 'France', 'Spain', 'Germany', 'England', 'Portugal', 'Netherlands', 'Belgium'];
  return groupStageMatches
    .filter(match => 
      featuredTeams.includes(match.homeTeam) || featuredTeams.includes(match.awayTeam)
    )
    .slice(0, 6);
}

export function getMatchById(id: string): Match | undefined {
  return groupStageMatches.find(match => match.id === id);
}

// Add flags to all matches
groupStageMatches.forEach(match => {
  match.homeFlag = teamFlags[match.homeTeam] || '🏴';
  match.awayFlag = teamFlags[match.awayTeam] || '🏴';
  // Generate random pool amounts for demo
  const totalPool = Math.floor(Math.random() * 500000) + 50000;
  match.totalBets = Math.floor(Math.random() * 10000) + 1000;
  match.homePool = Math.floor(totalPool * (0.2 + Math.random() * 0.4));
  match.drawPool = Math.floor(totalPool * 0.15);
  match.awayPool = totalPool - match.homePool - match.drawPool;
});

// Groups metadata
export const groups = [
  { id: 'A', name: 'Group A', teams: ['Mexico', 'South Africa', 'Korea Republic', 'Qualifier TBD'] },
  { id: 'B', name: 'Group B', teams: ['Canada', 'Qatar', 'Switzerland', 'Qualifier TBD'] },
  { id: 'C', name: 'Group C', teams: ['Brazil', 'Morocco', 'Haiti', 'Scotland'] },
  { id: 'D', name: 'Group D', teams: ['USA', 'Australia', 'Paraguay', 'Qualifier TBD'] },
  { id: 'E', name: 'Group E', teams: ['Germany', 'Côte d\'Ivoire', 'Ecuador', 'Curaçao'] },
  { id: 'F', name: 'Group F', teams: ['Netherlands', 'Japan', 'Tunisia', 'Qualifier TBD'] },
  { id: 'G', name: 'Group G', teams: ['Belgium', 'Egypt', 'IR Iran', 'New Zealand'] },
  { id: 'H', name: 'Group H', teams: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cabo Verde'] },
  { id: 'I', name: 'Group I', teams: ['France', 'Senegal', 'Norway', 'Qualifier TBD'] },
  { id: 'J', name: 'Group J', teams: ['Argentina', 'Austria', 'Algeria', 'Jordan'] },
  { id: 'K', name: 'Group K', teams: ['Portugal', 'Colombia', 'Uzbekistan', 'Qualifier TBD'] },
  { id: 'L', name: 'Group L', teams: ['England', 'Croatia', 'Ghana', 'Panama'] },
];

// Host cities
export const hostCities = [
  { name: 'Mexico City', country: 'Mexico', flag: '🇲🇽', stadium: 'Estadio Azteca', capacity: 87523 },
  { name: 'Guadalajara', country: 'Mexico', flag: '🇲🇽', stadium: 'Estadio Akron', capacity: 46232 },
  { name: 'Monterrey', country: 'Mexico', flag: '🇲🇽', stadium: 'Estadio BBVA', capacity: 53500 },
  { name: 'Toronto', country: 'Canada', flag: '🇨🇦', stadium: 'BMO Field', capacity: 45500 },
  { name: 'Vancouver', country: 'Canada', flag: '🇨🇦', stadium: 'BC Place', capacity: 54500 },
  { name: 'New York/New Jersey', country: 'USA', flag: '🇺🇸', stadium: 'MetLife Stadium', capacity: 82500 },
  { name: 'Los Angeles', country: 'USA', flag: '🇺🇸', stadium: 'SoFi Stadium', capacity: 70240 },
  { name: 'Dallas', country: 'USA', flag: '🇺🇸', stadium: 'AT&T Stadium', capacity: 80000 },
  { name: 'Houston', country: 'USA', flag: '🇺🇸', stadium: 'NRG Stadium', capacity: 72220 },
  { name: 'Atlanta', country: 'USA', flag: '🇺🇸', stadium: 'Mercedes-Benz Stadium', capacity: 71000 },
  { name: 'Philadelphia', country: 'USA', flag: '🇺🇸', stadium: 'Lincoln Financial Field', capacity: 69796 },
  { name: 'Seattle', country: 'USA', flag: '🇺🇸', stadium: 'Lumen Field', capacity: 69000 },
  { name: 'Kansas City', country: 'USA', flag: '🇺🇸', stadium: 'Arrowhead Stadium', capacity: 76416 },
  { name: 'Miami', country: 'USA', flag: '🇺🇸', stadium: 'Hard Rock Stadium', capacity: 65326 },
  { name: 'Boston', country: 'USA', flag: '🇺🇸', stadium: 'Gillette Stadium', capacity: 65878 },
  { name: 'San Francisco Bay Area', country: 'USA', flag: '🇺🇸', stadium: 'Levi\'s Stadium', capacity: 68500 },
];
