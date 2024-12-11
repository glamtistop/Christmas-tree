import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import Providers from '../components/Providers'

export const metadata: Metadata = {
  title: 'Christmas Trees',
  description: 'Find your perfect Christmas tree',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const squareUrl = process.env.NEXT_PUBLIC_SQUARE_ENV === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js';

  return (
    <html lang="en">
      <head>
        <Script
          src={squareUrl}
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
