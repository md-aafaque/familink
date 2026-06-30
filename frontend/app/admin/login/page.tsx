"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Mail, Lock, Loader, Shield } from 'lucide-react';
import BrandLogo from "@/components/shared/BrandLogo";
import PageBackground from '@/components/decorations/PageBackground';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password required');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });

      if (!res.data.accessToken) {
        setError('Login failed');
        return;
      }

      if (res.data.user?.role !== 'admin') {
        setError('Admin access required');
        return;
      }

      localStorage.setItem('token', res.data.accessToken);
      router.push('/admin');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error;
      setError(errorMsg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-12 px-4 relative overflow-hidden">
      <PageBackground variant="admin" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="rounded-2xl border-2 border-border bg-card p-8 md:p-10 shadow-pop-lg"
        >
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <BrandLogo className="w-10 h-10" />
              <h1 className="text-3xl font-bold text-foreground">
                Fami<span className="text-primary">Link</span>
              </h1>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Admin Login</h2>
            </div>
            <p className="text-muted-foreground">Sign in to your admin account</p>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              This admin portal is restricted to authorized administrators only.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Email Address <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full h-12 rounded-xl border-2 border-border bg-input pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:shadow-pop-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full h-12 rounded-xl border-2 border-border bg-input pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:shadow-pop-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                {error}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-full h-12 bg-primary text-primary-foreground border-2 border-foreground rounded-full font-bold text-sm shadow-pop hover:shadow-pop hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#1E293B] dark:active:shadow-[2px_2px_0px_0px_#000000] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-pop"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Need a regular account?{' '}
              <button
                onClick={() => router.push('/signup')}
                className="text-primary hover:text-primary/80 font-bold"
              >
                Sign up here
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
