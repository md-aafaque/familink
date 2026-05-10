"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { Mail, Lock, User, Loader, Trees, Check, ArrowRight } from 'lucide-react';
import { AnimatedButton } from '../../components/AnimatedButton';
import { AnimatedBackground } from '../../components/AnimatedBackground';

export default function SignupPage() {
  const router = useRouter();
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

    // Validation
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
      const res = await api.post('/auth/signup', {
        name,
        email,
        password,
      });

      setSuccess(true);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <AnimatedBackground />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl border border-white/20 shadow-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 bg-linear-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1 }}>
                <Check className="w-8 h-8 text-white" />
              </motion.div>
            </motion.div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Signup Successful!</h2>
            <p className="text-slate-600 mb-6">
              Your account has been created and is pending admin approval. You'll receive an email once it's approved.
            </p>
            <p className="text-sm text-slate-500 mb-6 animate-pulse">Redirecting to login...</p>
            
            <AnimatedButton
              onClick={() => router.push('/login')}
              variant="primary"
              className="w-full"
            >
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </AnimatedButton>
          </div>
        </motion.div>
      </div>
    );
  }

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
                className="p-3 bg-linear-to-br from-orange-600 to-blue-500 rounded-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Trees className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-orange-600 to-blue-500 bg-clip-text text-transparent">Family Tree</h1>
            </div>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-600">Join our family tree community</p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <motion.div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <motion.input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  disabled={loading}
                  whileFocus={{
                    boxShadow: '0 0 0 3px rgba(234, 88, 12, 0.1)',
                  }}
                />
              </motion.div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <motion.div className="relative">
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

            {/* Password Field */}
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

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
              <motion.div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <motion.input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  disabled={loading}
                  whileFocus={{
                    boxShadow: '0 0 0 3px rgba(234, 88, 12, 0.1)',
                  }}
                />
              </motion.div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <AnimatedButton
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full mt-6"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </AnimatedButton>
          </motion.form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 pt-6 border-t border-slate-200 text-center"
          >
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <motion.button
                onClick={() => router.push('/login')}
                className="text-orange-600 hover:text-orange-700 font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign in
              </motion.button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
