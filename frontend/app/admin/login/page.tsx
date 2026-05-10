"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { Mail, Lock, Loader, Shield, Trees } from 'lucide-react';

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
      // Use regular login endpoint
      const res = await api.post('/auth/login', { email, password });

      if (!res.data.accessToken) {
        setError('Login failed');
        return;
      }

      // Check if user is admin
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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="card">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-linear-to-br from-orange-600 to-blue-500 rounded-lg">
                <Trees className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-orange-600 to-blue-500 bg-clip-text text-transparent">Family Tree</h1>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Admin Login</h2>
            </div>
            <p className="text-slate-600">Sign in to your admin account</p>
          </div>

          {/* Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <p className="text-sm text-amber-800">
              🔒 This admin portal is restricted to authorized administrators only. If you don't have an admin account, please contact your administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full input-field pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full input-field pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Need a regular account?{' '}
              <button
                onClick={() => router.push('/signup')}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
