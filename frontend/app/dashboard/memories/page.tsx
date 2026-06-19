"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/cn';
import { useAppTheme } from '@/components/providers/ThemeProvider';
import { 
  ImageIcon, 
  Plus, 
  Search, 
  ChevronDown, 
  LayoutGrid, 
  LayoutList
} from 'lucide-react';
import MemoryCard from '@/components/memories/MemoryCard';
import MemoryModal from '@/components/memories/MemoryModal';
import { Memory } from '@/lib/shared/schemas/memories';
import { useAuth } from '@/components/providers/AuthProvider';
import DataState from '@/components/shared/DataState';
import CustomSelect from '@/components/ui/CustomSelect';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function FamilyWallPage() {
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch user's trees to select one
  const { data: trees, isLoading: treesLoading } = useQuery({
    queryKey: ['trees'],
    queryFn: async () => {
      const res = await api.get('/trees');
      return (res as any).data;
    },
    enabled: !!user,
  });

  // Automatically select the first tree if none selected
  useEffect(() => {
    if (trees && trees.length > 0 && !selectedTreeId) {
      setSelectedTreeId(trees[0].id);
    }
  }, [trees, selectedTreeId]);

  // Fetch memories for the selected tree
  const { data: memories, isLoading: memoriesLoading, isError, error } = useQuery({
    queryKey: ['memories', selectedTreeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${selectedTreeId}/memories?limit=100`);
      return (res as any).data;
    },
    enabled: !!selectedTreeId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/trees/${selectedTreeId}/memories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', selectedTreeId] });
    },
  });

  const handleEdit = (memory: Memory) => {
    setSelectedMemory(memory);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMemory(null);
  };

  const filteredMemories = memories?.filter((m: Memory) => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl", theme.colors.primaryMuted)}>
              <ImageIcon className={cn("w-6 h-6", theme.colors.accent)} />
            </div>
            <h1 className={cn("text-3xl font-black uppercase tracking-tight", theme.colors.text)}>
              {t('memories.title')}
            </h1>
          </div>
          <p className={cn("text-sm max-w-lg", theme.colors.textMuted)}>
            {t('memories.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedTreeId}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]",
            !selectedTreeId && "opacity-50 cursor-not-allowed"
          )}
        >
          <Plus className="w-5 h-5" />
          {t('memories.add')}
        </button>
      </div>

      {/* Toolbar */}
      <div className={cn(
        "p-4 rounded-2xl border flex flex-col md:flex-row gap-4 items-center justify-between",
        theme.colors.surface,
        theme.colors.border
      )}>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Tree Selector */}
          <div className="min-w-[200px]">
            <CustomSelect
                options={trees?.map((tree: any) => ({ value: tree.id, label: tree.name })) || []}
                value={selectedTreeId || ''}
                onChange={(val) => setSelectedTreeId(val)}
                placeholder={treesLoading ? t('memories.loadingTrees') : t('memories.selectTree')}
                size="sm"
            />
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40", theme.colors.text)} />
            <input
              type="text"
              placeholder={t('memories.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-xl border outline-none text-sm transition-all focus:ring-2 focus:ring-primary/20",
                theme.colors.bg,
                theme.colors.border,
                theme.colors.text
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Filter Type */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { key: 'all', label: t('memories.filter.all') },
              { key: 'milestone', label: t('memories.filter.milestone') },
              { key: 'story', label: t('memories.filter.story') },
              { key: 'photo', label: t('memories.filter.photo') },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilterType(item.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  filterType === item.key 
                    ? "bg-white dark:bg-slate-700 shadow-sm text-primary" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center border rounded-xl overflow-hidden" style={{ borderColor: theme.colors.border }}>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 transition-colors", viewMode === 'grid' ? "bg-primary text-primary-foreground" : cn(theme.colors.bg, theme.colors.textMuted))}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-2 transition-colors", viewMode === 'list' ? "bg-primary text-primary-foreground" : cn(theme.colors.bg, theme.colors.textMuted))}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <DataState
        isLoading={memoriesLoading}
        isError={isError}
        error={error as Error}
      >
        {filteredMemories && filteredMemories.length > 0 ? (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {filteredMemories.map((memory: Memory) => (
              <MemoryCard 
                key={memory.id} 
                memory={memory} 
                isOwner={memory.posterId === user?.id}
                onEdit={handleEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        ) : (
          <div className={cn(
            "flex flex-col items-center justify-center p-20 rounded-3xl border-2 border-dashed text-center space-y-4",
            theme.colors.border
          )}>
            <div className={cn("p-4 rounded-full", theme.colors.primaryMuted)}>
              <ImageIcon className={cn("w-8 h-8 opacity-20", theme.colors.accent)} />
            </div>
            <div className="space-y-1">
              <h3 className={cn("text-xl font-bold", theme.colors.text)}>{t('memories.noMemories.title')}</h3>
              <p className={cn("text-sm opacity-60 max-w-xs mx-auto", theme.colors.textMuted)}>
                {searchQuery || filterType !== 'all' 
                  ? t('memories.noMemories.searchSubtitle')
                  : t('memories.noMemories.emptySubtitle')}
              </p>
            </div>
            {!searchQuery && filterType === 'all' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className={cn("px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20")}
              >
                {t('memories.noMemories.button')}
              </button>
            )}
          </div>
        )}
      </DataState>

      {/* Modal */}
      {selectedTreeId && (
        <MemoryModal
          treeId={selectedTreeId}
          isOpen={isModalOpen}
          initialMemory={selectedMemory}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
