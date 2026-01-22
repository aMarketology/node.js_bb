# Quick Reference - Analytics Implementation

## 🎯 What You Have Now

✅ **Google Analytics 4** - Complete user tracking  
✅ **Cookie Consent Banner** - GDPR/CCPA compliant  
✅ **Google Sign-In** - Easy auth + better tracking  
✅ **Custom Analytics DB** - Detailed event storage  
✅ **User Identification** - Track returning users  

## 🚀 To Get Started (5 Minutes)

### 1. Get Google Analytics ID
```
1. Visit https://analytics.google.com/
2. Create GA4 property
3. Copy Measurement ID (G-XXXXXXXXXX)
```

### 2. Add to .env.local
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Run Database Migration
```bash
npx supabase db push
```

### 4. Restart Server
```bash
npm run dev
```

✅ **Done!** Your analytics are live.

## 🔑 Google Sign-In (Optional - 10 Minutes)

### Quick Setup
```
1. Go to console.cloud.google.com
2. Create OAuth credentials
3. Add to Supabase Auth settings
4. Add Client ID/Secret to .env.local
```

Full guide: [GOOGLE_SIGNIN_SETUP.md](./GOOGLE_SIGNIN_SETUP.md)

## 📊 Track Custom Events

```typescript
import { trackEvent } from '@/lib/analytics'

// Simple event
trackEvent('button_clicked', { button: 'bet_now' })

// Betting event
import { trackBetting } from '@/lib/analytics'
trackBetting('place_bet', {
  marketId: 'match-123',
  amount: 50,
  outcome: 'home'
})

// Conversion event
import { trackConversion } from '@/lib/analytics'
trackConversion('first_deposit', 20) // $20 value
```

## 🔍 View Your Data

### Google Analytics
```
analytics.google.com → Your Property → Realtime
```

### Database Query
```sql
SELECT * FROM analytics_events 
ORDER BY created_at DESC LIMIT 10;
```

## 🍪 What Users See

1. **Cookie Consent Banner** - First visit
   - Accept All / Reject All / Customize
   
2. **Google Sign-In Button** - Auth modal
   - White button with Google logo
   - Above wallet connect

3. **Seamless Tracking** - Background
   - Page views, clicks, events
   - No impact on UX

## 📈 Data Collected (With Consent)

- ✅ Page views & navigation
- ✅ Time on page
- ✅ Button clicks
- ✅ Scroll depth
- ✅ Betting activity
- ✅ Wallet transactions
- ✅ User signups/logins
- ✅ Conversions
- ✅ Device & browser info
- ✅ Geographic location (city)

## 🔐 Privacy Features

- ✅ GDPR compliant
- ✅ CCPA compliant
- ✅ Cookie consent required
- ✅ Granular opt-out
- ✅ Data export available
- ✅ Data deletion on request

## 📚 Full Documentation

- **[ANALYTICS_GOOGLE_COMPLETE.md](./ANALYTICS_GOOGLE_COMPLETE.md)** - Overview
- **[ANALYTICS_PLAN.md](./ANALYTICS_PLAN.md)** - Full strategy
- **[ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md)** - Setup guide
- **[GOOGLE_SIGNIN_SETUP.md](./GOOGLE_SIGNIN_SETUP.md)** - OAuth guide

## 🎉 You're Ready!

Your analytics system is production-ready. Just add your GA Measurement ID and you're tracking users with full privacy compliance.
