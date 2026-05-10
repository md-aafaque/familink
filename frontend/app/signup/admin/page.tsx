"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { ArrowLeft, Mail, Lock, User, Shield, Loader } from 'lucide-react';

export default function AdminSignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in to create an admin account');
          setChecking(false);
          return;
        }

        const res = await api.get('/auth/me');
        if (res.data.role === 'admin') {
          setIsAdmin(true);
        } else {
          setError('Only existing admins can create new admin accounts');
        }
      } catch (err) {
        setError('Authentication failed. Please log in as an admin first.');
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, []);

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
      const res = await api.post('/auth/signup/admin', {
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
        router.push('/admin/dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Admin creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying admin privileges...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✕</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">
            Only existing admin accounts can create new admin accounts. If you're an admin, please log in first.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary w-full"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Account Created!</h2>
          <p className="text-slate-600 mb-6">
            The new admin account is ready to use immediately.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Redirecting to admin dashboard...
          </p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="btn-primary w-full"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Create Admin Account</h2>
          </div>
          <p className="text-slate-600 mb-6">Create a new administrator account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Admin Name"
                  className="w-full input-field pl-10"
                  disabled={loading}
                />
              </div>
            </div>

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

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
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
                  Creating Admin...
                </>
              ) : (
                'Create Admin Account'
              )}
            </button>
          </form>

          {/* Info Note */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-600 text-center">
              Admin accounts are created immediately and do not require approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
