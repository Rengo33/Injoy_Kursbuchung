import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
