import type { Metadata } from 'next'
import { DM_Sans, Instrument_Serif } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'
import { TopBar } from '@/components/TopBar'
import { DemoToggle } from '@/components/DemoToggle'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'INJOY Kursplan',
  description: 'Kurse buchen bei INJOY Wolfsburg',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${dmSans.variable} ${instrument.variable}`}>
      <body>
        <AuthProvider>
          <TopBar />
          {children}
          <DemoToggle />
        </AuthProvider>
      </body>
    </html>
  )
}
