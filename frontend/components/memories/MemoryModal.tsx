"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/cn';
import { useAppTheme } from '../providers/ThemeProvider';
import { X, Calendar, Type, Image as ImageIcon, Users, Save, Loader2, Upload, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StoryEditor from './StoryEditor';
import { supabase } from '@/lib/supabaseClient';
import { CreateMemoryInput, UpdateMemoryInput, MemoryType } from '@/lib/shared/schemas/memories';

interface MemoryModalProps {
  treeId: string;
  isOpen: boolean;
  onClose: () => void;
  initialPersonId?: string;
  initialMemory?: any; // To support editing
}

export default function MemoryModal({ treeId, isOpen, onClose, initialPersonId, initialMemory }: MemoryModalProps) {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const isEditing = !!initialMemory;
  
  const [type, setType] = useState<MemoryType>(initialMemory?.type || 'milestone');
  const [title, setTitle] = useState(initialMemory?.title || '');
  const [date, setDate] = useState(
    initialMemory?.date 
      ? new Date(initialMemory.date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [content, setContent] = useState(initialMemory?.content || '');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialMemory?.imageUrl || null);
  const [associatedPersonIds, setAssociatedPersonIds] = useState<string[]>(
    initialMemory?.associatedPeople?.map((p: any) => p.id) || (initialPersonId ? [initialPersonId] : [])
  );
  const [personSearch, setPersonSearch] = useState('');

  // Reset form when initialMemory changes or modal opens
  useEffect(() => {
    if (isOpen) {
        setType(initialMemory?.type || 'milestone');
        setTitle(initialMemory?.title || '');
        setDate(
            initialMemory?.date 
              ? new Date(initialMemory.date).toISOString().split('T')[0] 
              : new Date().toISOString().split('T')[0]
        );
        setContent(initialMemory?.content || '');
        setImage(null);
        setImagePreview(initialMemory?.imageUrl || null);
        setAssociatedPersonIds(
            initialMemory?.associatedPeople?.map((p: any) => p.id) || (initialPersonId ? [initialPersonId] : [])
        );
        setPersonSearch('');
    }
  }, [isOpen, initialMemory, initialPersonId]);

  // Fetch people for the selection list
  const { data: people } = useQuery({
    queryKey: ['tree-people', treeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${treeId}/visual`);
      return (res as any).data;
    },
    enabled: isOpen,
  });

  const uploadImage = async (file: File): Promise<string> => {
    // 1. Get signed URL
    const { data: { signedUrl, path } } = await api.post(`/trees/${treeId}/memories/upload-url`, {
      fileName: file.name
    }) as any;

    // 2. Upload to Supabase Storage directly
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadRes.ok) throw new Error('Failed to upload image');

    // 3. Return the public URL
    const { data } = supabase.storage.from('memories').getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = imagePreview || undefined;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      if (isEditing) {
        const payload: UpdateMemoryInput = {
            type,
            title,
            content: type === 'story' ? content : (type === 'milestone' ? content : undefined),
            date: new Date(date).getTime(),
            imageUrl,
            associatedPersonIds,
        };
        return api.patch(`/trees/${treeId}/memories/${initialMemory.id}`, payload);
      } else {
        const payload: CreateMemoryInput = {
            treeId,
            type,
            title,
            content: type === 'story' ? content : (type === 'milestone' ? content : undefined),
            date: new Date(date).getTime(),
            imageUrl,
            associatedPersonIds,
        };
        return api.post(`/trees/${treeId}/memories`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', treeId] });
      if (initialPersonId || initialMemory?.associatedPeople?.some((p: any) => p.id === initialPersonId)) {
        queryClient.invalidateQueries({ queryKey: ['person-memories', treeId, initialPersonId || initialMemory?.associatedPeople?.[0]?.id] });
      }
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setType('milestone');
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setContent('');
    setImage(null);
    setImagePreview(null);
    setAssociatedPersonIds(initialPersonId ? [initialPersonId] : []);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredPeople = people?.filter((p: any) => 
    !associatedPersonIds.includes(p.id) &&
    (`${p.firstName} ${p.lastName}`.toLowerCase().includes(personSearch.toLowerCase()))
  );

  const isSaveDisabled = saveMutation.isPending || 
    !title || 
    (type === 'story' && (!content || content === '<p></p>')) || 
    (type === 'photo' && !imagePreview);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={cn(
              "relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border flex flex-col",
              theme.colors.surface,
              theme.colors.border
            )}
          >
          {/* Header */}
          <div className={cn("p-6 border-b sticky top-0 z-10 flex items-center justify-between", theme.colors.surface, theme.colors.border)}>
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", theme.colors.primaryMuted)}>
                <Save className={cn("w-5 h-5", theme.colors.accent)} />
              </div>
              <h2 className={cn("text-xl font-black uppercase tracking-tight", theme.colors.text)}>
                {isEditing ? 'Edit Memory' : 'Capture a Memory'}
              </h2>
            </div>
            <button onClick={onClose} className={cn("p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors", theme.colors.text)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Type Selector */}
            <div className="grid grid-cols-3 gap-3">
              {(['milestone', 'story', 'photo'] as MemoryType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    type === t 
                      ? cn(theme.colors.borderAccent, "bg-primary/5") 
                      : cn(theme.colors.border, "hover:border-slate-400 dark:hover:border-slate-600 opacity-60")
                  )}
                >
                  {t === 'milestone' && <Calendar className={cn("w-6 h-6", type === t ? theme.colors.accent : theme.colors.text)} />}
                  {t === 'story' && <Type className={cn("w-6 h-6", type === t ? theme.colors.accent : theme.colors.text)} />}
                  {t === 'photo' && <ImageIcon className={cn("w-6 h-6", type === t ? theme.colors.accent : theme.colors.text)} />}
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", type === t ? theme.colors.text : theme.colors.textMuted)}>
                    {t}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {/* Title & Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest px-1", theme.colors.textMuted)}>
                    Memory Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Great Grandpa's 90th Birthday"
                    className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all", theme.colors.bg, theme.colors.border, theme.colors.text)}
                  />
                </div>
                <div className="space-y-2">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest px-1", theme.colors.textMuted)}>
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all", theme.colors.bg, theme.colors.border, theme.colors.text)}
                  />
                </div>
              </div>

              {/* Photo Upload */}
              {(type === 'photo' || type === 'milestone') && (
                <div className="space-y-2">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest px-1", theme.colors.textMuted)}>
                    {type === 'photo' ? 'Select Photo' : 'Featured Image (Optional)'} 
                    {type === 'photo' && <span className="text-red-500"> *</span>}
                  </label>
                  <div 
                    onClick={() => document.getElementById('memory-image')?.click()}
                    className={cn(
                      "relative h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:bg-primary/5",
                      theme.colors.border,
                      type === 'photo' && !imagePreview && "border-red-200 dark:border-red-900/30"
                    )}
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon className={cn("w-10 h-10 mx-auto mb-2 opacity-20", theme.colors.text)} />
                        <p className={cn("text-sm font-bold", theme.colors.textMuted)}>Click to upload image</p>
                        <p className={cn("text-[10px] uppercase tracking-wider mt-1 opacity-50", theme.colors.textMuted)}>JPG, PNG up to 10MB</p>
                      </div>
                    )}
                    <input id="memory-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                </div>
              )}

              {/* Story Content */}
              {type !== 'photo' && (
                <div className="space-y-2">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest px-1", theme.colors.textMuted)}>
                    {type === 'story' ? 'The Story' : 'Description'}
                    {type === 'story' && <span className="text-red-500"> *</span>}
                  </label>
                  {type === 'story' ? (
                    <StoryEditor content={content} onChange={setContent} />
                  ) : (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share some details about this milestone..."
                      className={cn("w-full h-32 px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none", theme.colors.bg, theme.colors.border, theme.colors.text)}
                    />
                  )}
                </div>
              )}

              {/* Associated People */}
              <div className="space-y-2">
                <label className={cn("text-[10px] font-black uppercase tracking-widest px-1", theme.colors.textMuted)}>Link to Family Members</label>
                <div className="flex flex-wrap gap-2">
                  {associatedPersonIds.map(id => {
                    const p = people?.find((per: any) => per.id === id);
                    return (
                      <span key={id} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold", theme.colors.primaryMuted, theme.colors.accent)}>
                        {p ? `${p.firstName} ${p.lastName || ''}` : id}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setAssociatedPersonIds(prev => prev.filter(i => i !== id))} />
                      </span>
                    );
                  })}
                  <div className="relative group">
                    <button className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-dashed hover:border-primary/50 transition-colors", theme.colors.border, theme.colors.textMuted)}>
                      <Users className="w-3 h-3" />
                      Add Person
                    </button>
                    <div className={cn(
                      "absolute bottom-full left-0 mb-2 w-64 max-h-64 overflow-hidden rounded-xl shadow-xl border flex flex-col hidden group-focus-within:flex group-hover:flex z-20",
                      theme.colors.surface,
                      theme.colors.border
                    )}>
                      <div className="p-2 border-b" style={{ borderColor: theme.colors.border }}>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-40" />
                            <input 
                                type="text"
                                value={personSearch}
                                onChange={(e) => setPersonSearch(e.target.value)}
                                placeholder="Search people..."
                                className={cn("w-full pl-7 pr-2 py-1.5 rounded-lg border text-[10px] outline-none", theme.colors.bg, theme.colors.border, theme.colors.text)}
                            />
                        </div>
                      </div>
                      <div className="overflow-y-auto max-h-48 p-1">
                        {filteredPeople?.map((p: any) => (
                            <div 
                            key={p.id}
                            onClick={() => { setAssociatedPersonIds(prev => [...prev, p.id]); setPersonSearch(''); }}
                            className={cn("p-2 rounded-lg text-xs font-medium cursor-pointer transition-colors", "hover:bg-primary/10", theme.colors.text)}
                            >
                            {p.firstName} {p.lastName}
                            </div>
                        ))}
                        {filteredPeople?.length === 0 && <p className="p-4 text-center text-[10px] uppercase font-bold opacity-40">No people found</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={cn("p-6 border-t mt-auto flex justify-end gap-3", theme.colors.surface, theme.colors.border)}>
            <button
              onClick={onClose}
              className={cn("px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all", "hover:bg-slate-100 dark:hover:bg-slate-800", theme.colors.text)}
            >
              Cancel
            </button>
            <button
              disabled={isSaveDisabled}
              onClick={() => saveMutation.mutate()}
              className={cn(
                "px-8 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all flex items-center gap-2",
                "hover:opacity-90 active:scale-[0.98]",
                isSaveDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditing ? 'Update Memory' : 'Save Memory'
              )}
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
