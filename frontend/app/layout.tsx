import './globals.css'
import QueryProvider from '../components/providers/QueryProvider'
import { AuthProvider } from '../components/providers/AuthProvider'
import GlobalErrorBoundary from '../components/shared/GlobalErrorBoundary'
import { ThemeProvider } from '../components/providers/ThemeProvider'
import { TreeInteractionProvider } from '../components/tree/TreeInteractionProvider'

export const metadata = {
  title: 'Family Tree',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-slate-900 transition-colors duration-500">
        <GlobalErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <ThemeProvider>
                <TreeInteractionProvider>
                  {children}
                </TreeInteractionProvider>
              </ThemeProvider>
            </AuthProvider>
          </QueryProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  )
}
