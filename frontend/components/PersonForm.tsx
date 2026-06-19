"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPersonSchema, updatePersonSchema, CreatePersonInput, UpdatePersonInput, Person } from "@shared/schemas/people";
import { Loader2, Save, User as UserIcon, Briefcase, GraduationCap, Link2, Search, Plus, Trash2, Calendar, CheckCircle2, X, Mail, Camera, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "./providers/ThemeProvider";
import { useLanguage } from "./providers/LanguageProvider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/lib/supabaseClient";
import CustomSelect from "./ui/CustomSelect";
import PartialDateInput from "./ui/PartialDateInput";

interface PersonFormProps {
  initialData?: Partial<Person>;
  onSubmit: (data: CreatePersonInput | UpdatePersonInput & { linkToId?: string }) => void;
  isLoading?: boolean;
  treeId?: string;
}

export default function PersonForm({ initialData, onSubmit, isLoading, treeId }: PersonFormProps) {
  const isEditing = !!initialData;
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLinkPerson, setSelectedLinkPerson] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialData?.imageUrl) setImagePreview(initialData.imageUrl);
  }, [initialData?.imageUrl]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<CreatePersonInput | UpdatePersonInput>({
    resolver: zodResolver(isEditing ? updatePersonSchema : createPersonSchema),
    defaultValues: (initialData as any) || {
      status: 'ghost',
      gender: 'unknown',
      phoneVisibility: 'tree',
      emailVisibility: 'tree',
      addressVisibility: 'tree',
      birthDateVisibility: 'tree',
      occupations: [],
      educations: [],
      occupationSectionVisible: true,
      educationSectionVisible: true,
      ...(treeId && { treeId }),
    },
  });

  // Auto-scroll to first error on submit
  useEffect(() => {
    if (isSubmitted && Object.keys(errors).length > 0) {
      const firstErrorPath = Object.keys(errors)[0];
      // Handle nested paths like educations.0.school
      const element = document.getElementsByName(firstErrorPath)[0] || 
                     document.querySelector(`[name^="${firstErrorPath}"]`);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ('focus' in element) (element as HTMLElement).focus();
      }
    }
  }, [errors, isSubmitted]);

  const { fields: occupationFields, append: appendOccupation, remove: removeOccupation } = useFieldArray({
    control,
    name: "occupations" as any
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control,
    name: "educations" as any
  });

  const { data: people } = useQuery({
    queryKey: ['tree-people-simple', treeId || initialData?.treeId],
    queryFn: async () => {
      const tId = treeId || initialData?.treeId;
      const res = await api.get(`/trees/${tId}/visual`);
      return (res as any).data;
    },
    enabled: !!(treeId || initialData?.treeId) && !isEditing,
  });

  const visibilityOptions = [
    { value: 'tree', label: t('personForm.visibility.tree') },
    { value: 'editors', label: t('personForm.visibility.editors') },
    { value: 'private', label: t('personForm.visibility.private') },
  ];

  const uploadImage = async (file: File): Promise<string> => {
    const tId = treeId || initialData?.treeId;
    if (!tId) throw new Error("Tree ID is required for upload");

    const { data: { signedUrl, path } } = await api.post(`/trees/${tId}/people/upload-url`, {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const processSubmit = async (data: any) => {
    setIsUploading(true);
    try {
      let imageUrl = imagePreview;
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const processed = { ...data, imageUrl };
      
      // Clean empty strings to null for backend compatibility
      if (processed.lastName === "") processed.lastName = null;
      if (processed.email === "") processed.email = null;
      if (processed.phone === "") processed.phone = null;
      if (processed.address === "") processed.address = null;
      if (processed.birthDate === "") processed.birthDate = null;
      if (processed.deathDate === "") processed.deathDate = null;

      if (!isEditing && treeId) processed.treeId = treeId;
      if (!isEditing && selectedLinkPerson) processed.linkToId = selectedLinkPerson.id;

      onSubmit(processed);
    } catch (error) {
      console.error("Form processing failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredPeople = people?.filter((p: any) => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const labelClass = cn(
    "text-[10px] font-black uppercase tracking-widest transition-colors",
    theme.isDark ? "text-slate-300" : "text-slate-600"
  );
  
  const sectionHeaderClass = cn("text-lg font-black flex items-center gap-3 transition-colors", theme.colors.text);
  
  const inputBaseClass = (error?: any) => cn(
    "w-full px-4 py-2.5 border rounded-xl outline-none transition-all text-sm",
    theme.colors.bg,
    theme.colors.text,
    error ? "border-red-500 focus:ring-red-500/20" : theme.colors.border,
    "focus:ring-2 focus:ring-primary/20 focus:border-primary"
  );

  const RequiredStar = () => <span className="text-red-500 ml-0.5">*</span>;

  return (
    <form ref={formRef} onSubmit={handleSubmit(processSubmit)} className="space-y-10" noValidate>
      {/* Profile Picture */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative group">
          <div className={cn(
            "w-32 h-32 rounded-full border-4 overflow-hidden flex items-center justify-center transition-all",
            theme.colors.border,
            theme.colors.surface
          )}>
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className={cn("w-16 h-16 opacity-20", theme.colors.text)} />
            )}
          </div>
          <button
            type="button"
            onClick={() => document.getElementById('profile-image-upload')?.click()}
            className={cn("absolute bottom-0 right-0 p-2.5 rounded-full shadow-lg transition-all", theme.colors.primary, "text-white hover:scale-110 active:scale-95")}
          >
            <Camera className="w-5 h-5" />
          </button>
          <input id="profile-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>
        <div className="text-center">
          <p className={cn("text-sm font-black uppercase tracking-widest", theme.colors.text)}>{t('personForm.picture')}</p>
          <p className={cn("text-[10px] opacity-40 uppercase font-bold", theme.colors.text)}>{t('personForm.pictureHint')}</p>
        </div>
      </div>

      {/* Identity */}
      <div className="space-y-6">
        <h3 className={sectionHeaderClass}>
          <UserIcon className={cn("w-5 h-5", theme.colors.accent)} />
          {t('personForm.identity')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className={labelClass}>{t('personForm.firstName')} <RequiredStar /></label>
              <input {...register("firstName")} className={inputBaseClass(errors.firstName)} placeholder="John" />
              {errors.firstName && <p className="text-xs text-red-500 font-bold mt-1">{errors.firstName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>{t('personForm.lastName')}</label>
              <input {...register("lastName")} className={inputBaseClass(errors.lastName)} placeholder="Doe" />
              {errors.lastName && <p className="text-xs text-red-500 font-bold mt-1">{errors.lastName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>{t('personForm.gender')}</label>
              <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                      <CustomSelect
                          {...field}
                          options={[
                              { value: 'unknown', label: t('personForm.gender.unknown') },
                              { value: 'male', label: t('personForm.gender.male') },
                              { value: 'female', label: t('personForm.gender.female') },
                              { value: 'other', label: t('personForm.gender.other') }
                          ]}
                          error={!!errors.gender}
                      />
                  )}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>{t('personForm.status')}</label>
              <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                      <CustomSelect
                          {...field}
                          options={[
                              { value: 'ghost', label: t('personForm.status.ghost') },
                              { value: 'active', label: t('personForm.status.active') },
                              { value: 'deceased', label: t('personForm.status.deceased') },
                              { value: 'archived', label: t('personForm.status.archived') }
                          ]}
                          error={!!errors.status}
                      />
                  )}
              />
            </div>
        </div>
      </div>

      {/* Lifecycle */}
      <div className="space-y-6">
        <h3 className={sectionHeaderClass}>
          <Calendar className={cn("w-5 h-5", theme.colors.accent)} />
          {t('personForm.lifecycle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className={labelClass}>{t('personForm.birthDate')} <RequiredStar /></label>
              <Controller
                  name="birthDate"
                  control={control}
                  render={({ field }) => (
                      <PartialDateInput
                          {...field}
                          className="w-full"
                          error={!!errors.birthDate}
                      />
                  )}
              />
              {errors.birthDate && <p className="text-xs text-red-500 font-bold mt-1">{errors.birthDate.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>{t('personForm.deathDate')}</label>
              <Controller
                  name="deathDate"
                  control={control}
                  render={({ field }) => (
                      <PartialDateInput
                          {...field}
                          className="w-full"
                          error={!!errors.deathDate}
                      />
                  )}
              />
              {errors.deathDate && <p className="text-xs text-red-500 font-bold mt-1">{errors.deathDate.message}</p>}
            </div>
        </div>
      </div>

      {/* Education */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className={sectionHeaderClass}>
                <GraduationCap className={cn("w-5 h-5", theme.colors.accent)} />
                {t('personForm.education')}
            </h3>
            <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" {...register("educationSectionVisible" as any)} className="hidden" />
                <div className={cn("p-1.5 rounded-lg transition-all", watch("educationSectionVisible" as any) ? "text-primary bg-primary/10" : "text-red-500 bg-red-500/10")}>
                    {watch("educationSectionVisible" as any) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </div>
            </label>
          </div>
          <button
            type="button"
            onClick={() => appendEducation({ id: uuidv4(), school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", description: "", visibility: "tree" })}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", theme.colors.primaryMuted, theme.colors.accent)}
          >
            <Plus className="w-3.5 h-3.5" /> {t('personForm.addEducation')}
          </button>
        </div>

        <div className="space-y-6">
          {educationFields.map((field, index) => (
            <div key={field.id} className={cn("p-6 rounded-2xl border space-y-6 relative group", theme.colors.bg, theme.colors.border)}>
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="absolute top-4 right-4 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className={labelClass}>{t('personForm.school')} <RequiredStar /></label>
                  <input {...register(`educations.${index}.school` as any)} className={inputBaseClass((errors.educations as any)?.[index]?.school)} placeholder="e.g. Oxford" />
                  {(errors.educations as any)?.[index]?.school && <p className="text-xs text-red-500 font-bold mt-1">{(errors.educations as any)[index].school.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>{t('personForm.degree')}</label>
                  <input {...register(`educations.${index}.degree` as any)} className={inputBaseClass((errors.educations as any)?.[index]?.degree)} placeholder="e.g. BSc" />
                </div>
                
                <div className="space-y-1.5">
                  <label className={labelClass}>{t('personForm.startDate')} <RequiredStar /></label>
                  <Controller
                      name={`educations.${index}.startDate` as any}
                      control={control}
                      render={({ field }) => (
                          <PartialDateInput {...field} error={!!(errors.educations as any)?.[index]?.startDate} />
                      )}
                  />
                  {(errors.educations as any)?.[index]?.startDate && <p className="text-xs text-red-500 font-bold mt-1">{(errors.educations as any)[index].startDate.message}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <label className={labelClass}>{t('personForm.endDate')}</label>
                  <Controller
                      name={`educations.${index}.endDate` as any}
                      control={control}
                      render={({ field }) => (
                          <PartialDateInput {...field} error={!!(errors.educations as any)?.[index]?.endDate} />
                      )}
                  />
                </div>
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className={labelClass}>{t('personForm.visibility.label')}</label>
                  <Controller
                    name={`educations.${index}.visibility` as any}
                    control={control}
                    render={({ field }) => (
                        <CustomSelect {...field} options={visibilityOptions} size="md" />
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
          {educationFields.length === 0 && (
            <p className={cn("text-sm italic text-center py-4", theme.colors.textMuted)}>{t('personForm.noEducation')}</p>
          )}
        </div>
      </div>

      {/* Occupation */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className={sectionHeaderClass}>
                <Briefcase className={cn("w-5 h-5", theme.colors.accent)} />
                {t('personForm.occupation')}
            </h3>
            <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" {...register("occupationSectionVisible" as any)} className="hidden" />
                <div className={cn("p-1.5 rounded-lg transition-all", watch("occupationSectionVisible" as any) ? "text-primary bg-primary/10" : "text-red-500 bg-red-500/10")}>
                    {watch("occupationSectionVisible" as any) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </div>
            </label>
          </div>
          <button
            type="button"
            onClick={() => appendOccupation({ id: uuidv4(), title: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "", visibility: "tree" })}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", theme.colors.primaryMuted, theme.colors.accent)}
          >
            <Plus className="w-3.5 h-3.5" /> {t('personForm.addOccupation')}
          </button>
        </div>

        <div className="space-y-6">
          {occupationFields.map((field, index) => (
            <div key={field.id} className={cn("p-6 rounded-2xl border space-y-6 relative group", theme.colors.bg, theme.colors.border)}>
              <button
                type="button"
                onClick={() => removeOccupation(index)}
                className="absolute top-4 right-4 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className={labelClass}>{t('personForm.jobTitle')} <RequiredStar /></label>
                  <input {...register(`occupations.${index}.title` as any)} className={inputBaseClass((errors.occupations as any)?.[index]?.title)} placeholder="e.g. Architect" />
                  {(errors.occupations as any)?.[index]?.title && <p className="text-xs text-red-500 font-bold mt-1">{(errors.occupations as any)[index].title.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>{t('personForm.company')} <RequiredStar /></label>
                  <input {...register(`occupations.${index}.company` as any)} className={inputBaseClass((errors.occupations as any)?.[index]?.company)} placeholder="e.g. Google" />
                  {(errors.occupations as any)?.[index]?.company && <p className="text-xs text-red-500 font-bold mt-1">{(errors.occupations as any)[index].company.message}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <label className={labelClass}>{t('personForm.startDate')} <RequiredStar /></label>
                  <Controller
                      name={`occupations.${index}.startDate` as any}
                      control={control}
                      render={({ field }) => (
                          <PartialDateInput {...field} error={!!(errors.occupations as any)?.[index]?.startDate} />
                      )}
                  />
                  {(errors.occupations as any)?.[index]?.startDate && <p className="text-xs text-red-500 font-bold mt-1">{(errors.occupations as any)[index].startDate.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>{t('personForm.endDate')}</label>
                  <div className="space-y-2">
                      <Controller
                          name={`occupations.${index}.endDate` as any}
                          control={control}
                          render={({ field }) => (
                              <PartialDateInput 
                                  {...field} 
                                  className={cn(watch(`occupations.${index}.isCurrent` as any) && "opacity-30 pointer-events-none")} 
                                  error={!!(errors.occupations as any)?.[index]?.endDate} 
                              />
                          )}
                      />
                      <Controller
                          name={`occupations.${index}.isCurrent` as any}
                          control={control}
                          render={({ field }) => (
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                      type="checkbox" 
                                      checked={field.value}
                                      onChange={(e) => {
                                          field.onChange(e.target.checked);
                                          if (e.target.checked) {
                                              setValue(`occupations.${index}.endDate` as any, "");
                                          }
                                      }}
                                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" 
                                  />
                                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", theme.colors.textMuted)}>{t('personForm.currentWork')}</span>
                              </label>
                          )}
                      />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className={labelClass}>{t('personForm.visibility.label')}</label>
                  <Controller
                    name={`occupations.${index}.visibility` as any}
                    control={control}
                    render={({ field }) => (
                        <CustomSelect {...field} options={visibilityOptions} size="md" />
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
          {occupationFields.length === 0 && (
            <p className={cn("text-sm italic text-center py-4", theme.colors.textMuted)}>{t('personForm.noExperience')}</p>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-6">
        <h3 className={sectionHeaderClass}>
          <Mail className={cn("w-5 h-5", theme.colors.accent)} />
          {t('personForm.contactPrivacy')}
        </h3>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 space-y-1.5">
              <label className={labelClass}>{t('personForm.emailAddress')}</label>
              <input {...register("email")} type="email" className={inputBaseClass(errors.email)} placeholder="email@example.com" />
              {errors.email && <p className="text-xs text-red-500 font-bold mt-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t('personForm.emailVisibility')}</label>
              <Controller name="emailVisibility" control={control} render={({ field }) => <CustomSelect {...field} options={visibilityOptions} size="md" />} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 space-y-1.5">
              <label className={labelClass}>{t('personForm.phoneNumber')}</label>
              <input {...register("phone")} className={inputBaseClass(errors.phone)} placeholder="+1..." />
              {errors.phone && <p className="text-xs text-red-500 font-bold mt-1">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t('personForm.phoneVisibility')}</label>
              <Controller name="phoneVisibility" control={control} render={({ field }) => <CustomSelect {...field} options={visibilityOptions} size="md" />} />
            </div>
          </div>
        </div>
      </div>

      {!isEditing && (
        <div className={cn("border-t pt-10 space-y-6", theme.colors.border)}>
          <h3 className={sectionHeaderClass}>
            <Link2 className={cn("w-5 h-5", theme.colors.accent)} />
          {t('personForm.linkMember')}
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4", theme.colors.textMuted)} />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('personForm.searchExisting')} className={inputBaseClass()} />
            </div>
            {searchTerm && filteredPeople && filteredPeople.length > 0 && (
              <div className={cn("max-h-60 overflow-y-auto border rounded-xl shadow-lg", theme.colors.border, theme.colors.surface)}>
                {filteredPeople.map((p: any) => (
                  <button key={p.id} type="button" onClick={() => { setSelectedLinkPerson(p); setSearchTerm(""); }} className={cn("w-full px-6 py-4 text-left text-sm hover:bg-black/5 transition-all flex items-center justify-between", theme.colors.text)}>
                    <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold", theme.colors.primaryMuted, theme.colors.accent)}>
                            {p.firstName[0]}{p.lastName?.[0] || ""}
                        </div>
                        <span className="font-bold">{p.firstName} {p.lastName}</span>
                    </div>
                    <Plus className="w-4 h-4 opacity-40" />
                  </button>
                ))}
              </div>
            )}
            {selectedLinkPerson && (
              <div className={cn("flex items-center justify-between p-6 rounded-2xl border bg-primary/5", theme.colors.borderAccent)}>
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  <p className={cn("text-sm font-bold", theme.colors.text)}>{t('personForm.linkedTo').replace('{name}', `${selectedLinkPerson.firstName} ${selectedLinkPerson.lastName}`)}</p>
                </div>
                <button type="button" onClick={() => setSelectedLinkPerson(null)} className="p-2 rounded-xl hover:bg-red-50 text-red-500"><X className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        </div>
      )}

      <button type="submit" disabled={isLoading || isUploading} className={cn("w-full py-4 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3", theme.colors.primary)}>
        {isLoading || isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {isEditing ? t('personForm.updateProfile') : t('personForm.createProfile')}
      </button>
    </form>
  );
}
