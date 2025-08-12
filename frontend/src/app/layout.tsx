import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MoveMosaic - Movement Sequence Creation',
  description: 'Create, manage, and share your movement sequences with AI-powered pose detection',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
