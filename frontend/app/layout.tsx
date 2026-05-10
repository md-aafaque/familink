import './globals.css'
import Header from '../components/Header'

export const metadata = {
  title: 'Family Tree',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="min-h-screen max-w-7xl mx-auto px-6 py-12">{children}</main>
      </body>
    </html>
  )
}
