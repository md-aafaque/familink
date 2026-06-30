"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trees, Users, Share2, Shield, ArrowRight, Activity, Sparkles } from 'lucide-react';
import BrandLogo from "@/components/shared/BrandLogo";
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from "@/components/providers/LanguageProvider";
import Link from 'next/link';
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import PageBackground from "@/components/decorations/PageBackground";
import { OrangeStar, YellowStar, PinkStar } from "@/components/shared/DecorativeElements";

export default function LandingClient() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = localStorage.getItem('token');
        if (data.session || token) {
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary overflow-hidden">
      <PageBackground variant="auth" />

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="w-8 h-8" />
          <span className="text-lg font-bold tracking-tight">
            Fami<span className="text-primary">Link</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/login')}>
            {t('landing.nav.signIn')}
          </Button>
          <Button variant="candy" onClick={() => router.push('/signup')}>
            {t('landing.nav.getStarted')}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-6 py-24 md:py-32 text-center border-b border-border/50 relative">
          <OrangeStar className="absolute top-20 left-[15%] w-6 h-6" style={{ animationDelay: '0s' }} />
          <YellowStar className="absolute top-40 right-[20%] w-4 h-4" style={{ animationDelay: '1.5s' }} />
          <PinkStar className="absolute bottom-32 left-[10%] w-5 h-5" style={{ animationDelay: '3s' }} />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[11px] font-bold uppercase tracking-widest mb-6 border border-primary/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t('landing.hero.badge')}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-[1.1]"
          >
            {t('landing.hero.titleBefore')}<span className="text-primary">{t('landing.hero.titleHighlight')}</span>{t('landing.hero.titleAfter')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button variant="candy" size="xl" onClick={() => router.push('/signup')}>
              {t('landing.hero.cta')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl" onClick={() => router.push('/login')}>
              {t('landing.hero.learnMore')}
            </Button>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { icon: Users, color: 'bg-primary/10 text-primary', title: t('landing.features.collaborative.title'), desc: t('landing.features.collaborative.desc') },
              { icon: Share2, color: 'bg-emerald-500/10 text-emerald-600', title: t('landing.features.sharing.title'), desc: t('landing.features.sharing.desc') },
              { icon: Shield, color: 'bg-primary/10 text-primary', title: t('landing.features.privacy.title'), desc: t('landing.features.privacy.desc') },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="group relative rounded-2xl border-2 border-border bg-card p-8 shadow-pop-sm hover:shadow-pop-lg transition-all hover:-translate-y-1"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 border-2 border-border", feature.color)}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 max-w-7xl mx-auto px-6 py-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 opacity-60 grayscale">
            <BrandLogo className="w-6 h-6" />
            <span className="text-sm font-bold tracking-tight">FamiLink</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{t('landing.footer.copyright')}</span>
            <span className="opacity-30">&middot;</span>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <span className="opacity-30">&middot;</span>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
