"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trees, Users, Share2, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { FloatingIcon } from '../components/FloatingIcon';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = localStorage.getItem('token');
        
        if (data.session || token) {
          // User is logged in, redirect to dashboard
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
      <div className="flex items-center justify-center min-h-[600px]">
        <motion.div
          className="text-center"
          animate={{ scale: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Trees className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 space-y-20">
        {/* Hero Section */}
        <section className="text-center py-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-3 mb-6 px-4 py-2 bg-orange-50/80 backdrop-blur-sm rounded-full border border-orange-200/50"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity }}>
              <Sparkles className="w-5 h-5 text-orange-600" />
            </motion.div>
            <span className="text-sm font-semibold text-orange-700">Welcome to Family Tree</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-blue-500 bg-clip-text text-transparent mb-6 leading-tight">
              Preserve Your Family Legacy
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-slate-600 max-w-2xl mx-auto mb-10"
          >
            Connect, document, and share your family's story across generations. Build your family tree with an intuitive and secure platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <AnimatedButton onClick={() => router.push('/signup')} variant="primary" size="lg">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </AnimatedButton>
            <AnimatedButton onClick={() => router.push('/login')} variant="outline" size="lg">
              Sign In
            </AnimatedButton>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-bold text-center mb-16"
          >
            Why Choose{' '}
            <span className="bg-gradient-to-r from-orange-600 to-blue-500 bg-clip-text text-transparent">
              Family Tree?
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <AnimatedCard delay={0} hover>
              <FloatingIcon delay={0} className="mb-4">
                <motion.div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center">
                  <Users className="w-7 h-7 text-blue-600" />
                </motion.div>
              </FloatingIcon>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Connect Family Members</h3>
              <p className="text-slate-600 leading-relaxed">
                Easily add family members and create meaningful connections across your entire family tree.
              </p>
            </AnimatedCard>

            {/* Feature 2 */}
            <AnimatedCard delay={0.1} hover>
              <FloatingIcon delay={1} className="mb-4">
                <motion.div className="bg-green-100 w-14 h-14 rounded-lg flex items-center justify-center">
                  <Share2 className="w-7 h-7 text-green-600" />
                </motion.div>
              </FloatingIcon>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Share Your Story</h3>
              <p className="text-slate-600 leading-relaxed">
                Share your family's history and stories with relatives across the globe securely.
              </p>
            </AnimatedCard>

            {/* Feature 3 */}
            <AnimatedCard delay={0.2} hover>
              <FloatingIcon delay={2} className="mb-4">
                <motion.div className="bg-purple-100 w-14 h-14 rounded-lg flex items-center justify-center">
                  <Lock className="w-7 h-7 text-purple-600" />
                </motion.div>
              </FloatingIcon>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Secure & Private</h3>
              <p className="text-slate-600 leading-relaxed">
                Your family data is encrypted and protected with industry-leading security standards.
              </p>
            </AnimatedCard>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative max-w-4xl mx-auto"
          >
            {/* Animated background glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-600 to-blue-500 rounded-3xl blur-2xl opacity-50"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            {/* Content */}
            <div className="relative bg-gradient-to-r from-orange-600 to-blue-500 rounded-3xl px-8 py-16 sm:px-16 text-white text-center overflow-hidden">
              {/* Animated shapes */}
              <motion.div
                className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"
                animate={{ x: [0, 30, 0], y: [0, 30, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"
                animate={{ x: [0, -30, 0], y: [0, -30, 0] }}
                transition={{ duration: 8, repeat: Infinity }}
              />

              {/* Text content */}
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Build Your Family Tree?</h2>
                <p className="text-lg opacity-95 mb-8 max-w-2xl mx-auto">
                  Join thousands of families preserving their legacy. Start for free today.
                </p>
                <AnimatedButton
                  onClick={() => router.push('/signup')}
                  className="!bg-white !text-orange-600 hover:!bg-slate-50"
                  size="lg"
                >
                  Create Your Account
                  <ArrowRight className="w-5 h-5" />
                </AnimatedButton>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
