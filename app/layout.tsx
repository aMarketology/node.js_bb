import type { Metadata } from 'next'
import { organizationSchema, servicesSchema, reviewSchema } from '@/lib/schema'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Austin Crate & Freight | White-Glove Specialty Shipping in Austin, TX',
    template: '%s | Austin Crate & Freight'
  },
  description: 'Premier specialty shipping company in Austin, Texas providing white-glove services for fine art, designer furniture, and medical equipment. Museum-quality crating, climate-controlled transport, HIPAA-compliant handling. Serving Austin, Round Rock, Cedar Park & Central Texas. Call (512) 240-9818 for free quote.',
  keywords: [
    // Core Services
    'specialty shipping Austin TX',
    'white glove shipping Austin',
    'fine art shipping Austin',
    'furniture shipping Austin',
    'medical equipment transport Austin',
    
    // Specific Services
    'museum quality art crating',
    'designer furniture movers',
    'HIPAA compliant medical shipping',
    'climate controlled art transport',
    'custom crating services',
    
    // Local SEO
    'Austin shipping company',
    'Round Rock freight services',
    'Cedar Park moving company',
    'Georgetown shipping services',
    'Central Texas specialty movers',
    
    // Industry Terms
    'white glove delivery',
    'art gallery shipping',
    'medical device transport',
    'luxury furniture movers',
    'specialty freight Austin'
  ],
  authors: [{ name: 'Austin Crate & Freight' }],
  creator: 'Austin Crate & Freight',
  publisher: 'Austin Crate & Freight',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  metadataBase: new URL('https://austincrate.com'),
  alternates: {
    canonical: 'https://austincrate.com',
  },
  openGraph: {
    type: 'website',
    url: 'https://austincrate.com',
    title: 'Austin Crate & Freight | White-Glove Specialty Shipping in Austin, TX',
    description: 'Premier specialty shipping for fine art, designer furniture, and medical equipment in Austin, Texas. Museum-quality care, HIPAA-compliant transport, expert handling. Serving Central Texas since 2010.',
    siteName: 'Austin Crate & Freight',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Austin Crate & Freight - Specialty Shipping Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Austin Crate & Freight | Specialty Shipping Austin, TX',
    description: 'White-glove specialty shipping for fine art, designer furniture, and medical equipment in Austin, Texas. Museum-quality care and expert handling.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'Business Services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(servicesSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(reviewSchema),
          }}
        />
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="your-google-verification" />
        {/* Additional Meta Tags */}
        <meta name="theme-color" content="#50c878" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
