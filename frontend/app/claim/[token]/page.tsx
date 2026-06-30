"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from '@/lib/cn';
import { useAppTheme } from '@/components/providers/ThemeProvider';


export default function ClaimPage() {
  const params = useParams() as any;
  const token = params.token as string;
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState(t("claim.processing"));
  const [personName, setPersonName] = useState('');
  const [personId, setPersonId] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.post('/claim', { token });
        
        if (res.data.personId) {
          try {
            const personRes = await api.get(`/people/${res.data.personId}`);
            setPersonName(personRes.data.name);
          } catch (err) {
            console.error('Failed to load person details');
          }
        }
        
        setPersonId(res.data.personId || '');
        setMessage(t("claim.success"));
        setStatus('success');
        
        setTimeout(() => {
          if (res.data.personId) {
            router.push(`/person/${res.data.personId}`);
          } else {
            router.push('/dashboard');
          }
        }, 3000);
      } catch (err: any) {
        console.error('Claim error:', err);
        setMessage(err?.response?.data?.error || t("claim.invalid"));
        setStatus('error');
      }
    })();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="rounded-2xl border-2 border-border bg-card shadow-pop-lg text-center p-12 space-y-6"
        >
          {status === 'processing' && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="mx-auto flex justify-center"
              >
                <Loader className="w-16 h-16 text-primary" />
              </motion.div>
              <h2 className={cn("text-2xl font-bold", theme.colors.text)}>{t("claim.processingTitle")}</h2>
              <p className={cn("text-base", theme.colors.textMuted)}>{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center"
              >
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              </motion.div>
              <h2 className={cn("text-2xl font-bold", "text-emerald-700 dark:text-emerald-400")}>{t("claim.successTitle")}</h2>
              {personName && (
                <p className={cn("text-lg font-medium", theme.colors.text)}>{personName}</p>
              )}
              <p className={cn("text-base", theme.colors.textMuted)}>{message}</p>
              <div className={cn("pt-6 border-t", "border-border")}>
                <p className={cn("text-sm mb-4", theme.colors.textMuted)}>{t("claim.redirecting")}</p>
                <motion.div
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                  className="h-1.5 bg-primary rounded-full"
                  initial={{ width: 0 }}
                />
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center"
              >
                <AlertCircle className="w-16 h-16 text-destructive" />
              </motion.div>
              <h2 className={cn("text-2xl font-bold", "text-destructive")}>{t("claim.errorTitle")}</h2>
              <p className={cn("text-base", "text-destructive/80")}>{message}</p>
              <motion.button
                onClick={() => router.push('/dashboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 bg-primary text-primary-foreground border-2 border-foreground rounded-full font-bold text-sm shadow-pop hover:shadow-pop hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-300"
              >
                {t("claim.backToDashboard")}
              </motion.button>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
