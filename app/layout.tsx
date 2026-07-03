// app/layout.tsx
// añade esta línea cerca del principio de app/layout.tsx, junto a los otros exports
export const dynamic = 'force-dynamic'
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AppShell } from '@/components/app-shell'
import { CategoriesProvider } from './context/categories-context'
import { TasksProvider } from './context/tasks-context'
import { NotesProvider } from './context/notes-context'
import { PlannerProvider } from './context/planner-context'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'My Planner ',
  description:
    'A calm, premium personal OS unifying tasks, planning, notes, habits, finances, and travel in one beautiful workspace.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <CategoriesProvider>
          <TasksProvider>
            <NotesProvider>
              <PlannerProvider>
                <AppShell>{children}</AppShell>
              </PlannerProvider>
            </NotesProvider>
          </TasksProvider>
        </CategoriesProvider>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}