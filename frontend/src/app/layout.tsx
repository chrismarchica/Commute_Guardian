import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Commute Guardian - MBTA Reliability Tracker',
  description: 'Real-time MBTA reliability tracking and leave-now advice for Boston commuters',
  keywords: ['MBTA', 'Boston', 'Transit', 'Reliability', 'Commute', 'Real-time'],
  authors: [{ name: 'Commute Guardian Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#003DA5', // MBTA Blue
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <Providers>
          <div className="min-h-full">
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-bold text-gray-900">
                      🚇 Commute Guardian
                    </h1>
                    <span className="ml-2 text-sm text-gray-500">MBTA Reliability</span>
                  </div>
                  <nav className="flex space-x-4">
                    <a
                      href="/"
                      className="text-gray-700 hover:text-mbta-blue px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Dashboard
                    </a>
                    <a
                      href="/routes"
                      className="text-gray-700 hover:text-mbta-blue px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Routes
                    </a>
                  </nav>
                </div>
              </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
            <footer className="bg-white border-t border-gray-200 mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <p className="text-center text-sm text-gray-500">
                  Commute Guardian - Helping Boston commuters make informed transit decisions
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
