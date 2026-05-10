"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../../lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setChecking(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/admin/login');
          return;
        }

        const res = await api.get('/auth/me');
        if (res.data.role === 'admin') {
          setIsAdmin(true);
        } else {
          router.push('/');
        }
      } catch (err) {
        router.push('/admin/login');
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying admin privileges...</p>
        </div>
      </div>
    );
  }

  // Allow admin login page even if not authenticated
  if (pathname === '/admin/login') {
    return children;
  }

  if (!isAdmin) {
    return null;
  }

  return children;
}
