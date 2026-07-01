"use client";

import { useState, Suspense } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { Mail, Lock, Loader2 } from 'lucide-react';
import BrandLogo from '@/components/shared/BrandLogo';
import SurfaceDecorations from '@/components/shared/SurfaceDecorations';
import { SiGoogle } from 'react-icons/si';
import Link from 'next/link';
import { useLanguage } from "@/components/providers/LanguageProvider";
import Footer from '../../components/shared/Footer';
import { Button } from "@/components/ui/button";
import PageBackground from "@/components/decorations/PageBackground";
import { motion } from "framer-motion";

function LoginFormContent() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const message = searchParams.get('message');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log("[Login] Attempting sign in for:", email);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); return; }
      if (data.session) {
        const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
        router.replace(safeRedirect);
      } else {
        setError(t('login.error.noSession'));
      }
    } catch (err: any) {
      setError(err.message || t('login.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
            className="rounded-2xl border-2 border-border bg-card p-8 shadow-pop-lg relative overflow-hidden"
          >
            <SurfaceDecorations density="light" />
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <BrandLogo className="w-10 h-10" />
                <span className="text-2xl font-bold text-foreground">
                  Fami<span className="text-primary">Link</span>
                </span>
              </div>
              <h1 className="text-3xl font-bold text-foreground">{t('login.title')}</h1>
              <p className="text-muted-foreground mt-2">{t('login.subtitle')}</p>
            </div>

            {message && (
              <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl mb-6 text-sm font-medium">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-6 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  {t('login.email')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-input border-2 border-border rounded-xl focus:border-primary focus:shadow-pop-sm outline-none transition-all"
                    placeholder={t('login.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  {t('login.password')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-input border-2 border-border rounded-xl focus:border-primary focus:shadow-pop-sm outline-none transition-all"
                    placeholder={t('login.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" variant="candy" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('login.signIn')}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">{t('login.orContinueWith')}</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              <SiGoogle className="w-5 h-5 text-primary" />
              {t('login.google')}
            </Button>

            <p className="text-center text-muted-foreground mt-8 text-sm">
              {t('login.noAccount')}{' '}
              <Link href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`} className="text-primary font-bold hover:opacity-80">
                {t('login.signUp')}
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>}>
      <LoginFormContent />
    </Suspense>
  );
}
