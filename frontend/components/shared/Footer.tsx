'use client'

import React, { Fragment } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { useAppTheme } from '@/components/providers/ThemeProvider'

type FooterPage = 'privacy' | 'terms'

export default function Footer({ page }: { page?: FooterPage } = {}) {
  const { theme } = useAppTheme()
  const hoverAccent = theme.isDark ? 'hover:text-indigo-400' : 'hover:text-orange-600'

  const links = page === 'privacy'
    ? [
        { href: '/terms', label: 'Terms of Service' },
        { href: '/', label: 'Home' },
      ]
    : page === 'terms'
    ? [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/', label: 'Home' },
      ]
    : [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms of Service' },
      ]

  return (
    <footer className={cn("shrink-0 border-t px-6 py-4 text-center text-xs text-muted-foreground", theme.colors.border)}>
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-4">
        <span>&copy; {new Date().getFullYear()} FamiLink</span>
        {links.map((link) => (
          <Fragment key={link.href}>
            <span className="opacity-30">&middot;</span>
            <Link href={link.href} className={cn("transition-colors", hoverAccent)}>{link.label}</Link>
          </Fragment>
        ))}
      </div>
    </footer>
  )
}
