"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import supabase from '../lib/supabaseClient';
import { LogOut, Home, Trees, Shield, UserPlus } from 'lucide-react';
import NotificationsMenu from './NotificationsMenu';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const token = data.session.access_token;
          localStorage.setItem('token', token);
          setUser(data.session.user);
          
          // Check if user is admin
          try {
            const res = await api.get('/auth/me');
            if (res.data.role === 'admin') {
              setIsAdmin(true);
            }
          } catch (err) {
            // Silently fail if not authenticated
          }
        } else {
          const t = localStorage.getItem('token');
          if (t) {
            setUser({ id: 'unknown' });
            // Try to get user role from API
            try {
              const res = await api.get('/auth/me');
              if (res.data.role === 'admin') {
                setIsAdmin(true);
              }
            } catch (err) {
              // Silently fail
            }
          }
        }
      } catch (err) {
        // Silently fail
      }
    };
    
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem('token', session.access_token);
        setUser(session.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    setUser(null);
    setIsAdmin(false);
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Trees className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-blue-500 bg-clip-text text-transparent">Family Tree</span>
            </a>
            {user && (
              <nav className="flex items-center gap-6">
                <a href="/dashboard" className="flex items-center gap-2 text-slate-700 hover:text-orange-600 transition-colors font-medium">
                  <Home className="w-5 h-5" />
                  Dashboard
                </a>
                {isAdmin && (
                  <a href="/admin/pending-users" className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors font-medium">
                    <Shield className="w-5 h-5" />
                    Admin
                  </a>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <NotificationsMenu />
                <div className="text-right">
                  <p className="text-sm text-slate-600">Welcome back</p>
                  <p className="font-semibold text-slate-900">{user.email || user.id}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 btn-secondary"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <a href="/signup" className="flex items-center gap-2 btn-primary">
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </a>
                <a href="/login" className="btn-secondary">Sign In</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}