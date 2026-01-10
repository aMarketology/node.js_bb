import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from './contexts/AuthContext'
import { Layer2Provider } from './contexts/Layer2Context'

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
      <body className="antialiased">
        <AuthProvider>
          <Layer2Provider>
            {children}
          </Layer2Provider>
        </AuthProvider>
      </body>
    </html>
  )
}
