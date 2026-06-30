"use client";

import { useState, Suspense } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import BrandLogo from '@/components/shared/BrandLogo';
import { SiGoogle } from 'react-icons/si';
import Link from 'next/link';
import { useLanguage } from "@/components/providers/LanguageProvider";
import Footer from '../../components/shared/Footer';
import { Button } from "@/components/ui/button";
import PageBackground from "@/components/decorations/PageBackground";
import { motion } from "framer-motion";

function SignupContent() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log("[Signup] Attempting account creation for:", email);
    if (!email.includes('@')) { setError(t('signup.error.invalidEmail')); setLoading(false); return; }
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) { setError(error.message); setLoading(false); }
      else { router.push(`/login?message=Check your email to confirm your account&redirectTo=${encodeURIComponent(redirectTo)}`); }
    } catch (err: any) {
      setError(err.message || t('signup.error.generic'));
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${redirectTo}` },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      <PageBackground variant="auth" />

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 max-w-md w-full"
        >
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="rounded-2xl border-2 border-border bg-card p-8 shadow-pop-lg"
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <BrandLogo className="w-10 h-10" />
                <span className="text-2xl font-bold text-foreground">
                  Fami<span className="text-primary">Link</span>
                </span>
              </div>
              <h1 className="text-3xl font-bold text-foreground">{t('signup.title')}</h1>
              <p className="text-muted-foreground mt-2">{t('signup.subtitle')}</p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-6 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  {t('signup.fullName')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text" required
                    className="w-full pl-10 pr-4 py-2.5 bg-background border-2 border-input rounded-xl focus:border-primary focus:shadow-pop-sm outline-none transition-all"
                    placeholder={t('signup.fullNamePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  {t('signup.email')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email" required
                    className="w-full pl-10 pr-4 py-2.5 bg-background border-2 border-input rounded-xl focus:border-primary focus:shadow-pop-sm outline-none transition-all"
                    placeholder={t('signup.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  {t('signup.password')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password" required
                    className="w-full pl-10 pr-4 py-2.5 bg-background border-2 border-input rounded-xl focus:border-primary focus:shadow-pop-sm outline-none transition-all"
                    placeholder={t('signup.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" variant="candy" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('signup.createAccount')}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">{t('signup.orContinueWith')}</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignup}>
              <SiGoogle className="w-5 h-5 text-primary" />
              {t('signup.google')}
            </Button>

            <p className="text-center text-muted-foreground mt-8 text-sm">
              {t('signup.hasAccount')}{' '}
              <Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} className="text-primary font-bold hover:opacity-80">
                {t('signup.signIn')}
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

export default function SignupPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div>{t('signup.loading')}</div>}>
      <SignupContent />
    </Suspense>
  );
}
