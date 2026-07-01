"use client";

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/cn';
import { useAppTheme } from '../providers/ThemeProvider';
import SurfaceDecorations from '../shared/SurfaceDecorations';
import { useLanguage } from '../providers/LanguageProvider';
import { X, Calendar, Type, Image as ImageIcon, Users, Save, Loader2, Upload, Search, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StoryEditor from './StoryEditor';
import { supabase } from '@/lib/supabaseClient';
import { CreateMemoryInput, UpdateMemoryInput, MemoryType } from '@/lib/shared/schemas/memories';
import PartialDateInput from '../ui/PartialDateInput';
import { Button } from '@/components/ui/button';

interface MemoryModalProps {
  treeId: string;
  isOpen: boolean;
  onClose: () => void;
  initialPersonId?: string;
  initialMemory?: any;
}

export default function MemoryModal({ treeId, isOpen, onClose, initialPersonId, initialMemory }: MemoryModalProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isEditing = !!initialMemory;

  const [type, setType] = useState<MemoryType>(initialMemory?.type || 'milestone');
  const [title, setTitle] = useState(initialMemory?.title || '');
  const [date, setDate] = useState(
    initialMemory?.date
      ? (typeof initialMemory.date === 'string' ? initialMemory.date : new Date(initialMemory.date).toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0]
  );
  const [content, setContent] = useState(initialMemory?.content || '');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialMemory?.imageUrl || null);
  const [associatedPersonIds, setAssociatedPersonIds] = useState<string[]>(
    initialMemory?.associatedPeople?.map((p: any) => p.id) || (initialPersonId ? [initialPersonId] : [])
  );
  const [personSearch, setPersonSearch] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setType(initialMemory?.type || 'milestone');
      setTitle(initialMemory?.title || '');
      setDate(
        initialMemory?.date
          ? (typeof initialMemory.date === 'string' ? initialMemory.date : new Date(initialMemory.date).toISOString().split('T')[0])
          : new Date().toISOString().split('T')[0]
      );
      setContent(initialMemory?.content || '');
      setImage(null);
      setImagePreview(initialMemory?.imageUrl || null);
      setAssociatedPersonIds(
        initialMemory?.associatedPeople?.map((p: any) => p.id) || (initialPersonId ? [initialPersonId] : [])
      );
      setPersonSearch('');
      setFormErrors({});
    }
  }, [isOpen, initialMemory, initialPersonId]);

  const { data: people } = useQuery({
    queryKey: ['tree-people', treeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${treeId}/visual`);
      return (res as any).data;
    },
    enabled: isOpen,
  });

  const uploadImage = async (file: File): Promise<string> => {
    const { data: { signedUrl, path } } = await api.post(`/trees/${treeId}/memories/upload-url`, {
      fileName: file.name
    }) as any;

    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!uploadRes.ok) throw new Error('Failed to upload image');
    const { data } = supabase.storage.from('memories').getPublicUrl(path);
    return data.publicUrl;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Title is required";
    if (!date) errors.date = "Date is required";
    if (type === 'story' && (!content || content === '<p></p>' || content.trim() === '')) {
      errors.content = "Story content is required";
    }
    if (type === 'photo' && !imagePreview) {
      errors.image = "Photo is required";
    }
    setFormErrors(errors);
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      const element = formRef.current?.querySelector(`[data-error-id="${firstError}"]`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) return;
      let imageUrl = imagePreview || undefined;
      if (image) imageUrl = await uploadImage(image);

      if (isEditing) {
        const payload: UpdateMemoryInput = { type, title, content: type === 'story' ? content : (type === 'milestone' ? content : undefined), date, imageUrl, associatedPersonIds };
        return api.patch(`/trees/${treeId}/memories/${initialMemory.id}`, payload);
      } else {
        const payload: CreateMemoryInput = { treeId, type, title, content: type === 'story' ? content : (type === 'milestone' ? content : undefined), date, imageUrl, associatedPersonIds };
        return api.post(`/trees/${treeId}/memories`, payload);
      }
    },
    onSuccess: (res) => {
      if (!res) return;
      queryClient.invalidateQueries({ queryKey: ['memories', treeId] });
      if (initialPersonId || initialMemory?.associatedPeople?.some((p: any) => p.id === initialPersonId)) {
        queryClient.invalidateQueries({ queryKey: ['person-memories', treeId, initialPersonId || initialMemory?.associatedPeople?.[0]?.id] });
      }
      onClose();
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      if (formErrors.image) setFormErrors(prev => { const n = { ...prev }; delete n.image; return n; });
    }
  };

  const filteredPeople = people?.filter((p: any) =>
    !associatedPersonIds.includes(p.id) &&
    (`${p.firstName} ${p.lastName} ${p.nickname ?? ''}`.toLowerCase().includes(personSearch.toLowerCase()))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center pt-20 pb-8 px-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={cn(
              "relative w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] border-2 shadow-pop-lg overflow-hidden flex flex-col",
              theme.colors.surface,
              theme.colors.border
            )}
            ref={formRef}
          >
            <SurfaceDecorations density="light" />

            <div className={cn("px-8 py-6 border-b flex items-center justify-between shrink-0", theme.colors.border)}>
              <div className="flex items-center gap-4">
                <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", theme.colors.primaryMuted)}>
                  <Save className={cn("w-5 h-5", theme.colors.accent)} />
                </div>
                <div>
                  <h2 className={cn("text-xl font-black leading-tight", theme.colors.text)}>
                    {isEditing ? t('memoryModal.editTitle') : t('memoryModal.createTitle')}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className={cn("p-2.5 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5", theme.colors.textMuted)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 py-8 overflow-y-auto flex-1 space-y-8">
              <div className="grid grid-cols-3 gap-3">
                {(['milestone', 'story', 'photo'] as MemoryType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all",
                      type === t
                        ? "border-primary bg-primary/5 shadow-pop-sm"
                        : "border-border hover:border-primary/30 opacity-60 hover:opacity-100"
                    )}
                  >
                    {t === 'milestone' && <Calendar className={cn("w-6 h-6", type === t ? "text-primary" : "text-muted-foreground")} />}
                    {t === 'story' && <Type className={cn("w-6 h-6", type === t ? "text-primary" : "text-muted-foreground")} />}
                    {t === 'photo' && <ImageIcon className={cn("w-6 h-6", type === t ? "text-primary" : "text-muted-foreground")} />}
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", type === t ? "text-foreground" : "text-muted-foreground")}>
                      {t}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2" data-error-id="title">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t('memoryModal.title')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (formErrors.title) setFormErrors(prev => { const n = { ...prev }; delete n.title; return n; });
                      }}
                      placeholder={t('memoryModal.titlePlaceholder')}
                      className={cn(
                        "w-full h-12 px-4 rounded-xl border-2 outline-none transition-all text-foreground",
                        "bg-input",
                        formErrors.title ? "border-red-500 focus:ring-red-500/20" : "border-border",
                        "focus:border-primary focus:shadow-pop-sm focus:shadow-primary/30",
                        "placeholder:text-muted-foreground"
                      )}
                    />
                    {formErrors.title && <p className="text-[10px] text-red-500 font-bold ml-1">{formErrors.title}</p>}
                  </div>
                  <div className="space-y-2" data-error-id="date">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t('memoryModal.date')} <span className="text-red-500">*</span>
                    </label>
                    <PartialDateInput
                      value={date}
                      onChange={(val) => {
                        setDate(val);
                        if (formErrors.date) setFormErrors(prev => { const n = { ...prev }; delete n.date; return n; });
                      }}
                      className="w-full"
                      error={!!formErrors.date}
                    />
                    {formErrors.date && <p className="text-[10px] text-red-500 font-bold ml-1">{formErrors.date}</p>}
                  </div>
                </div>

                {(type === 'photo' || type === 'milestone') && (
                  <div className="space-y-2" data-error-id="image">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {type === 'photo' ? t('memoryModal.selectPhoto') : t('memoryModal.featuredImage')}
                      {type === 'photo' && <span className="text-red-500"> *</span>}
                    </label>
                    <div
                      onClick={() => document.getElementById('memory-image')?.click()}
                      className={cn(
                        "relative h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:bg-primary/5",
                        formErrors.image ? "border-red-500 bg-red-500/5" : "border-border"
                      )}
                    >
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Upload className="w-8 h-8 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6">
                          <ImageIcon className="w-10 h-10 mx-auto mb-2 text-muted-foreground/20" />
                          <p className="text-sm font-bold text-muted-foreground">{t('memoryModal.clickUpload')}</p>
                          <p className="text-[10px] uppercase tracking-wider mt-1 text-muted-foreground/50">{t('memoryModal.uploadHint')}</p>
                        </div>
                      )}
                      <input id="memory-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </div>
                    {formErrors.image && <p className="text-[10px] text-red-500 font-bold ml-1">{formErrors.image}</p>}
                  </div>
                )}

                {type !== 'photo' && (
                  <div className="space-y-2" data-error-id="content">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {type === 'story' ? t('memoryModal.storyTitle') : t('memoryModal.description')}
                      {type === 'story' && <span className="text-red-500"> *</span>}
                    </label>
                    {type === 'story' ? (
                      <div className={cn("rounded-xl border-2 overflow-hidden transition-all", formErrors.content ? "border-red-500" : "border-border")}>
                        <StoryEditor
                          content={content}
                          onChange={(val) => {
                            setContent(val);
                            if (formErrors.content) setFormErrors(prev => { const n = { ...prev }; delete n.content; return n; });
                          }}
                        />
                      </div>
                    ) : (
                      <textarea
                        value={content}
                        onChange={(e) => {
                          setContent(e.target.value);
                          if (formErrors.content) setFormErrors(prev => { const n = { ...prev }; delete n.content; return n; });
                        }}
                        placeholder={t('memoryModal.milestonePlaceholder')}
                        className={cn(
                          "w-full h-32 px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none text-foreground",
                          "bg-input",
                          formErrors.content ? "border-red-500 focus:ring-red-500/20" : "border-border",
                          "focus:border-primary focus:shadow-pop-sm focus:shadow-primary/30",
                          "placeholder:text-muted-foreground"
                        )}
                      />
                    )}
                    {formErrors.content && <p className="text-[10px] text-red-500 font-bold ml-1">{formErrors.content}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t('memoryModal.linkFamilyMembers')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {associatedPersonIds.map(id => {
                      const p = people?.find((per: any) => per.id === id);
                      return (
                        <span key={id} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2", theme.colors.primaryMuted, theme.colors.accent, theme.colors.borderAccent)}>
                          {p ? `${p.firstName} ${p.lastName || ''}` : id}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setAssociatedPersonIds(prev => prev.filter(i => i !== id))} />
                        </span>
                      );
                    })}
                    <div className="relative group">
                      <button className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 border-dashed transition-colors",
                        "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                      )}>
                        <UserPlus className="w-3 h-3" />
                        {t('memoryModal.addPerson')}
                      </button>
                      <div className={cn(
                        "absolute bottom-full left-0 mb-2 w-64 max-h-64 overflow-hidden rounded-xl border-2 shadow-pop-lg flex flex-col hidden group-focus-within:flex group-hover:flex z-20",
                        theme.colors.surface,
                        theme.colors.border
                      )}>
                        <div className="p-2 border-b" style={{ borderColor: theme.colors.border }}>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                            <input
                              type="text"
                              value={personSearch}
                              onChange={(e) => setPersonSearch(e.target.value)}
                              placeholder={t('memoryModal.searchPeople')}
                              className={cn(
                                "w-full h-9 pl-8 pr-3 rounded-lg border-2 text-xs outline-none transition-all",
                                "bg-input border-border text-foreground placeholder:text-muted-foreground",
                                "focus:border-primary"
                              )}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-48 p-1">
                          {filteredPeople?.map((p: any) => (
                            <div
                              key={p.id}
                              onClick={() => { setAssociatedPersonIds(prev => [...prev, p.id]); setPersonSearch(''); }}
                              className="flex items-center gap-3 p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors hover:bg-primary/10 text-foreground"
                            >
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase", theme.colors.primaryMuted, theme.colors.accent)}>
                                {p.firstName?.[0]}{p.lastName?.[0]}
                              </div>
                              <span className="font-bold">{p.firstName} {p.lastName}</span>
                            </div>
                          ))}
                          {filteredPeople?.length === 0 && (
                            <p className="p-4 text-center text-[10px] uppercase font-bold text-muted-foreground/40">
                              {t('memoryModal.noPeople')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={cn("px-8 py-6 border-t flex items-center justify-end gap-3 shrink-0", theme.colors.border)}>
              <Button onClick={onClose} variant="outline">
                {t('common.cancel')}
              </Button>
              <Button
                variant="candy"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t('memoryModal.saving')}</>
                ) : (
                  isEditing ? t('memoryModal.update') : t('memoryModal.save')
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
