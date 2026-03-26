import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Taxly — Contabilitate simplă pentru PFA-uri',
  description:
    'Facturare, contabilitate și conformitate fiscală pentru PFA-uri, II-uri și micro-SRL-uri din România.',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

