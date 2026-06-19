"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../../../lib/api";
import DataState from "../../../components/shared/DataState";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { 
  TreeDeciduous, 
  ArrowRight, 
  Shield, 
  Users, 
  Eye, 
  CheckCircle2, 
  Clock,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../../lib/cn";

export default function JoinTreePage() {
  const { token } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const invitationRoute = `/join/${token}`;

  const { data: invite, isLoading, isError, error } = useQuery({
    queryKey: ["public-invitation", token],
    queryFn: async () => {
      const res = await api.get(`/invitations/${token}`);
      return (res as any).data;
    },
    enabled: !!token,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/invitations/${token}/accept`);
      return res as any;
    },
    onSuccess: (data) => {
      if (data.status === 'pending') {
        router.push('/dashboard?message=Request submitted for approval');
      } else {
        router.push(`/tree/${data.treeId}`);
      }
    },
    onError: (err: any) => {
      const message = typeof err === 'string' ? err : err?.message?.toString?.() || '';
      if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('unauthorised')) {
        router.push(`/login?redirect=${encodeURIComponent(invitationRoute)}&message=Please sign in to accept this invitation`);
      }
    },
  });

  const handleAccept = () => {
    const tokenValue = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!tokenValue) {
      router.push(`/login?redirect=${encodeURIComponent(invitationRoute)}&message=Please sign in to accept this invitation`);
      return;
    }
    joinMutation.mutate();
  };

  const roleInfo = {
    member: { icon: Users, color: 'bg-violet-100 text-violet-600', label: t("role.member") },
    viewer: { icon: Eye, color: 'bg-slate-100 text-slate-600', label: t("role.viewer") },
    admin: { icon: Shield, color: 'bg-indigo-100 text-indigo-600', label: t("role.admin") },
  }[invite?.invitationType as 'member' | 'viewer' | 'admin'] || { icon: TreeDeciduous, color: 'bg-slate-100 text-slate-600', label: t("role.member") };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <DataState isLoading={isLoading} isError={isError} error={error as Error}>
          {invite && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-500/10 border border-slate-100 overflow-hidden"
            >
              <div className="bg-linear-to-br from-indigo-500 to-indigo-600 p-12 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Sparkles className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto border border-white/30 shadow-xl">
                    <TreeDeciduous className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-3xl font-black tracking-tight">{t("join.invitedTo")}</h1>
                  <p className="text-indigo-100 font-medium">{t("join.subtitle")}</p>
                </div>
              </div>

              <div className="p-12 space-y-10">
                <div className="flex items-start gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm", roleInfo.color)}>
                    <roleInfo.icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900">{t("join.role")}: {roleInfo.label}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {t("join.viewDesc")}
                      {invite.invitationType === 'member' && t("join.memberDesc")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-sm text-slate-400 font-medium px-2">
                     <Clock className="w-4 h-4" />
                     <span>{t("join.expiresOn")} {new Date(invite.expiresAt).toLocaleDateString()}</span>
                   </div>
                   
                   <button
                    onClick={handleAccept}
                    disabled={joinMutation.isPending}
                    className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {joinMutation.isPending ? t("join.requestSubmitted") : t("join.accept")}
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {joinMutation.isError && (
                    <p className="text-center text-sm text-red-600 mt-3">{(joinMutation.error as Error)?.message}</p>
                  )}

                  <p className="text-center text-xs text-slate-400 px-8 leading-relaxed">
                    {t("join.privacyNotice")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </DataState>
      </div>
    </div>
  );
}
