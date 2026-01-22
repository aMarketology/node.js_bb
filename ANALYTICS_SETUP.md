# Advanced Analytics Implementation Guide

## Setup Instructions

### 1. Environment Variables

Add to your `.env.local` file:

```env
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Get Google Analytics ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for your website
3. Copy the Measurement ID (starts with `G-`)
4. Add it to your `.env.local` file

### 3. Run Database Migrations

```bash
# Push migration to Supabase
npx supabase db push

# Or if using Supabase CLI
supabase migration up
```

This will create:
- `analytics_events` - All user events
- `consent_logs` - GDPR consent records
- `user_sessions` - Session tracking
- `user_analytics_summary` - Aggregated metrics
- `funnel_events` - Conversion funnel tracking

### 4. Install Required Dependencies

```bash
npm install js-cookie
npm install --save-dev @types/js-cookie
```

### 5. Verify Implementation

The system is now active! When users visit:
1. They'll see a cookie consent banner
2. After consent, analytics will track their activity
3. Data flows to both Google Analytics and your Supabase database

## Usage Examples

### Track Custom Events

```typescript
import { trackEvent, trackBetting, trackWallet } from '@/lib/analytics'

// Track a custom event
trackEvent('button_clicked', {
  button_name: 'place_bet',
  location: 'market_page'
})

// Track betting
trackBetting('place_bet', {
  marketId: 'market-123',
  amount: 50,
  outcome: 'Team A'
})

// Track wallet activity
trackWallet('deposit', {
  walletAddress: '0x123...',
  amount: 100,
  method: 'bridge'
})
```

### Track User Signups

```typescript
import { trackSignup, identifyUser } from '@/lib/analytics'

// In your signup function
trackSignup('email', {
  referrer: document.referrer
})

// After successful signup
identifyUser(user.id, {
  email: user.email,
  username: user.username
})
```

### Track Conversions

```typescript
import { trackConversion } from '@/lib/analytics'

// Track when user completes KYC
trackConversion('kyc_completion', 15) // $15 value

// Track first deposit
trackConversion('first_deposit', 20) // $20 value
```

## What Data Gets Collected

### With User Consent (Analytics):

✅ Page views and navigation
✅ Time spent on pages
✅ Click tracking
✅ Scroll depth
✅ Form interactions
✅ Betting activity
✅ Wallet transactions
✅ Error tracking
✅ Device & browser info
✅ Geographic location (city level)
✅ Session duration
✅ Conversion events

### For Authenticated Users (Additional):

✅ User ID
✅ Username
✅ Wallet address
✅ KYC status
✅ Account creation date
✅ Cross-device tracking
✅ Lifetime value
✅ User segment

### Always Collected (Essential):

✅ Session ID (temporary)
✅ Basic functionality cookies
✅ Security tokens

## Privacy & Compliance

- ✅ GDPR compliant
- ✅ CCPA compliant  
- ✅ Cookie consent required before tracking
- ✅ Users can opt-out anytime
- ✅ Granular consent options
- ✅ Data export available
- ✅ Data deletion on request
- ✅ Consent logs stored for 7 years

## Viewing Analytics Data

### Google Analytics Dashboard

1. Visit [analytics.google.com](https://analytics.google.com)
2. Select your property
3. View real-time, acquisition, engagement, and conversion reports

### Supabase Database Queries

```sql
-- Most popular pages
SELECT 
  event_data->>'page_path' as page,
  COUNT(*) as views
FROM analytics_events
WHERE event_name = 'page_view'
GROUP BY page
ORDER BY views DESC
LIMIT 10;

-- User engagement by day
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_events
FROM analytics_events
GROUP BY date
ORDER BY date DESC;

-- Conversion funnel
SELECT * FROM funnel_conversion_rates
WHERE funnel_name = 'signup_funnel'
ORDER BY step_order;

-- User segments
SELECT 
  user_segment,
  COUNT(*) as users,
  AVG(lifetime_value) as avg_ltv,
  AVG(total_bets_placed) as avg_bets
FROM user_analytics_summary
GROUP BY user_segment;
```

## Next Steps

1. ✅ Set up Google Analytics property
2. ✅ Add GA Measurement ID to environment variables
3. ✅ Run database migrations
4. ✅ Install npm dependencies
5. ⬜ Test the implementation on your site
6. ⬜ Set up Google Analytics goals & conversions
7. ⬜ Create custom dashboards
8. ⬜ Set up automated reports
9. ⬜ Add heatmaps (Hotjar/Microsoft Clarity) - optional
10. ⬜ Implement A/B testing framework - optional

## Troubleshooting

### Analytics not tracking?
- Check if cookie consent was given
- Verify GA_MEASUREMENT_ID in environment variables
- Check browser console for errors
- Ensure DNS/ad blockers aren't blocking GA

### Database errors?
- Verify Supabase migrations ran successfully
- Check RLS policies are properly configured
- Ensure service role key is set (for API routes)

### Cookie banner not showing?
- Clear browser cookies and reload
- Check if consent was already given
- Verify CookieConsent component is in layout

---

For detailed analytics strategy, see [ANALYTICS_PLAN.md](./ANALYTICS_PLAN.md)
