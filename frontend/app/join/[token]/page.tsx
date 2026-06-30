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
    member: { icon: Users, color: 'bg-primary/10 text-primary', label: t("role.member") },
    viewer: { icon: Eye, color: 'bg-muted text-muted-foreground', label: t("role.viewer") },
    admin: { icon: Shield, color: 'bg-secondary/10 text-secondary', label: t("role.admin") },
  }[invite?.invitationType as 'member' | 'viewer' | 'admin'] || { icon: TreeDeciduous, color: 'bg-muted text-muted-foreground', label: t("role.member") };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">

      <div className="max-w-xl w-full relative z-10">
        <DataState isLoading={isLoading} isError={isError} error={error as Error}>
          {invite && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-[3rem] border-2 border-border bg-card shadow-pop-lg overflow-hidden"
            >
              <div className="bg-primary p-12 text-primary-foreground text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Sparkles className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto border-2 border-white/30 shadow-pop-lg">
                    <TreeDeciduous className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-3xl font-black tracking-tight">{t("join.invitedTo")}</h1>
                  <p className="text-primary-foreground/80 font-medium">{t("join.subtitle")}</p>
                </div>
              </div>

              <div className="p-12 space-y-10">
                <div className="flex items-start gap-6 p-6 bg-muted rounded-3xl border border-border">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", roleInfo.color)}>
                    <roleInfo.icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground">{t("join.role")}: {roleInfo.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("join.viewDesc")}
                      {invite.invitationType === 'member' && t("join.memberDesc")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium px-2">
                     <Clock className="w-4 h-4" />
                     <span>{t("join.expiresOn")} {new Date(invite.expiresAt).toLocaleDateString()}</span>
                   </div>
                   
                   <motion.button
                    onClick={handleAccept}
                    disabled={joinMutation.isPending}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-pop border-2 border-foreground transition-all flex items-center justify-center gap-3 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-pop active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#1E293B] dark:active:shadow-[2px_2px_0px_0px_#000000] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                  >
                    {joinMutation.isPending ? t("join.requestSubmitted") : t("join.accept")}
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>

                  {joinMutation.isError && (
                    <p className="text-center text-sm text-destructive mt-3">{(joinMutation.error as Error)?.message}</p>
                  )}

                  <p className="text-center text-xs text-muted-foreground px-8 leading-relaxed">
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
