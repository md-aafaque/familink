"use client";

import { useState, Suspense } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import Link from 'next/link';
import { useLanguage } from "@/components/providers/LanguageProvider";
import Footer from '../../components/shared/Footer';

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
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        console.error("[Login] Auth error:", signInError.message);
        setError(signInError.message);
        return;
      }

      if (data.session) {
        console.log("[Login] Success, triggering navigation to:", redirectTo);

        // Safety: Ensure we only redirect to internal paths
        const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
        
        // Next.js router.replace is usually enough, 
        // but router.push or window.location might be more definitive in some cases.
        router.replace(safeRedirect);
      } else {
        console.warn("[Login] Success but no session returned");
        setError(t('login.error.noSession'));
      }
    } catch (err: any) {
      console.error("[Login] Unexpected error:", err);
      setError(err.message || t('login.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full">
          <div className="bg-card shadow-xl border border-border p-8 rounded-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground">{t('login.title')}</h1>
              <p className="text-muted-foreground mt-2">{t('login.subtitle')}</p>
            </div>

        {message && (
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg mb-6 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 text-sm">
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
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
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
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('login.signIn')}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">{t('login.orContinueWith')}</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full border border-input hover:bg-muted text-foreground font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <SiGoogle className="w-5 h-5 text-primary" />
          {t('login.google')}
        </button>

        <p className="text-center text-muted-foreground mt-8 text-sm">
          {t('login.noAccount')}{' '}
          <Link href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`} className="text-primary font-semibold hover:opacity-80">
            {t('login.signUp')}
          </Link>
        </p>
        </div>
      </div>
    </div>
    <Footer />
  </>);
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>}>
      <LoginFormContent />
    </Suspense>
  );
}
