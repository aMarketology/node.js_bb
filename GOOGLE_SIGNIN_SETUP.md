# Google Sign-In Setup Guide

## Why Google Sign-In?

Google Sign-In provides:
- ✅ **Better Analytics**: Track users across sessions with Google Analytics user ID
- ✅ **Easier Authentication**: No password to remember
- ✅ **Trusted**: Users trust Google's security
- ✅ **Cross-Device Tracking**: Same user on mobile and desktop
- ✅ **Enhanced Reporting**: Demographics, interests, and behavior data

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it something like "Prism World Cup 2026"

### 2. Enable Google+ API

1. In the sidebar, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

### 3. Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Configure the OAuth consent screen if prompted:
   - User Type: **External**
   - App name: **Prism World Cup 2026**
   - User support email: your email
   - Developer contact: your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (during development)
   - Save and continue

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Prism Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)
   - Click **Create**

5. **Copy your Client ID and Client Secret** - you'll need these!

### 4. Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Find **Google** and click to expand
5. Enable Google provider
6. Paste your **Google Client ID**
7. Paste your **Google Client Secret**
8. The callback URL is shown (should be `https://your-project.supabase.co/auth/v1/callback`)
9. Click **Save**

### 5. Add Credentials to Environment Variables

Add to your `.env.local` file:

```env
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-YOUR_GA_ID

# Google OAuth (for Sign-In)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 6. Test the Integration

1. Restart your dev server: `npm run dev`
2. Go to your login page
3. Click "Continue with Google"
4. Sign in with your Google account
5. Authorize the app
6. You should be redirected back and logged in!

## Google Analytics Integration Benefits

When users sign in with Google, you get:

### Enhanced User Tracking
- **User ID**: Consistent tracking across devices and sessions
- **Demographics**: Age and gender data (if users opt-in)
- **Interests**: Interest categories for better targeting
- **Affinity Categories**: Lifestyle and habits data

### Better Attribution
- Track user journey from first visit to conversion
- Understand which marketing channels bring valuable users
- Measure lifetime value per acquisition source

### Cross-Device Reports
- See how users interact across mobile, tablet, and desktop
- Understand multi-device conversion paths
- Optimize for each device type

### Audience Segmentation
- Create remarketing lists based on Google account data
- Target high-value users with personalized content
- Build lookalike audiences for ads

## Setting Up User ID in Google Analytics

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Go to **Admin** > **Data Settings** > **Data Collection**
4. Enable **User-ID feature**
5. Accept terms
6. Create a User-ID view (optional but recommended)

Our implementation automatically sends the user ID when users sign in with Google!

## Privacy Considerations

- ✅ Users must consent to analytics tracking (our cookie banner)
- ✅ User email is NOT sent to Google Analytics (only hashed ID)
- ✅ Google OAuth complies with their privacy policy
- ✅ Users can revoke access anytime in their Google Account settings
- ✅ We follow GDPR/CCPA requirements

## Testing

### Test in Development

```bash
# Make sure you added localhost to authorized origins
npm run dev
# Visit http://localhost:3000
# Click "Continue with Google"
# Should redirect to Google OAuth, then back to your app
```

### Verify in Google Analytics

1. After signing in with Google, go to Google Analytics
2. Navigate to **Realtime** > **Events**
3. You should see events coming in with user_id
4. Check **Audience** > **User Explorer** to see individual users

### Check Supabase

1. Go to Supabase Dashboard > **Authentication** > **Users**
2. You should see your Google user
3. Provider should show "google"
4. User metadata includes Google profile info

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure you added the correct redirect URI in Google Cloud Console
- Check that Supabase callback URL matches
- URI must be EXACT match (including http/https)

### "Access blocked" error
- Your OAuth consent screen might not be published
- Add your email as a test user in Google Cloud Console
- Or publish your OAuth consent screen (requires verification for production)

### User created but no profile in database
- Check the `handleGoogleCallback` function in `lib/google-auth.ts`
- Verify your database has proper permissions
- Check Supabase logs for errors

### Analytics not tracking Google users
- Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
- Check cookie consent was given
- Look for JavaScript errors in browser console
- Verify `identifyUser` is called after sign-in

## Production Checklist

Before launching:

- [ ] OAuth consent screen is verified by Google
- [ ] Production domain added to authorized origins
- [ ] Production redirect URI added
- [ ] Environment variables set in production
- [ ] Google Analytics property set up
- [ ] Test sign-in flow on production
- [ ] Privacy policy includes Google OAuth
- [ ] Terms of service updated
- [ ] Cookie consent banner working

## Advanced: Sync Google Analytics with Your Database

You can use the Google Analytics Data API to pull analytics data into your database:

```typescript
// Example: Fetch user analytics from GA
import { BetaAnalyticsDataClient } from '@google-analytics/data'

const analyticsDataClient = new BetaAnalyticsDataClient()

async function getUserAnalytics(userId: string) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'userId',
        stringFilter: { value: userId },
      },
    },
  })
  
  return response
}
```

This allows you to:
- Enrich your user profiles with GA data
- Build custom dashboards
- Trigger actions based on user behavior
- Create advanced segments

---

## Next Steps

✅ You're now set up with Google Sign-In!

Users can now:
1. Sign in with Google (easier than email/password)
2. Be consistently tracked across devices
3. Have their activity linked in Google Analytics

You can now:
1. See detailed user behavior in GA
2. Create remarketing audiences
3. Track conversions accurately
4. Understand user demographics
5. Optimize marketing campaigns

For more analytics features, see [ANALYTICS_PLAN.md](./ANALYTICS_PLAN.md)
