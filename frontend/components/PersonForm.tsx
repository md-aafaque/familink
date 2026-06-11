"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPersonSchema, updatePersonSchema, CreatePersonInput, UpdatePersonInput, Person } from "@shared/schemas/people";
import { Loader2, Save, User as UserIcon, Shield, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "./providers/ThemeProvider";

interface PersonFormProps {
  initialData?: Partial<Person>;
  onSubmit: (data: CreatePersonInput | UpdatePersonInput) => void;
  isLoading?: boolean;
  treeId?: string; // Add treeId prop for create operations
}

export default function PersonForm({ initialData, onSubmit, isLoading, treeId }: PersonFormProps) {
  const isEditing = !!initialData;
  const { theme } = useAppTheme();
  const {
    register,
    handleSubmit,
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
      ...(treeId && { treeId }), // Include treeId in defaults for create operations
    },
  });

  const visibilityOptions = [
    { value: 'tree', label: 'Family Tree', icon: Globe },
    { value: 'editors', label: 'Editors Only', icon: Shield },
    { value: 'private', label: 'Private', icon: Lock },
  ];

  const processSubmit = (data: CreatePersonInput | UpdatePersonInput) => {
    // Convert empty strings to null for optional/nullable fields
    const processed = Object.entries(data).reduce((acc, [key, value]) => {
      // Don't convert treeId, and handle specific fields appropriately
      if (key === 'treeId') {
        (acc as any)[key] = value;
      } else if (key === 'lastName' && value === '') {
        // lastName can be undefined (not null) when empty
        (acc as any)[key] = undefined;
      } else if (['birthDate', 'deathDate', 'phone', 'email', 'address'].includes(key) && value === '') {
        // These fields should be null when empty
        (acc as any)[key] = null;
      } else {
        (acc as any)[key] = value;
      }
      return acc;
    }, {} as any);
    
    // Ensure treeId is included for create operations
    if (!isEditing && treeId && !processed.treeId) {
      processed.treeId = treeId;
    }

    onSubmit(processed);
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name Fields */}
        <div className="space-y-1.5">
          <label className={cn("text-sm font-semibold", theme.colors.textMuted)}>
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register("firstName")}
            className={cn(
              "w-full px-3 py-2 border rounded-md outline-none transition-all text-sm",
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
          <label className={cn("text-sm font-semibold", theme.colors.textMuted)}>Last Name</label>
          <input
            {...register("lastName")}
            className={cn(
              "w-full px-3 py-2 border rounded-md outline-none transition-all text-sm",
              theme.colors.bg,
              theme.colors.text,
              errors.lastName ? "border-red-500" : theme.colors.border,
              "focus:ring-2 focus:ring-primary/20 focus:border-primary"
            )}
            placeholder="Doe"
          />
          {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message as string}</p>}
        </div>

        {/* Basic Info */}
        <div className="space-y-1.5">
          <label className={cn("text-sm font-semibold", theme.colors.textMuted)}>Gender</label>
          <select
            {...register("gender")}
            className={cn(
              "w-full px-3 py-2 border rounded-md outline-none transition-all appearance-none text-sm",
              theme.colors.bg,
              theme.colors.text,
              errors.gender ? "border-red-500" : theme.colors.border,
              "focus:ring-2 focus:ring-primary/20 focus:border-primary"
            )}
          >
            <option value="unknown">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && <p className="text-xs text-red-500">{errors.gender.message as string}</p>}
        </div>

        <div className="space-y-1.5">
          <label className={cn("text-sm font-semibold", theme.colors.textMuted)}>Profile Status</label>
          <select
            {...register("status")}
            className={cn(
              "w-full px-3 py-2 border rounded-md outline-none transition-all appearance-none text-sm",
              theme.colors.bg,
              theme.colors.text,
              errors.status ? "border-red-500" : theme.colors.border,
              "focus:ring-2 focus:ring-primary/20 focus:border-primary"
            )}
          >
            <option value="ghost">Ghost Profile</option>
            <option value="active">Active Member</option>
            <option value="deceased">Deceased</option>
            <option value="archived">Archived</option>
          </select>
          {errors.status && <p className="text-xs text-red-500">{errors.status.message as string}</p>}
        </div>

        <div className="space-y-1.5">
          <label className={cn("text-sm font-semibold", theme.colors.textMuted)}>Birth Date</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <input
                {...register("birthDate")}
                type="date"
                className={cn(
                  "w-full px-3 py-2 border rounded-md outline-none transition-all text-sm",
                  theme.colors.bg,
                  theme.colors.text,
                  errors.birthDate ? "border-red-500" : theme.colors.border,
                  "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
              />
            </div>
            <div className="space-y-1">
              <label className={cn("text-[10px] font-bold uppercase tracking-wider opacity-60")}>Visibility</label>
              <select
                {...register("birthDateVisibility")}
                className={cn(
                  "w-full px-2 py-2 border rounded-md outline-none transition-all appearance-none text-xs",
                  theme.colors.bg,
                  theme.colors.text,
                  theme.colors.border,
                  "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
              >
                {visibilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          {errors.birthDate && <p className="text-xs text-red-500">{errors.birthDate.message as string}</p>}
        </div>

        <div className="space-y-1.5">
          <label className={cn("text-sm font-semibold", theme.colors.textMuted)}>Death Date (Optional)</label>
          <input
            {...register("deathDate")}
            type="date"
            className={cn(
              "w-full px-3 py-2 border rounded-md outline-none transition-all text-sm",
              theme.colors.bg,
              theme.colors.text,
              errors.deathDate ? "border-red-500" : theme.colors.border,
              "focus:ring-2 focus:ring-primary/20 focus:border-primary"
            )}
          />
          {errors.deathDate && <p className="text-xs text-red-500">{errors.deathDate.message as string}</p>}
        </div>
      </div>

      <div className={cn("border-t pt-6 space-y-4", theme.colors.border)}>
        <h3 className={cn("text-base font-bold flex items-center gap-2", theme.colors.text)}>
          <Shield className={cn("w-4 h-4", theme.colors.accent)} />
          Privacy & Contact
        </h3>

        <div className="space-y-4">
          {/* Email */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <label className={cn("text-sm font-semibold", theme.colors.textMuted)}>Email Address</label>
              <input
                {...register("email")}
                type="email"
                className={cn(
                  "w-full px-3 py-2 border rounded-md outline-none transition-all text-sm",
                  theme.colors.bg,
                  theme.colors.text,
                  errors.email ? "border-red-500" : theme.colors.border,
                  "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className={cn("text-[10px] font-bold uppercase tracking-wider opacity-60")}>Visibility</label>
              <select
                {...register("emailVisibility")}
                className={cn(
                  "w-full px-2 py-2 border rounded-md outline-none transition-all appearance-none text-xs",
                  theme.colors.bg,
                  theme.colors.text,
                  theme.colors.border,
                  "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
              >
                {visibilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email.message as string}</p>}

          {/* Phone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <label className={cn("text-sm font-semibold", theme.colors.textMuted)}>Phone Number</label>
              <input
                {...register("phone")}
                className={cn(
                  "w-full px-3 py-2 border rounded-md outline-none transition-all text-sm",
                  theme.colors.bg,
                  theme.colors.text,
                  errors.phone ? "border-red-500" : theme.colors.border,
                  "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-1">
              <label className={cn("text-[10px] font-bold uppercase tracking-wider opacity-60")}>Visibility</label>
              <select
                {...register("phoneVisibility")}
                className={cn(
                  "w-full px-2 py-2 border rounded-md outline-none transition-all appearance-none text-xs",
                  theme.colors.bg,
                  theme.colors.text,
                  theme.colors.border,
                  "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
              >
                {visibilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message as string}</p>}

          {/* Address */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <label className={cn("text-sm font-semibold", theme.colors.textMuted)}>Address</label>
              <input
                {...register("address")}
                className={cn(
                  "w-full px-3 py-2 border rounded-md outline-none transition-all text-sm",
                  theme.colors.bg,
                  theme.colors.text,
                  errors.address ? "border-red-500" : theme.colors.border,
                  "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>
            <div className="space-y-1">
              <label className={cn("text-[10px] font-bold uppercase tracking-wider opacity-60")}>Visibility</label>
              <select
                {...register("addressVisibility")}
                className={cn(
                  "w-full px-2 py-2 border rounded-md outline-none transition-all appearance-none text-xs",
                  theme.colors.bg,
                  theme.colors.text,
                  theme.colors.border,
                  "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
              >
                {visibilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          {errors.address && <p className="text-xs text-red-500">{errors.address.message as string}</p>}
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className={cn("w-full py-3 text-white rounded-md font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm mt-4", theme.colors.primary)}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isEditing ? "Update Profile" : "Create Profile"}
      </button>
    </form>
  );
}
