import './globals.css'
import QueryProvider from '../components/providers/QueryProvider'
import { AuthProvider } from '../components/providers/AuthProvider'
import GlobalErrorBoundary from '../components/shared/GlobalErrorBoundary'
import { ThemeProvider } from '../components/providers/ThemeProvider'
import { TreeInteractionProvider } from '../components/tree/TreeInteractionProvider'
import { SidebarProvider } from '../components/providers/SidebarProvider'
import { LanguageProvider } from '../components/providers/LanguageProvider'

export const metadata = {
  title: 'Family Tree',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans transition-colors duration-500">
        <GlobalErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <LanguageProvider>
                <ThemeProvider>
                  <SidebarProvider>
                    <TreeInteractionProvider>
                      {children}
                    </TreeInteractionProvider>
                  </SidebarProvider>
                </ThemeProvider>
              </LanguageProvider>
            </AuthProvider>
          </QueryProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  )
}
