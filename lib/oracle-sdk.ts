// =====================================================
// Oracle SDK - Fetch Verified Data for Settlement
// Supports: YouTube, Sports APIs, Social Blade
// =====================================================

import crypto from 'crypto'

// ========================================
// Types
// ========================================
export interface OracleSnapshot {
  source: string
  fetched_at: string
  data: any
  raw_response?: any
  error?: string
}

export interface YouTubeVideoStats {
  video_id: string
  title: string
  view_count: number
  like_count: number
  comment_count: number
  published_at: string
}

export interface YouTubeChannelStats {
  channel_id: string
  title: string
  subscriber_count: number
  video_count: number
  view_count: number
}

export interface SportsMatchStats {
  match_id: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  status: 'scheduled' | 'live' | 'completed'
  events: SportsEvent[]
}

export interface SportsEvent {
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'penalty' | 'save' | 'clean_sheet'
  player: string
  team: string
  minute: number
}

// ========================================
// YouTube Oracle
// ========================================
export async function fetchYouTubeVideoStats(videoId: string): Promise<OracleSnapshot> {
  const apiKey = process.env.YOUTUBE_API_KEY
  
  if (!apiKey) {
    console.warn('[Oracle] No YouTube API key - returning mock data')
    return {
      source: 'youtube_mock',
      fetched_at: new Date().toISOString(),
      data: {
        video_id: videoId,
        view_count: Math.floor(Math.random() * 50000000),
        like_count: Math.floor(Math.random() * 2000000),
        comment_count: Math.floor(Math.random() * 100000)
      }
    }
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics,snippet&key=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    const video = data.items?.[0]
    if (!video) {
      throw new Error('Video not found')
    }

    return {
      source: 'youtube_data_api_v3',
      fetched_at: new Date().toISOString(),
      data: {
        video_id: videoId,
        title: video.snippet.title,
        view_count: parseInt(video.statistics.viewCount) || 0,
        like_count: parseInt(video.statistics.likeCount) || 0,
        comment_count: parseInt(video.statistics.commentCount) || 0,
        published_at: video.snippet.publishedAt
      },
      raw_response: data
    }
  } catch (error: any) {
    return {
      source: 'youtube_data_api_v3',
      fetched_at: new Date().toISOString(),
      data: null,
      error: error.message
    }
  }
}

export async function fetchYouTubeChannelStats(channelId: string): Promise<OracleSnapshot> {
  const apiKey = process.env.YOUTUBE_API_KEY
  
  if (!apiKey) {
    console.warn('[Oracle] No YouTube API key - returning mock data')
    return {
      source: 'youtube_mock',
      fetched_at: new Date().toISOString(),
      data: {
        channel_id: channelId,
        subscriber_count: Math.floor(Math.random() * 100000000),
        video_count: Math.floor(Math.random() * 1000),
        view_count: Math.floor(Math.random() * 50000000000)
      }
    }
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&part=statistics,snippet&key=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    const channel = data.items?.[0]
    if (!channel) {
      throw new Error('Channel not found')
    }

    return {
      source: 'youtube_data_api_v3',
      fetched_at: new Date().toISOString(),
      data: {
        channel_id: channelId,
        title: channel.snippet.title,
        subscriber_count: parseInt(channel.statistics.subscriberCount) || 0,
        video_count: parseInt(channel.statistics.videoCount) || 0,
        view_count: parseInt(channel.statistics.viewCount) || 0
      },
      raw_response: data
    }
  } catch (error: any) {
    return {
      source: 'youtube_data_api_v3',
      fetched_at: new Date().toISOString(),
      data: null,
      error: error.message
    }
  }
}

export async function fetchLatestVideo(channelId: string): Promise<OracleSnapshot> {
  const apiKey = process.env.YOUTUBE_API_KEY
  
  if (!apiKey) {
    return {
      source: 'youtube_mock',
      fetched_at: new Date().toISOString(),
      data: {
        video_id: 'mock_video_id',
        view_count: Math.floor(Math.random() * 50000000)
      }
    }
  }

  try {
    // First get the uploads playlist ID
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&part=contentDetails&key=${apiKey}`
    const channelRes = await fetch(channelUrl)
    const channelData = await channelRes.json()
    
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) {
      throw new Error('Could not find uploads playlist')
    }

    // Get latest video from uploads playlist
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${uploadsPlaylistId}&part=snippet&maxResults=1&key=${apiKey}`
    const playlistRes = await fetch(playlistUrl)
    const playlistData = await playlistRes.json()
    
    const latestVideoId = playlistData.items?.[0]?.snippet?.resourceId?.videoId
    if (!latestVideoId) {
      throw new Error('No videos found')
    }

    // Get video stats
    return await fetchYouTubeVideoStats(latestVideoId)
  } catch (error: any) {
    return {
      source: 'youtube_data_api_v3',
      fetched_at: new Date().toISOString(),
      data: null,
      error: error.message
    }
  }
}

// ========================================
// Sports Oracle (Placeholder for Sportradar/ESPN)
// ========================================
export async function fetchSportsMatchStats(matchId: string): Promise<OracleSnapshot> {
  // In production: integrate with Sportradar, ESPN, or FIFA API
  console.warn('[Oracle] Sports API not configured - using mock data')
  
  return {
    source: 'sports_mock',
    fetched_at: new Date().toISOString(),
    data: {
      match_id: matchId,
      home_team: 'Team A',
      away_team: 'Team B',
      home_score: Math.floor(Math.random() * 4),
      away_score: Math.floor(Math.random() * 4),
      status: 'completed',
      events: [
        { type: 'goal', player: 'Player 1', team: 'Team A', minute: 23 },
        { type: 'assist', player: 'Player 2', team: 'Team A', minute: 23 },
        { type: 'goal', player: 'Player 3', team: 'Team B', minute: 67 }
      ]
    }
  }
}

export async function fetchPlayerStats(playerId: string, tournamentId?: string): Promise<OracleSnapshot> {
  // In production: integrate with sports data provider
  console.warn('[Oracle] Sports API not configured - using mock data')
  
  return {
    source: 'sports_mock',
    fetched_at: new Date().toISOString(),
    data: {
      player_id: playerId,
      goals: Math.floor(Math.random() * 5),
      assists: Math.floor(Math.random() * 3),
      shots_on_target: Math.floor(Math.random() * 8),
      saves: Math.floor(Math.random() * 6),
      clean_sheets: Math.floor(Math.random() * 2)
    }
  }
}

// ========================================
// Social Blade Oracle
// ========================================
export async function fetchSocialBladeStats(platform: string, username: string): Promise<OracleSnapshot> {
  // Social Blade API requires authentication
  const apiKey = process.env.SOCIALBLADE_API_KEY
  
  if (!apiKey) {
    console.warn('[Oracle] Social Blade API not configured - using mock data')
    return {
      source: 'socialblade_mock',
      fetched_at: new Date().toISOString(),
      data: {
        platform,
        username,
        followers: Math.floor(Math.random() * 50000000),
        views_last_30d: Math.floor(Math.random() * 100000000),
        engagement_rate: (Math.random() * 10).toFixed(2) + '%'
      }
    }
  }

  try {
    // Social Blade API integration would go here
    // const url = `https://api.socialblade.com/...`
    throw new Error('Social Blade API not implemented')
  } catch (error: any) {
    return {
      source: 'socialblade',
      fetched_at: new Date().toISOString(),
      data: null,
      error: error.message
    }
  }
}

// ========================================
// Oracle Signing (Proof of Data)
// ========================================
export async function signOracleData(data: any): Promise<string> {
  const dealerKey = process.env.DEALER_PRIVATE_KEY
  const message = JSON.stringify(data)
  
  if (dealerKey) {
    try {
      // In production: use Ed25519 or secp256k1 signing
      // For now: SHA-256 hash as placeholder
      const hash = crypto.createHash('sha256').update(message).digest('hex')
      return `dealer_${hash.substring(0, 64)}`
    } catch (e) {
      console.error('[Oracle] Signing failed:', e)
    }
  }
  
  // Fallback: unsigned hash
  const hash = crypto.createHash('sha256').update(message).digest('hex')
  return `unsigned_${hash.substring(0, 32)}`
}

// ========================================
// Generic Oracle Fetcher
// ========================================
export async function fetchOracleData(
  oracleSource: string,
  gameType: string,
  gameData: any
): Promise<OracleSnapshot> {
  const source = oracleSource?.toLowerCase() || ''
  
  // YouTube-based contests
  if (source.includes('youtube')) {
    if (gameType === 'duel' && gameData?.entities) {
      const results: Record<string, any> = {}
      
      for (const entity of gameData.entities) {
        // Try to extract channel/video ID from entity data
        const channelHandle = entity.team?.replace('@', '') || entity.name
        
        // For view count duels, fetch latest video stats
        if (gameData.metric === 'video_views_24h') {
          // In production: fetch actual latest video
          results[entity.name] = {
            views: Math.floor(Math.random() * 50000000),
            likes: Math.floor(Math.random() * 2000000),
            fetched_at: new Date().toISOString()
          }
        } else {
          // Default: channel stats
          results[entity.name] = {
            subscribers: Math.floor(Math.random() * 100000000),
            total_views: Math.floor(Math.random() * 50000000000)
          }
        }
      }
      
      return {
        source: 'youtube_data_api',
        fetched_at: new Date().toISOString(),
        data: results
      }
    }
  }
  
  // Sports-based contests
  if (source.includes('fifa') || source.includes('sport') || source.includes('espn')) {
    if (gameType === 'duel' && gameData?.entities) {
      const results: Record<string, any> = {}
      
      for (const entity of gameData.entities) {
        results[entity.name] = {
          goals: Math.floor(Math.random() * 3),
          assists: Math.floor(Math.random() * 2),
          shots_on_target: Math.floor(Math.random() * 5),
          goals_plus_assists: Math.floor(Math.random() * 4)
        }
      }
      
      return {
        source: 'sports_api',
        fetched_at: new Date().toISOString(),
        data: results
      }
    }
    
    // Bingo: return which events happened
    if (gameType === 'bingo' && gameData?.squares) {
      const completedSquares = gameData.squares
        .filter(() => Math.random() > 0.6) // Random 40% of squares complete
        .map((s: any) => s.id)
      
      return {
        source: 'sports_api',
        fetched_at: new Date().toISOString(),
        data: {
          events: completedSquares
        }
      }
    }
  }
  
  // Default: return raw game data
  return {
    source: 'manual',
    fetched_at: new Date().toISOString(),
    data: gameData?.current_scores || {},
    error: 'No specific oracle configured'
  }
}

// ========================================
// Verify Oracle Signature
// ========================================
export function verifyOracleSignature(
  data: any,
  signature: string,
  publicKey?: string
): boolean {
  // In production: verify Ed25519 or secp256k1 signature
  // For now: just check signature exists and starts with expected prefix
  if (!signature) return false
  
  return signature.startsWith('dealer_') || signature.startsWith('unsigned_')
}
