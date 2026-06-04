"use client";

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/cn';
import dynamic from 'next/dynamic';
import { useAppTheme } from '../../../components/providers/ThemeProvider';

const FamilyTreeContainer = dynamic(() => import('../../../components/tree/FamilyTreeContainer'), {
  ssr: false,
  loading: () => {
    const { theme } = useAppTheme();
    return (
      <div className={cn("flex flex-col items-center justify-center h-full w-full space-y-4 transition-colors duration-500", theme.colors.bg)}>
        <Loader2 className={cn("w-12 h-12 animate-spin", theme.colors.accent)} />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Loading Family Artifact</p>
      </div>
    );
  },
});

export default function TreePage() {
  const params = useParams();
  const id = params.id as string;
  const { theme } = useAppTheme();

  const { data: treeData, isLoading: treeLoading } = useQuery({
    queryKey: ['tree', id],
    queryFn: async () => {
      const response = await api.get(`/trees/${id}`);
      return (response as any).data;
    },
    enabled: !!id,
  });

  if (treeLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full w-full space-y-4", theme.colors.bg)}>
        <Loader2 className={cn("w-12 h-12 animate-spin", theme.colors.accent)} />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Fetching Tree Metadata</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 top-16 flex flex-col overflow-hidden">
      {/* Immersive Workspace Container */}
      <div className="flex-1 relative w-full overflow-hidden">
        <FamilyTreeContainer treeId={id} />
      </div>
    </div>
  );
}
