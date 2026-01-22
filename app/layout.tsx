import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from './contexts/AuthContext'
import { MarketsProvider } from './contexts/MarketsContext'
import { CreditPredictionProvider } from './contexts/CreditPredictionContext'
import { SettlementProvider } from './contexts/SettlementContext'
import { UnifiedSDKProvider } from './contexts/UnifiedSDKContext'
import { ClientLayout } from './ClientLayout'
import GoogleAnalytics from './components/GoogleAnalytics'
import AnalyticsProvider from './components/AnalyticsProvider'
import CookieConsent from './components/CookieConsent'

export const metadata: Metadata = {
  title: 'Prism World Cup 2026 | Prediction Market',
  description: 'The ultimate prediction market for FIFA World Cup 2026. Powered by Prism blockchain technology.',
  keywords: ['World Cup 2026', 'prediction market', 'sports betting', 'FIFA', 'blockchain'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics />
      </head>
      <body className="antialiased">
        <ClientLayout>
          <div id="grayscale-wrapper">
            <AuthProvider>
              <AnalyticsProvider>
                <UnifiedSDKProvider>
                  <MarketsProvider>
                    <CreditPredictionProvider>
                      <SettlementProvider>
                        {children}
                      </SettlementProvider>
                    </CreditPredictionProvider>
                  </MarketsProvider>
                </UnifiedSDKProvider>
              </AnalyticsProvider>
              <CookieConsent />
            </AuthProvider>
          </div>
        </ClientLayout>
      </body>
    </html>
  )
}
