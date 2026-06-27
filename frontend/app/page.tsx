import { Metadata } from 'next';
import LandingClient from './LandingClient';

export const metadata: Metadata = {
  title: 'FamiLink — Preserve Your Heritage',
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
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return <LandingClient />;
}
