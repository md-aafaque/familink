"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trees, Users, Share2, Shield, ArrowRight, Activity } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = localStorage.getItem('token');
        
        if (data.session || token) {
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Family<span className="text-primary">Nexus</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/login')} className="text-sm font-semibold hover:text-primary transition-colors">
            Sign In
          </button>
          <button 
            onClick={() => router.push('/signup')} 
            className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 transition-colors shadow-sm"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <section className="max-w-7xl mx-auto px-6 py-24 md:py-32 text-center border-b border-border/50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-bold uppercase tracking-widest mb-6"
          >
            Preserve Your Heritage
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-[1.1]"
          >
            Document your family's <span className="text-primary">legacy</span> for generations.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            A minimalist, secure platform to build your family tree, share historical records, and stay connected with your roots.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button 
              onClick={() => router.push('/signup')} 
              className="px-8 py-4 bg-primary text-primary-foreground rounded-md text-base font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
            >
              Start Your Tree Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => router.push('/login')} 
              className="px-8 py-4 bg-background border border-border text-foreground rounded-md text-base font-bold hover:bg-muted transition-colors shadow-sm"
            >
              Learn More
            </button>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-3 gap-16 md:gap-12">
            <div className="space-y-4">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Collaborative Building</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Invite family members to contribute stories, photos, and records to build a comprehensive history together.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-md flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Secure Sharing</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Granular permission controls ensure your family data is only visible to those you explicitly authorize.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Privacy First</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Industry-standard encryption protects your sensitive records. Your data belongs to you, always.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 opacity-60 grayscale">
            <div className="w-6 h-6 bg-foreground rounded flex items-center justify-center">
              <Activity className="w-4 h-4 text-background" />
            </div>
            <span className="text-sm font-bold tracking-tight">FamilyNexus</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            © 2026 FamilyNexus. All rights reserved. Built for legacy.
          </p>
        </footer>
      </main>
    </div>
  );
}
