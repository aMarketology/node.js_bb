# Advanced Analytics Plan - Prism World Cup 2026

## Overview
Comprehensive user tracking and analytics system with privacy-first consent management.

## Data Collection Strategy

### 1. User Identity Tracking

#### Anonymous Users (No Consent)
- Session ID (temporary, browser session only)
- Page views (aggregated only)
- Basic device info (screen size, OS)

#### Anonymous Users (With Consent)
- Persistent user ID (cookie-based, 1 year)
- Full page navigation history
- Time on page
- Scroll depth
- Click heatmaps
- Device fingerprint
- Referrer source
- UTM parameters
- Geographic location (city level)
- Device type & browser
- Session recordings (optional)

#### Authenticated Users (With Consent)
All anonymous data PLUS:
- User database ID
- Email (hashed for privacy)
- Username
- Wallet address (public blockchain data)
- Account creation date
- KYC verification status
- User tier/segment
- Lifetime value tracking
- Cross-device identification

### 2. Event Tracking Categories

#### Authentication Events
- `user_signup` - New user registration
  - Method (email/wallet)
  - Referral source
  - Time to complete
- `user_login` - User login
  - Method (email/wallet)
  - Device type
  - Location
- `user_logout` - User logout
- `wallet_connected` - Wallet connection
  - Wallet type
  - Wallet address
- `kyc_started` - KYC process initiated
- `kyc_completed` - KYC verification completed
- `kyc_failed` - KYC verification failed

#### Betting & Trading Events
- `market_viewed` - User views a market
  - Market ID
  - Market type
  - Time spent
- `bet_initiated` - User starts placing bet
  - Market ID
  - Amount entered
- `bet_placed` - Bet successfully placed
  - Market ID
  - Amount
  - Outcome selected
  - Odds at time of bet
- `bet_cancelled` - User cancels bet
  - Reason (if available)
- `bet_won` - User wins bet
  - Market ID
  - Payout amount
- `bet_lost` - User loses bet
  - Market ID
  - Amount lost

#### Wallet & Financial Events
- `deposit_initiated` - User starts deposit
  - Amount
  - Method (bridge/credit)
- `deposit_completed` - Deposit successful
  - Amount
  - Method
  - Transaction hash
- `deposit_failed` - Deposit failed
  - Reason
  - Amount attempted
- `withdrawal_initiated` - User starts withdrawal
  - Amount
  - Destination
- `withdrawal_completed` - Withdrawal successful
  - Amount
  - Transaction hash
- `balance_checked` - User checks balance
- `insufficient_balance` - User attempted action with insufficient funds

#### Engagement Events
- `page_view` - Page viewed
  - Page path
  - Referrer
  - Time on page
- `scroll_depth` - User scrolls page
  - Percentage (25%, 50%, 75%, 100%)
- `button_clicked` - Button interaction
  - Button ID/name
  - Location on page
- `modal_opened` - Modal/popup opened
  - Modal type
- `modal_closed` - Modal/popup closed
  - Time spent in modal
- `search_performed` - User searches
  - Search query
  - Results count
- `filter_applied` - User filters content
  - Filter type
  - Filter value
- `share_clicked` - User shares content
  - Share method (twitter, facebook, etc)
- `video_played` - Video started (if applicable)
- `video_completed` - Video watched to end

#### Conversion Events
- `signup_conversion` - User completes signup
  - Conversion value: $5
- `first_deposit` - User's first deposit
  - Conversion value: $20
- `first_bet` - User's first bet placed
  - Conversion value: $10
- `kyc_conversion` - User completes KYC
  - Conversion value: $15
- `high_value_bet` - Bet over $100
  - Conversion value: bet amount * 0.1

#### Error & Drop-off Events
- `error_occurred` - Error shown to user
  - Error message
  - Page/component
  - User action that triggered error
- `form_abandoned` - User starts but doesn't complete form
  - Form type
  - Fields completed
  - Exit point
- `checkout_abandoned` - User abandons bet placement
  - Stage abandoned
  - Amount in cart

### 3. User Segmentation

#### Behavior Segments
- **New Users** - First 7 days after signup
- **Active Users** - Logged in 3+ times in last 30 days
- **Power Users** - 10+ bets placed, $500+ wagered
- **Inactive Users** - No login in 30+ days
- **High Value** - $1000+ total deposited
- **Churned Users** - No activity in 90+ days

#### Acquisition Segments
- **Organic** - Direct or search traffic
- **Paid** - Paid advertising
- **Referral** - Referred by another user
- **Social** - Social media traffic
- **Email** - Email campaign

#### Engagement Segments
- **Browsers** - Views markets but hasn't bet
- **Casual Bettors** - 1-5 bets total
- **Regular Bettors** - 6-20 bets total
- **Whale Bettors** - 21+ bets or $1000+ wagered

### 4. Custom Dimensions & Metrics

#### User-Level Custom Dimensions
- User Tier (Free, Bronze, Silver, Gold)
- KYC Status (Verified, Unverified, Pending)
- Wallet Type (Email, MetaMask, WalletConnect)
- Signup Source (Organic, Paid, Referral)
- Account Age (days since signup)
- Total Bets Placed
- Total Wagered (USD)
- Win Rate (%)

#### Session-Level Custom Dimensions
- Device Category (Mobile, Tablet, Desktop)
- Browser Language
- Session Start Time
- Traffic Source
- Campaign Name
- Referrer URL

#### Hit-Level Custom Dimensions
- Market ID
- Bet Amount
- Outcome Selected
- Current Balance

### 5. Funnel Tracking

#### Signup Funnel
1. Landing page view
2. Signup modal opened
3. Email entered
4. Password created
5. Account created
6. Email verified

**Goal**: Identify drop-off points, optimize conversion

#### Betting Funnel
1. Market viewed
2. Outcome selected
3. Amount entered
4. Review bet
5. Confirm bet
6. Bet placed

**Goal**: Reduce friction, increase bet placement rate

#### Deposit Funnel
1. Insufficient balance prompt
2. Deposit modal opened
3. Amount entered
4. Payment method selected
5. Transaction confirmed
6. Deposit successful

**Goal**: Increase deposit conversion rate

### 6. Cohort Analysis

#### Track Cohorts By:
- Signup week/month
- First deposit week
- Acquisition source
- Initial market type interest

#### Measure:
- Retention rates (Day 1, 7, 30, 90)
- Lifetime value (LTV)
- Average bets per user
- Average deposit amount
- Churn rate
- Reactivation rate

### 7. Revenue Attribution

#### Track:
- First-touch attribution (what brought user in)
- Last-touch attribution (what drove conversion)
- Multi-touch attribution (full journey)

#### Revenue Events:
- Platform fees from bets
- Subscription revenue (if applicable)
- Cross-sell/upsell revenue

### 8. Privacy & Consent Management

#### Consent Levels:
1. **Essential** (No consent required)
   - Basic functionality
   - Security
   - Session management

2. **Analytics** (Requires consent)
   - Google Analytics
   - User behavior tracking
   - Performance monitoring

3. **Marketing** (Requires consent)
   - Retargeting pixels
   - Email tracking
   - Social media pixels

4. **Personalization** (Requires consent)
   - Customized content
   - Recommendations
   - A/B testing

#### User Rights:
- Right to view collected data
- Right to delete data
- Right to export data
- Right to opt-out anytime
- Right to granular consent (choose categories)

### 9. Technical Implementation

#### Tools & Platforms:
- **Google Analytics 4** - Core analytics platform
- **Google Tag Manager** - Tag management
- **Hotjar/Microsoft Clarity** - Heatmaps & session recordings (with consent)
- **Mixpanel/Amplitude** - Advanced product analytics (optional)
- **Custom Database Tables** - First-party data warehouse

#### Data Storage:
- Browser cookies (with consent)
- Supabase analytics tables
- Google Analytics 4
- Data warehouse (for long-term analysis)

#### Data Retention:
- Anonymous data: 26 months (GA4 default)
- Authenticated user data: Until account deletion or 3 years inactive
- Consent records: 7 years (compliance)

### 10. Key Performance Indicators (KPIs)

#### Acquisition KPIs:
- New user signups per day/week/month
- Cost per acquisition (CPA)
- Organic vs paid traffic ratio
- Signup conversion rate

#### Engagement KPIs:
- Daily/Monthly Active Users (DAU/MAU)
- Session duration
- Pages per session
- Bounce rate
- Return visitor rate

#### Retention KPIs:
- Day 1, 7, 30 retention rates
- Churn rate
- User lifetime (average days active)

#### Monetization KPIs:
- Average deposit value
- Total deposits per user
- Betting volume (daily/monthly)
- Platform revenue
- Customer Lifetime Value (CLV)
- Revenue per user (ARPU)

#### Product KPIs:
- Feature adoption rates
- Time to first bet
- Bet completion rate
- Error rate
- Page load time
- Mobile vs desktop usage

### 11. Reporting Dashboard Structure

#### Executive Dashboard:
- Total users (all time, monthly, daily)
- Active users trend
- Revenue trend
- Key conversion rates
- Top markets

#### Marketing Dashboard:
- Acquisition sources
- Campaign performance
- Cost per acquisition
- Conversion rates by channel
- Attribution analysis

#### Product Dashboard:
- Feature usage
- User flows
- Drop-off analysis
- Error tracking
- Performance metrics

#### User Insights Dashboard:
- User segments distribution
- Cohort retention curves
- Lifetime value by cohort
- Engagement scores
- Churn prediction

### 12. A/B Testing Plan

#### Test Categories:
- Landing page variations
- Signup flow optimization
- Betting interface improvements
- Deposit amount suggestions
- Push notification timing
- Email campaign variations

#### Testing Framework:
- Minimum sample size calculator
- Statistical significance threshold (95%)
- Test duration (minimum 2 weeks)
- Success metrics defined upfront

---

## Implementation Priority

### Phase 1 (Week 1-2): Foundation
- ✅ Cookie consent banner
- ✅ Google Analytics 4 setup
- ✅ Basic event tracking (pageviews, signups, logins)
- ✅ User identification system

### Phase 2 (Week 3-4): Enhanced Tracking
- ⬜ Full betting funnel tracking
- ⬜ Wallet event tracking
- ⬜ Error tracking
- ⬜ Custom dimensions setup

### Phase 3 (Week 5-6): Advanced Analytics
- ⬜ Heatmaps & session recordings (Hotjar/Clarity)
- ⬜ Cohort analysis setup
- ⬜ Custom dashboards
- ⬜ Automated reports

### Phase 4 (Week 7-8): Optimization
- ⬜ A/B testing framework
- ⬜ Predictive analytics
- ⬜ Churn prediction model
- ⬜ Personalization engine

---

## Compliance & Legal

- GDPR compliant (EU users)
- CCPA compliant (California users)
- Cookie consent before tracking
- Privacy policy updated
- Terms of service include analytics disclosure
- Data processing agreement with Google
- Regular data audits
- User data export/deletion tools

---

## Success Metrics for Analytics Program

- **Coverage**: 100% of key user actions tracked
- **Accuracy**: <5% data discrepancy between sources
- **Adoption**: 80%+ users consent to analytics
- **Actionability**: Analytics insights lead to 3+ product improvements per month
- **ROI**: Analytics-driven optimizations increase conversions by 15%+

---

*Last Updated: January 16, 2026*
