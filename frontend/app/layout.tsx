import './globals.css'
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google'
import QueryProvider from '../components/providers/QueryProvider'
import { AuthProvider } from '../components/providers/AuthProvider'
import GlobalErrorBoundary from '../components/shared/GlobalErrorBoundary'
import { ThemeProvider } from '../components/providers/ThemeProvider'
import { TreeInteractionProvider } from '../components/tree/TreeInteractionProvider'
import { SidebarProvider } from '../components/providers/SidebarProvider'
import { LanguageProvider } from '../components/providers/LanguageProvider'
import { ToastProvider } from '../components/providers/ToastProvider'
import CookieConsent from '../components/ui/CookieConsent'
import MotionProvider from '../components/providers/MotionProvider'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata = {
  title: {
    default: 'FamiLink — Preserve Your Heritage',
    template: '%s | FamiLink'
  },
  description: 'Build your family tree collaboratively with privacy-first controls. Free for small trees. Available in 5 languages.',
  openGraph: {
    title: 'FamiLink — Preserve Your Heritage',
    description: 'Build your family tree collaboratively with privacy-first controls. Free for small trees.',
    url: 'https://familink-og.vercel.app',
    siteName: 'FamiLink',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FamiLink — Preserve Your Heritage',
    description: 'Build your family tree collaboratively. Free for small trees.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    languages: {
      'en': '/en',
      'es': '/es',
      'fr': '/fr',
      'de': '/de',
      'ja': '/ja',
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakartaSans.variable}`}>
      <body className="antialiased font-sans transition-colors duration-500" style={{ fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif' }}>
        <GlobalErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <LanguageProvider>
                <ThemeProvider>
                  <SidebarProvider>
                    <TreeInteractionProvider>
                      <MotionProvider>
                      <ToastProvider>
                        {children}
                        <CookieConsent />
                      </ToastProvider>
                      </MotionProvider>
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
