import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import QueryProvider from '@/components/providers/query-provider'

export const metadata: Metadata = {
  title: 'AgencyOS - Business Management Platform',
  description: 'Manage clients, projects, tasks, revenue and team performance in one place.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-text font-sans antialiased">
        <QueryProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: '#141419',
                border: '1px solid #1E1E2A',
                color: '#F1F1F5',
                borderRadius: '10px',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
