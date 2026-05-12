import './globals.css'
import QueryProvider from '../components/providers/QueryProvider'
import { AuthProvider } from '../components/providers/AuthProvider'
import GlobalErrorBoundary from '../components/shared/GlobalErrorBoundary'

export const metadata = {
  title: 'Family Tree',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-slate-900">
        <GlobalErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  )
}
