"use client";

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Loader2, Heart } from 'lucide-react';
import { cn } from '../../../lib/cn';
import dynamic from 'next/dynamic';
import { useAppTheme } from '../../../components/providers/ThemeProvider';
import { useLanguage } from '../../../components/providers/LanguageProvider';


const FamilyTreeContainer = dynamic(() => import('../../../components/tree/FamilyTreeContainer'), {
  ssr: false,
});

function UnifiedLoader({ text }: { text: string }) {
  const { theme } = useAppTheme();
  return (
    <div className={cn("flex flex-col items-center justify-center h-full w-full gap-5 bg-background relative overflow-hidden")}>

      <div className="relative z-10 w-14 h-14">
        <div className={cn("absolute inset-0 rounded-full border-[2.5px] border-t-2 animate-spin", "border-border border-t-primary")} />
        <Heart className={cn("absolute inset-0 m-auto w-4 h-4 opacity-50", "text-primary")} />
      </div>
      <p className={cn("relative z-10 text-[11px] font-semibold uppercase tracking-[0.35em]", theme.colors.textMuted)}>{text}</p>
    </div>
  );
}

export default function TreePage() {
  const params = useParams();
  const id = params.id as string;
  const { theme } = useAppTheme();
  const { t } = useLanguage();

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
      <div className={cn("flex flex-col w-full h-full overflow-hidden", theme.colors.bg)}>
        <UnifiedLoader text={t('tree.loading')} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full h-full overflow-hidden", theme.colors.bg)}>
      <div className="flex-1 relative w-full overflow-hidden">
        <FamilyTreeContainer treeId={id} />
      </div>
    </div>
  );
}
