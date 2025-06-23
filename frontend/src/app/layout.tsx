import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Lead Management System',
  description: 'A Notion-inspired LMS for modern businesses.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* The 'Inter' font is now handled by next/font */}
        <link href="https://cdn.lineicons.com/4.0/lineicons.css" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  )
}
