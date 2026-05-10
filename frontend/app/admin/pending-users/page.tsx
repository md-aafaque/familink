"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { Check, X, Loader, AlertCircle, Users, Clock, ArrowLeft } from 'lucide-react';

type PendingUser = {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt: number;
};

export default function AdminPendingUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [approving, setApproving] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
    try {
      // Check if user is admin
      const userRes = await api.get('/auth/me');
      if (userRes.data.role !== 'admin') {
        setError('You must be an admin to access this page');
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      // Load pending users
      const res = await api.get('/admin/pending-users');
      setUsers(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setApproving(prev => ({ ...prev, [userId]: true }));
    try {
      await api.post('/admin/approve-user', { userId });
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to approve user');
    } finally {
      setApproving(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleReject = async (userId: string) => {
    setApproving(prev => ({ ...prev, [userId]: true }));
    try {
      await api.post('/admin/reject-user', { userId, reason: 'Rejected by admin' });
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to reject user');
    } finally {
      setApproving(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-slate-600">Verifying admin access...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">You must be an admin to access this page.</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/admin')}
        className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 mb-2">
          <Users className="w-8 h-8 text-orange-600" />
          Pending User Approvals
        </h1>
        <p className="text-slate-600">Review and approve new user accounts</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Users List */}
      {users.length === 0 ? (
        <div className="card text-center py-12">
          <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">No pending users</p>
          <p className="text-sm text-slate-500">All user accounts have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="card">
              <div className="flex items-center justify-between gap-4">
                {/* User Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{user.name}</h3>
                  <p className="text-sm text-slate-600">{user.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Applied: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={approving[user.id]}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors disabled:opacity-50"
                  >
                    {approving[user.id] ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(user.id)}
                    disabled={approving[user.id]}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-colors disabled:opacity-50"
                  >
                    {approving[user.id] ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
