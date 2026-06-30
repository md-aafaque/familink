'use client'

import React, { Fragment } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

type FooterPage = 'privacy' | 'terms'

export default function Footer({ page }: { page?: FooterPage } = {}) {
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
    <footer className="shrink-0 border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-4">
        <span>&copy; {new Date().getFullYear()} FamiLink</span>
        {links.map((link) => (
          <Fragment key={link.href}>
            <span className="opacity-30">&middot;</span>
            <Link href={link.href} className="transition-colors hover:text-primary">{link.label}</Link>
          </Fragment>
        ))}
      </div>
    </footer>
  )
}
