"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPersonSchema, updatePersonSchema, CreatePersonInput, UpdatePersonInput, Person } from "@shared/schemas/people";
import { Loader2, Save, User as UserIcon, Shield, Globe, Lock, Briefcase, GraduationCap, Link2, Search, Plus, Trash2, MapPin, Calendar, CheckCircle2, X, Mail, Camera, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "./providers/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/lib/supabaseClient";
import CustomSelect from "./ui/CustomSelect";

interface PersonFormProps {
  initialData?: Partial<Person>;
  onSubmit: (data: CreatePersonInput | UpdatePersonInput & { linkToId?: string }) => void;
  isLoading?: boolean;
  treeId?: string; // Add treeId prop for create operations
}

export default function PersonForm({ initialData, onSubmit, isLoading, treeId }: PersonFormProps) {
  const isEditing = !!initialData;
  const { theme } = useAppTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLinkPerson, setSelectedLinkPerson] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  // Sync image preview when initialData changes
  useEffect(() => {
    if (initialData?.imageUrl) {
      setImagePreview(initialData.imageUrl);
    }
  }, [initialData?.imageUrl]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
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

  const { fields: occupationFields, append: appendOccupation, remove: removeOccupation } = useFieldArray({
    control,
    name: "occupations" as any
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control,
    name: "educations" as any
  });

  // Fetch potential people to link with
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
    { value: 'tree', label: 'Family Tree' },
    { value: 'editors', label: 'Editors Only' },
    { value: 'private', label: 'Private' },
  ];

  const uploadImage = async (file: File): Promise<string> => {
    const tId = treeId || initialData?.treeId;
    if (!tId) throw new Error("Tree ID is required for upload");

    // 1. Get signed URL
    const { data: { signedUrl, path } } = await api.post(`/trees/${tId}/people/upload-url`, {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processSubmit = async (data: any) => {
    setIsUploading(true);
    try {
      let imageUrl = imagePreview;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Convert empty strings to null for optional/nullable fields
      const processed = Object.entries(data).reduce((acc, [key, value]) => {
        if (['treeId', 'occupations', 'educations', 'occupationSectionVisible', 'educationSectionVisible'].includes(key)) {
          (acc as any)[key] = value;
        } else if (key === 'lastName' && value === '') {
          (acc as any)[key] = null;
        } else if (['birthDate', 'deathDate', 'phone', 'email', 'address'].includes(key) && value === '') {
          (acc as any)[key] = null;
        } else {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as any);
      
      processed.imageUrl = imageUrl;
      
      if (!isEditing && treeId && !processed.treeId) {
        processed.treeId = treeId;
      }

      if (!isEditing && selectedLinkPerson) {
        processed.linkToId = selectedLinkPerson.id;
      }

      onSubmit(processed);
    } catch (error) {
      console.error("Failed to process form:", error);
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

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-10">
      {/* Profile Picture Section */}
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
            className={cn(
              "absolute bottom-0 right-0 p-2.5 rounded-full shadow-lg transition-all",
              theme.colors.primary,
              "text-white hover:scale-110 active:scale-95"
            )}
          >
            <Camera className="w-5 h-5" />
          </button>
          <input
            id="profile-image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
        <div className="text-center">
          <p className={cn("text-sm font-black uppercase tracking-widest", theme.colors.text)}>Profile Picture</p>
          <p className={cn("text-[10px] opacity-40 uppercase font-bold", theme.colors.text)}>JPG or PNG, max 5MB</p>
        </div>
      </div>

      {/* Identity Section */}
      <div className="space-y-6">
        <h3 className={sectionHeaderClass}>
          <UserIcon className={cn("w-5 h-5", theme.colors.accent)} />
          Identity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
            <label className={labelClass}>
                First Name <span className="text-red-500">*</span>
            </label>
            <input
                {...register("firstName")}
                className={cn(
                "w-full px-4 py-2.5 border rounded-xl outline-none transition-all text-sm",
                theme.colors.bg,
                theme.colors.text,
                errors.firstName ? "border-red-500" : theme.colors.border,
                "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
                placeholder="John"
            />

            {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message as string}</p>}
            </div>

            <div className="space-y-1.5">
            <label className={labelClass}>Last Name</label>
            <input
                {...register("lastName")}
                className={cn(
                "w-full px-4 py-2.5 border rounded-xl outline-none transition-all text-sm",
                theme.colors.bg,
                theme.colors.text,
                errors.lastName ? "border-red-500" : theme.colors.border,
                "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
                placeholder="Doe"
            />
            {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message as string}</p>}
            </div>

            <div className="space-y-1.5">
            <label className={labelClass}>Gender</label>
            <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                    <CustomSelect
                        options={[
                            { value: 'unknown', label: 'Prefer not to say' },
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                            { value: 'other', label: 'Other' }
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                    />
                )}
            />
            </div>

            <div className="space-y-1.5">
            <label className={labelClass}>Profile Status</label>
            <Controller
                name="status"
                control={control}
                render={({ field }) => (
                    <CustomSelect
                        options={[
                            { value: 'ghost', label: 'Ghost Profile' },
                            { value: 'active', label: 'Active Member' },
                            { value: 'deceased', label: 'Deceased' },
                            { value: 'archived', label: 'Archived' }
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                    />
                )}
            />
            </div>
        </div>
      </div>

      {/* Birth & Death Section */}
      <div className="space-y-6">
        <h3 className={sectionHeaderClass}>
          <Calendar className={cn("w-5 h-5", theme.colors.accent)} />
          Lifecycle
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
            <label className={labelClass}>Birth Date</label>
            <div className="flex gap-3">
                <input
                    {...register("birthDate")}
                    type="date"
                    className={cn(
                    "flex-1 px-4 py-2.5 border rounded-xl outline-none transition-all text-sm",
                    theme.colors.bg,
                    theme.colors.text,
                    theme.colors.border,
                    "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    )}
                />
                <Controller
                    name="birthDateVisibility"
                    control={control}
                    render={({ field }) => (
                        <CustomSelect
                            options={visibilityOptions}
                            value={field.value}
                            onChange={field.onChange}
                            className="w-32"
                            size="md"
                        />
                    )}
                />
            </div>
            </div>

            <div className="space-y-1.5">
            <label className={labelClass}>Death Date (Optional)</label>
            <input
                {...register("deathDate")}
                type="date"
                className={cn(
                "w-full px-4 py-2.5 border rounded-xl outline-none transition-all text-sm",
                theme.colors.bg,
                theme.colors.text,
                theme.colors.border,
                "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
            />
            </div>
        </div>
      </div>

      {/* Education Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className={sectionHeaderClass}>
                <GraduationCap className={cn("w-5 h-5", theme.colors.accent)} />
                Education
            </h3>
            <label className="flex items-center gap-2 cursor-pointer group">
                <input
                    type="checkbox"
                    {...register("educationSectionVisible" as any)}
                    className="hidden"
                />
                <div className={cn(
                    "p-1.5 rounded-lg transition-all",
                    watch("educationSectionVisible" as any) ? "text-primary bg-primary/10" : "text-red-500 bg-red-500/10"
                )}>
                    {watch("educationSectionVisible" as any) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    {watch("educationSectionVisible" as any) ? "Visible to family" : "Hidden from family"}
                </span>
            </label>
          </div>
          <button
            type="button"
            onClick={() => appendEducation({ id: uuidv4(), school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", description: "", visibility: "tree" })}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", theme.colors.primaryMuted, theme.colors.accent)}
          >
            <Plus className="w-3.5 h-3.5" /> Add Education
          </button>
        </div>

        <div className="space-y-6">
          {educationFields.map((field, index) => (
            <div key={field.id} className={cn("p-6 rounded-2xl border space-y-4 relative group", theme.colors.bg, theme.colors.border)}>
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="absolute top-4 right-4 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>School/University</label>
                  <input
                    {...register(`educations.${index}.school` as any)}
                    className={cn("w-full px-3 py-2 border rounded-lg text-sm", theme.colors.bg, theme.colors.text, theme.colors.border)}
                    placeholder="e.g. University of Oxford"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Degree</label>
                  <input
                    {...register(`educations.${index}.degree` as any)}
                    className={cn("w-full px-3 py-2 border rounded-lg text-sm", theme.colors.bg, theme.colors.text, theme.colors.border)}
                    placeholder="e.g. Bachelor of Science"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Start Date</label>
                    <input
                      type="date"
                      {...register(`educations.${index}.startDate` as any)}
                      className={cn("w-full px-3 py-2 border rounded-lg text-sm", theme.colors.bg, theme.colors.text, theme.colors.border)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>End Date</label>
                    <input
                      type="date"
                      {...register(`educations.${index}.endDate` as any)}
                      className={cn("w-full px-3 py-2 border rounded-lg text-sm", theme.colors.bg, theme.colors.text, theme.colors.border)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Visibility</label>
                  <Controller
                    name={`educations.${index}.visibility` as any}
                    control={control}
                    render={({ field }) => (
                        <CustomSelect
                            options={visibilityOptions}
                            value={field.value}
                            onChange={field.onChange}
                            size="sm"
                        />
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
          {educationFields.length === 0 && (
            <p className={cn("text-sm italic text-center py-4", theme.colors.textMuted)}>No education history added.</p>
          )}
        </div>
      </div>

      {/* Occupation Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className={sectionHeaderClass}>
                <Briefcase className={cn("w-5 h-5", theme.colors.accent)} />
                Occupation
            </h3>
            <label className="flex items-center gap-2 cursor-pointer group">
                <input
                    type="checkbox"
                    {...register("occupationSectionVisible" as any)}
                    className="hidden"
                />
                <div className={cn(
                    "p-1.5 rounded-lg transition-all",
                    watch("occupationSectionVisible" as any) ? "text-primary bg-primary/10" : "text-red-500 bg-red-500/10"
                )}>
                    {watch("occupationSectionVisible" as any) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    {watch("occupationSectionVisible" as any) ? "Visible to family" : "Hidden from family"}
                </span>
            </label>
          </div>
          <button
            type="button"
            onClick={() => appendOccupation({ id: uuidv4(), title: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "", visibility: "tree" })}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", theme.colors.primaryMuted, theme.colors.accent)}
          >
            <Plus className="w-3.5 h-3.5" /> Add Occupation
          </button>
        </div>

        <div className="space-y-6">
          {occupationFields.map((field, index) => (
            <div key={field.id} className={cn("p-6 rounded-2xl border space-y-4 relative group", theme.colors.bg, theme.colors.border)}>
              <button
                type="button"
                onClick={() => removeOccupation(index)}
                className="absolute top-4 right-4 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Job Title</label>
                  <input
                    {...register(`occupations.${index}.title` as any)}
                    className={cn("w-full px-3 py-2 border rounded-lg text-sm", theme.colors.bg, theme.colors.text, theme.colors.border)}
                    placeholder="e.g. Senior Architect"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Company</label>
                  <input
                    {...register(`occupations.${index}.company` as any)}
                    className={cn("w-full px-3 py-2 border rounded-lg text-sm", theme.colors.bg, theme.colors.text, theme.colors.border)}
                    placeholder="e.g. Google"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Start Date</label>
                    <input
                      type="date"
                      {...register(`occupations.${index}.startDate` as any)}
                      className={cn("w-full px-3 py-2 border rounded-lg text-sm", theme.colors.bg, theme.colors.text, theme.colors.border)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>End Date</label>
                    <div className="space-y-2">
                        <input
                            type="date"
                            disabled={watch(`occupations.${index}.isCurrent` as any)}
                            {...register(`occupations.${index}.endDate` as any)}
                            className={cn("w-full px-3 py-2 border rounded-lg text-sm disabled:opacity-30", theme.colors.bg, theme.colors.text, theme.colors.border)}
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register(`occupations.${index}.isCurrent` as any)}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className={cn("text-[10px] font-bold uppercase tracking-wider", theme.colors.textMuted)}>I currently work here</span>
                        </label>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Visibility</label>
                  <Controller
                    name={`occupations.${index}.visibility` as any}
                    control={control}
                    render={({ field }) => (
                        <CustomSelect
                            options={visibilityOptions}
                            value={field.value}
                            onChange={field.onChange}
                            size="sm"
                        />
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
          {occupationFields.length === 0 && (
            <p className={cn("text-sm italic text-center py-4", theme.colors.textMuted)}>No experience added.</p>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="space-y-6">
        <h3 className={sectionHeaderClass}>
          <Mail className={cn("w-5 h-5", theme.colors.accent)} />
          Contact & Privacy
        </h3>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <label className={labelClass}>Email Address</label>
              <input
                {...register("email")}
                type="email"
                className={cn("w-full px-4 py-2.5 border rounded-xl text-sm", theme.colors.bg, theme.colors.text, theme.colors.border)}
                placeholder="email@example.com"
              />
            </div>
            <Controller
                name="emailVisibility"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                      options={visibilityOptions}
                      value={field.value}
                      onChange={field.onChange}
                      size="md"
                  />
                )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <label className={labelClass}>Phone Number</label>
              <input
                {...register("phone")}
                className={cn("w-full px-4 py-2.5 border rounded-xl text-sm", theme.colors.bg, theme.colors.text, theme.colors.border)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <Controller
                name="phoneVisibility"
                control={control}
                render={({ field }) => (
                    <CustomSelect
                        options={visibilityOptions}
                        value={field.value}
                        onChange={field.onChange}
                        size="md"
                    />
                )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <label className={labelClass}>Address</label>
              <input
                {...register("address")}
                className={cn("w-full px-4 py-2.5 border rounded-xl text-sm", theme.colors.bg, theme.colors.text, theme.colors.border)}
                placeholder="123 Main St, City, State"
              />
            </div>
            <Controller
                name="addressVisibility"
                control={control}
                render={({ field }) => (
                    <CustomSelect
                        options={visibilityOptions}
                        value={field.value}
                        onChange={field.onChange}
                        size="md"
                    />
                )}
            />
          </div>
        </div>
      </div>

      {!isEditing && (
        <div className={cn("border-t pt-10 space-y-6", theme.colors.border)}>
          <h3 className={sectionHeaderClass}>
            <Link2 className={cn("w-5 h-5", theme.colors.accent)} />
            Link with Existing Member
          </h3>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4", theme.colors.textMuted)} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search existing members..."
                className={cn("w-full pl-12 pr-4 py-3 border rounded-xl text-sm", theme.colors.bg, theme.colors.text, theme.colors.border)}
              />
            </div>

            {searchTerm && filteredPeople && filteredPeople.length > 0 && (
              <div className={cn("max-h-60 overflow-y-auto border rounded-xl shadow-lg", theme.colors.border, theme.colors.surface)}>
                {filteredPeople.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedLinkPerson(p);
                      setSearchTerm("");
                    }}
                    className={cn("w-full px-6 py-4 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-between", theme.colors.text)}
                  >
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
                  <div>
                    <p className={cn("text-sm font-bold", theme.colors.text)}>
                      Successfully linked to {selectedLinkPerson.firstName} {selectedLinkPerson.lastName}
                    </p>
                    <p className="text-[10px] uppercase font-black opacity-40">Profile will be automatically connected</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedLinkPerson(null)}
                  className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={cn("w-full py-4 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3", theme.colors.primary)}
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {isEditing ? "Update Profile" : "Create Profile"}
      </button>
    </form>
  );
}
