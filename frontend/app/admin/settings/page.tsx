"use client";
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';

export default function AdminSettings() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1>System Settings</h1>
        </div>
        <p className="text-slate-600">Configure system options and preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="card">
        <div className="border-b border-slate-200 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">General Settings</h3>
          <p className="text-slate-600">Configure general system settings</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">System Name</label>
            <input
              type="text"
              value="Family Tree Application"
              disabled
              className="w-full input-field bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Version</label>
            <input
              type="text"
              value="1.0.0"
              disabled
              className="w-full input-field bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* User Settings */}
      <div className="card">
        <div className="border-b border-slate-200 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">User Settings</h3>
          <p className="text-slate-600">Configure user-related options</p>
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-slate-700">Require email verification for new users</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-slate-700">Require admin approval for user accounts</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-slate-700">Allow users to delete their own accounts</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button className="btn-primary">Save Settings</button>
        <button className="btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
