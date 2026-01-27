import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from './contexts/AuthContext'
import { UnifiedWalletProvider } from './contexts/UnifiedWalletContext'
import { ClientLayout } from './ClientLayout'
import GoogleAnalytics from './components/GoogleAnalytics'
import AnalyticsProvider from './components/AnalyticsProvider'
import CookieConsent from './components/CookieConsent'

// Configure Ed25519 sha512 for @noble/ed25519
import * as ed25519 from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha2.js'
// @ts-ignore - sha512Sync exists but not in type definitions
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m))
console.log('✅ Ed25519 sha512 configured')

export const metadata: Metadata = {
  title: 'PRISM | Social Gaming Platform - World Cup 2026 Fantasy League',
  description: 'Social gaming platform for World Cup 2026. Skill-based fantasy contests with FREE sweepstakes entries. NOT a sportsbook. 100% legal entertainment.',
  keywords: ['World Cup 2026', 'fantasy sports', 'social gaming', 'sweepstakes', 'skill games', 'FIFA', 'free to play'],
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
                <UnifiedWalletProvider>
                  {children}
                </UnifiedWalletProvider>
              </AnalyticsProvider>
              <CookieConsent />
            </AuthProvider>
          </div>
        </ClientLayout>
      </body>
    </html>
  )
}
