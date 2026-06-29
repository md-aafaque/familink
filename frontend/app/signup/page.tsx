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

    // Basic validation to prevent common errors
    if (!email.includes('@')) {
      setError(t('signup.error.invalidEmail'));
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        },
      });

      if (error) {
        console.error("[Signup] Error:", error.message);
        setError(error.message);
        setLoading(false);
      } else {
        console.log("[Signup] Success, redirecting to login");
        router.push(`/login?message=Check your email to confirm your account&redirectTo=${encodeURIComponent(redirectTo)}`);
      }
    } catch (err: any) {
      console.error("[Signup] Unexpected error:", err);
      setError(err.message || t('signup.error.generic'));
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 text-sm">
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
                type="text"
                required
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
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
                type="email"
                required
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
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
                type="password"
                required
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder={t('signup.passwordPlaceholder')}
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('signup.createAccount')}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">{t('signup.orContinueWith')}</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full border border-input hover:bg-muted text-foreground font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <SiGoogle className="w-5 h-5 text-primary" />
          {t('signup.google')}
        </button>

        <p className="text-center text-muted-foreground mt-8 text-sm">
          {t('signup.hasAccount')}{' '}
          <Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} className="text-primary font-semibold hover:opacity-80">
            {t('signup.signIn')}
          </Link>
        </p>
        </div>
      </div>
    </div>
    <Footer />
  </>);
}

export default function SignupPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div>{t('signup.loading')}</div>}>
      <SignupContent />
    </Suspense>
  );
}
