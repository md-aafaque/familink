"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../../lib/api';
import { Mail, Lock, User, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import BrandLogo from "@/components/shared/BrandLogo";
import { useAppTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/cn';


export default function AdminSetupPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const { theme } = useAppTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/admin/setup', {
        token,
        name,
        email,
        password,
      });

      setSuccess(true);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/admin/login');
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">

        <div className="rounded-2xl border-2 border-border bg-card shadow-pop-lg max-w-md text-center p-12 space-y-6 relative z-10">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200 dark:border-emerald-700">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className={cn("text-2xl font-bold", theme.colors.text)}>Account Created!</h2>
          <p className={cn("text-base", theme.colors.textMuted)}>
            Your admin account has been successfully set up. You can now sign in with your credentials.
          </p>
          <p className={cn("text-sm", theme.colors.textMuted)}>Redirecting to admin login...</p>
          <button
            onClick={() => router.push('/admin/login')}
            className="w-full py-4 bg-primary text-primary-foreground border-2 border-foreground rounded-full font-bold text-sm shadow-pop hover:shadow-pop hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-300"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 relative overflow-hidden">

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-2xl border-2 border-border bg-card shadow-pop-lg p-8 md:p-10">
          <div className="text-center mb-8 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <BrandLogo className="w-10 h-10" />
            </div>
            <h2 className={cn("text-2xl font-bold", theme.colors.text)}>Set Up Admin Account</h2>
            <p className={cn("text-sm", theme.colors.textMuted)}>Complete your admin account setup</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={cn("block text-sm font-bold mb-2", theme.colors.text)}>
                Full Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-border bg-input text-foreground text-sm outline-none focus:border-primary focus:shadow-pop-sm transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className={cn("block text-sm font-bold mb-2", theme.colors.text)}>
                Email Address <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-border bg-input text-foreground text-sm outline-none focus:border-primary focus:shadow-pop-sm transition-all"
                  disabled={loading}
                />
              </div>
              <p className={cn("text-xs mt-1.5", theme.colors.textMuted)}>
                This should match the email address from your invite
              </p>
            </div>

            <div>
              <label className={cn("block text-sm font-bold mb-2", theme.colors.text)}>
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-border bg-input text-foreground text-sm outline-none focus:border-primary focus:shadow-pop-sm transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className={cn("block text-sm font-bold mb-2", theme.colors.text)}>
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-border bg-input text-foreground text-sm outline-none focus:border-primary focus:shadow-pop-sm transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-primary-foreground border-2 border-foreground rounded-full font-bold text-sm shadow-pop hover:shadow-pop hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#1E293B] dark:active:shadow-[2px_2px_0px_0px_#000000] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-pop"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Setting Up...
                </>
              ) : (
                'Set Up Admin Account'
              )}
            </button>
          </form>

          <div className={cn("mt-6 p-3 rounded-xl bg-primary/10 border border-primary/20")}>
            <p className={cn("text-xs", "text-primary")}>
              After setup, you'll be able to sign in at the admin login page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
