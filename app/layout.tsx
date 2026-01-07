import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'World Cup 2026 Predictions | Prism Markets',
  description: 'The ultimate prediction market for FIFA World Cup 2026. Bet on matches, player props, and tournament outcomes with the power of blockchain.',
  keywords: ['World Cup 2026', 'prediction market', 'sports betting', 'FIFA', 'soccer predictions'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
