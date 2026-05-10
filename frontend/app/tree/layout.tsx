"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import supabase from '../../lib/supabaseClient';

export default function TreeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = localStorage.getItem('token');

        // Check if user has valid session or token
        if (!data.session && !token) {
          router.push('/login');
          return;
        }

        // Verify token is still valid by calling /auth/me
        try {
          await api.get('/auth/me');
        } catch (err) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
        }
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  return children;
}
