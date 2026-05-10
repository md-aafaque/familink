"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import supabase from '../../lib/supabaseClient';
import api from '../../lib/api';
import { Mail, Trees, Lock, Loader, ArrowRight } from 'lucide-react';
import AnimatedButton from '../../components/AnimatedButton';
import { AnimatedBackground } from '../../components/AnimatedBackground';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [useEmailLogin, setUseEmailLogin] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) return;
        if (session) {
          localStorage.setItem('token', session.access_token);
          router.push('/dashboard');
        }
      } catch (err) {
        // ignore
      }
    };
    checkSession();
  }, [router]);

  const signInWithGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/login' } });
    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.accessToken) {
        localStorage.setItem('token', res.data.accessToken);
        router.push('/dashboard');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error;
      if (errorMsg === 'Your account is pending admin approval') {
        setError('Your account is pending admin approval. You will receive an email when it\'s approved.');
      } else if (errorMsg === 'Your account has been rejected') {
        setError('Your account has been rejected. Please contact support.');
      } else {
        setError(errorMsg || 'Login failed. Please check your credentials.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <AnimatedBackground />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl border border-white/20 shadow-2xl p-8">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="p-3 bg-gradient-to-br from-orange-600 to-blue-500 rounded-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Trees className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-blue-500 bg-clip-text text-transparent">Family Tree</h1>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-600">Sign in to your account</p>
          </motion.div>

          {useEmailLogin ? (
            /* Email/Password Login Form */
            <motion.form
              onSubmit={handleEmailLogin}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <motion.div
                  className="relative"
                  whileFocus="focus"
                  initial="normal"
                >
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <motion.input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    disabled={loading}
                    whileFocus={{
                      boxShadow: '0 0 0 3px rgba(234, 88, 12, 0.1)',
                    }}
                  />
                </motion.div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <motion.div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <motion.input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    disabled={loading}
                    whileFocus={{
                      boxShadow: '0 0 0 3px rgba(234, 88, 12, 0.1)',
                    }}
                  />
                </motion.div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <AnimatedButton type="submit" disabled={loading} className="w-full" size="md">
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </AnimatedButton>

              <motion.button
                type="button"
                onClick={() => {
                  setUseEmailLogin(false);
                  setError('');
                  setEmail('');
                  setPassword('');
                }}
                className="w-full text-orange-600 hover:text-orange-700 font-medium py-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Use OAuth Instead
              </motion.button>
            </motion.form>
          ) : (
            /* OAuth Options */
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                {/* Google Sign In */}
                <motion.button
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white border-2 border-slate-300 text-slate-900 font-medium hover:border-orange-400 shadow-sm transition-all"
                  whileHover={{ y: -2, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? 'Redirecting...' : 'Sign in with Google'}
                </motion.button>

                {/* Gmail Sign In */}
                <motion.button
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:from-red-600 hover:to-red-700 shadow-md transition-all"
                  whileHover={{ y: -2, boxShadow: '0 15px 30px rgba(239,68,68,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Mail className="w-5 h-5" />
                  {loading ? 'Redirecting...' : 'Sign in with Gmail'}
                </motion.button>
              </div>

              {/* Divider */}
              <motion.div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">or</span>
                </div>
              </motion.div>

              {/* Email/Password Link */}
              <motion.button
                onClick={() => setUseEmailLogin(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-100 text-slate-900 font-medium hover:bg-slate-200 transition-colors"
                whileHover={{ scale: 1.02, backgroundColor: '#e2e8f0' }}
                whileTap={{ scale: 0.98 }}
              >
                <Mail className="w-5 h-5" />
                Sign in with Email
              </motion.button>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 pt-6 border-t border-slate-200"
          >
            <p className="text-sm text-slate-600 text-center">
              Don't have an account?{' '}
              <motion.button
                onClick={() => router.push('/signup')}
                className="text-orange-600 hover:text-orange-700 font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign up
              </motion.button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}