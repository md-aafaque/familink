"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import DataState from "@/components/shared/DataState";
import { History, User, Calendar, Tag, ChevronDown, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatDateTime } from "@/lib/dateUtils";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/components/providers/ThemeProvider";
import CustomSelect from "@/components/ui/CustomSelect";

export default function AuditLogsPage() {
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const { theme } = useAppTheme();

  // Fetch trees first
  const { data: trees } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await api.get("/trees");
      return (res as any).data;
    },
  });

  // Set default selection
  useEffect(() => {
    if (!selectedTreeId && trees?.length) {
      const adminTree = trees.find((t: any) => t.role === 'admin');
      setSelectedTreeId(adminTree?.id || trees[0].id);
    }
  }, [trees, selectedTreeId]);

  const { data: logs, isLoading, isError, error } = useQuery({
    queryKey: ["tree-audit-logs", selectedTreeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${selectedTreeId}/audit-logs`);
      return (res as any).data;
    },
    enabled: !!selectedTreeId,
  });

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'text-green-600 bg-green-50 border-green-100';
    if (action.includes('deleted')) return 'text-red-600 bg-red-50 border-red-100';
    if (action.includes('updated')) return cn(theme.colors.accent, theme.colors.primaryMuted, "border-primary/10");
    if (action.includes('approved')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (action.includes('rejected')) return 'text-rose-600 bg-rose-50 border-rose-100';
    return cn(theme.colors.textMuted, theme.colors.bg, theme.colors.border);
  };

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className={cn("text-4xl font-black tracking-tight", theme.colors.text)}>
          Audit <span className={theme.colors.accent}>History</span>
        </h1>
        <p className={cn("text-lg max-w-2xl", theme.colors.textMuted)}>
          Track every important action in your family tree. 
          A permanent record of changes to ensure data integrity and accountability.
        </p>
      </header>

      {/* Tree Selector */}
      <section className="relative">
        <div className={cn("p-8 rounded-[2.5rem] shadow-xl overflow-hidden transition-colors", theme.isDark ? "bg-slate-900" : "bg-slate-900")}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Activity className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Select Family Tree</h3>
              <p className="text-slate-300 font-medium">Viewing history for the selected workspace</p>
            </div>
            <div className="min-w-[300px]">
              <CustomSelect
                options={trees?.map((tree: any) => ({ 
                  value: tree.id, 
                  label: `${tree.name} (${tree.role})` 
                })) || []}
                value={selectedTreeId ?? ""}
                onChange={(val) => setSelectedTreeId(val || null)}
                placeholder={!trees ? "Loading trees..." : "Select Family Tree"}
                size="lg"
              />
            </div>
          </div>
        </div>
      </section>

      <DataState isLoading={isLoading} isError={isError} error={error as Error}>
        <div className="space-y-4">
          {logs?.length > 0 ? (
            logs.map((log: any, idx: number) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn("p-6 rounded-3xl border shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row items-center justify-between gap-6", theme.colors.surface, theme.colors.border)}
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                    getActionColor(log.actionType)
                  )}>
                    <History className="w-6 h-6" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border transition-colors",
                        getActionColor(log.actionType)
                      )}>
                        {log.actionType.replace('_', ' ')}
                      </span>
                      <span className={cn("text-xs font-bold opacity-50", theme.colors.text)}>
                        {log.entityType} ID: {log.entityId.substring(0, 8)}...
                      </span>
                    </div>
                    <p className={cn("font-bold", theme.colors.text)}>
                      {log.actorName} performed <span className={theme.colors.accent}>{log.actionType.replace('_', ' ')}</span>
                    </p>
                  </div>
                </div>

                <div className={cn("flex items-center gap-8 text-sm w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0", theme.colors.border)}>
                   <div className={cn("flex items-center gap-2", theme.colors.textMuted)}>
                      <User className="w-4 h-4" />
                      <span className="font-medium">{log.actorEmail}</span>
                   </div>
                   <div className={cn("flex items-center gap-2", theme.colors.textMuted)}>
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{formatDateTime(log.createdAt)}</span>
                   </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className={cn("border-2 border-dashed rounded-[2.5rem] p-16 text-center space-y-4", theme.colors.surface, theme.colors.border)}>
              <History className={cn("w-16 h-16 mx-auto opacity-20", theme.colors.text)} />
              <h3 className={cn("text-xl font-bold", theme.colors.text)}>No history yet</h3>
              <p className={theme.colors.textMuted}>Activity logs will appear here once actions are performed in this tree.</p>
            </div>
          )}
        </div>
      </DataState>
    </div>
  );
}
