"use client";
import { useRouter } from 'next/navigation';
import { Shield, Users, Settings, ArrowRight, Link2 } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1>Admin Dashboard</h1>
        </div>
        <p className="text-slate-600">Manage users and system settings</p>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending User Approvals */}
        <button
          onClick={() => router.push('/admin/pending-users')}
          className="card group hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-orange-600 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Pending User Approvals</h3>
          <p className="text-slate-600">Review and approve new user accounts</p>
        </button>

        {/* Pending Relationship Approvals */}
        <button
          onClick={() => router.push('/admin/pending-relationships')}
          className="card group hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Link2 className="w-6 h-6 text-purple-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Pending Relationships</h3>
          <p className="text-slate-600">Review and approve family relationships</p>
        </button>

        {/* Settings */}
        <button
          onClick={() => router.push('/admin/settings')}
          className="card group hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">System Settings</h3>
          <p className="text-slate-600">Configure system options and preferences</p>
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card">
          <div className="text-3xl font-bold text-orange-600 mb-2">👥</div>
          <h4 className="font-semibold text-slate-900 mb-1">User Management</h4>
          <p className="text-sm text-slate-600">Approve, reject, and manage user accounts</p>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-blue-600 mb-2">🛡️</div>
          <h4 className="font-semibold text-slate-900 mb-1">Admin Controls</h4>
          <p className="text-sm text-slate-600">Create new admin accounts for other admins</p>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-slate-600 mb-2">⚙️</div>
          <h4 className="font-semibold text-slate-900 mb-1">Configuration</h4>
          <p className="text-sm text-slate-600">Manage system settings and preferences</p>
        </div>
      </div>
    </div>
  );
}
