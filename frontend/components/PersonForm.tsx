"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPersonSchema, updatePersonSchema, CreatePersonInput, UpdatePersonInput } from "@shared/schemas/people";
import { Loader2, Save, User as UserIcon, Shield, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

interface PersonFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  treeId?: string; // Add treeId prop for create operations
}

export default function PersonForm({ initialData, onSubmit, isLoading, treeId }: PersonFormProps) {
  const isEditing = !!initialData;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditing ? updatePersonSchema : createPersonSchema),
    defaultValues: initialData || {
      status: 'ghost',
      gender: 'unknown',
      phoneVisibility: 'tree',
      emailVisibility: 'tree',
      addressVisibility: 'tree',
      birthDateVisibility: 'tree',
      ...(treeId && { treeId }), // Include treeId in defaults for create operations
    },
  });
  console.log("FORM ERRORS:", errors);

  const visibilityOptions = [
    { value: 'tree', label: 'Family Tree', icon: Globe },
    { value: 'editors', label: 'Editors Only', icon: Shield },
    { value: 'private', label: 'Private', icon: Lock },
  ];

  const processSubmit = (data: any) => {
    // Convert empty strings to null for optional/nullable fields
    const processed = Object.entries(data).reduce((acc: any, [key, value]) => {
      // Don't convert treeId, and handle specific fields appropriately
      if (key === 'treeId') {
        acc[key] = value;
      } else if (key === 'lastName' && value === '') {
        // lastName can be undefined (not null) when empty
        acc[key] = undefined;
      } else if (['birthDate', 'deathDate', 'phone', 'email', 'address'].includes(key) && value === '') {
        // These fields should be null when empty
        acc[key] = null;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    // Ensure treeId is included for create operations
    if (!isEditing && treeId && !processed.treeId) {
      processed.treeId = treeId;
    }

    console.log("PROCESSED DATA:", processed);
    onSubmit(processed);
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Fields */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">First Name</label>
          <input
            {...register("firstName")}
            className={cn(
              "w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all",
              errors.firstName ? "border-red-500" : "border-slate-200"
            )}
            placeholder="John"
          />
          {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Last Name</label>
          <input
            {...register("lastName")}
            className={cn(
              "w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all",
              errors.lastName ? "border-red-500" : "border-slate-200"
            )}
            placeholder="Doe"
          />
          {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message as string}</p>}
        </div>

        {/* Basic Info */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Gender</label>
          <select
            {...register("gender")}
            className={cn(
              "w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none bg-white",
              errors.gender ? "border-red-500" : "border-slate-200"
            )}
          >
            <option value="unknown">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && <p className="text-xs text-red-500">{errors.gender.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Profile Status</label>
          <select
            {...register("status")}
            className={cn(
              "w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none bg-white",
              errors.status ? "border-red-500" : "border-slate-200"
            )}
          >
            <option value="ghost">Ghost Profile</option>
            <option value="active">Active Member</option>
            <option value="deceased">Deceased</option>
            <option value="archived">Archived</option>
          </select>
          {errors.status && <p className="text-xs text-red-500">{errors.status.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Birth Date</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <input
                {...register("birthDate")}
                type="date"
                className={cn(
                  "w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all",
                  errors.birthDate ? "border-red-500" : "border-slate-200"
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Who can see this?</label>
              <select
                {...register("birthDateVisibility")}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none bg-white"
              >
                {visibilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          {errors.birthDate && <p className="text-xs text-red-500">{errors.birthDate.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Death Date (Optional)</label>
          <input
            {...register("deathDate")}
            type="date"
            className={cn(
              "w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all",
              errors.deathDate ? "border-red-500" : "border-slate-200"
            )}
          />
          {errors.deathDate && <p className="text-xs text-red-500">{errors.deathDate.message as string}</p>}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-8 space-y-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-600" />
          Contact & Privacy
        </h3>

        <div className="space-y-6">
          {/* Email */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700">Email Address</label>
              <input
                {...register("email")}
                type="email"
                className={cn(
                  "w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all",
                  errors.email ? "border-red-500" : "border-slate-200"
                )}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Who can see this?</label>
              <select
                {...register("emailVisibility")}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none bg-white"
              >
                {visibilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email.message as string}</p>}

          {/* Phone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700">Phone Number</label>
              <input
                {...register("phone")}
                className={cn(
                  "w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all",
                  errors.phone ? "border-red-500" : "border-slate-200"
                )}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Who can see this?</label>
              <select
                {...register("phoneVisibility")}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none bg-white"
              >
                {visibilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message as string}</p>}

          {/* Address */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700">Address</label>
              <input
                {...register("address")}
                className={cn(
                  "w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all",
                  errors.address ? "border-red-500" : "border-slate-200"
                )}
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Who can see this?</label>
              <select
                {...register("addressVisibility")}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none bg-white"
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
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {isEditing ? "Save Profile Changes" : "Create Person Profile"}
      </button>
    </form>
  );
}
