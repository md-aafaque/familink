"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
        
        await api.get('/auth/me');
        setIsLoading(false);
      } catch (err) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-600" />
      </div>
    );
  }

  return children;
}
