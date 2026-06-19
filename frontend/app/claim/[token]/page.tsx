"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function ClaimPage() {
  const params = useParams() as any;
  const token = params.token as string;
  const { t } = useLanguage();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState(t("claim.processing"));
  const [personName, setPersonName] = useState('');
  const [personId, setPersonId] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.post('/claim', { token });
        
        // Get person details
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
        
        // Redirect after 3 seconds
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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-50 to-accent-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="card text-center py-12">
          {status === 'processing' && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="mx-auto mb-6 flex justify-center"
              >
                <Loader className="w-16 h-16 text-primary-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{t("claim.processingTitle")}</h2>
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center mb-6"
              >
                <CheckCircle className="w-16 h-16 text-green-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">{t("claim.successTitle")}</h2>
              {personName && (
                <p className="text-lg font-medium text-slate-900 mb-2">{personName}</p>
              )}
              <p className="text-slate-600 mb-6">{message}</p>
              <div className="pt-6 border-t border-slate-100">
                <p className="text-sm text-slate-600 mb-4">{t("claim.redirecting")}</p>
                <motion.div
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                  className="h-1 bg-green-500 rounded"
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
                className="flex justify-center mb-6"
              >
                <AlertCircle className="w-16 h-16 text-red-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-red-700 mb-2">{t("claim.errorTitle")}</h2>
              <p className="text-red-600 mb-6">{message}</p>
              <motion.button
                onClick={() => router.push('/dashboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary w-full"
              >
                {t("claim.backToDashboard")}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
