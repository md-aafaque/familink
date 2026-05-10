"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';

type PendingRelationship = {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  type: string;
  status: string;
  requestedBy: string;
  creatorFrom: string;
  creatorTo: string;
  createdAt: number;
  fromPerson?: any;
  toPerson?: any;
};

export default function PendingRelationshipsPage() {
  const router = useRouter();
  const [relationships, setRelationships] = useState<PendingRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadRelationships();
  }, []);

  async function loadRelationships() {
    try {
      setLoading(true);
      const res = await api.get('/admin/pending-relationships');
      setRelationships(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function approveRelationship(id: string) {
    setApproving(id);
    try {
      await api.post(`/admin/approve-relationship`, { relationshipId: id });
      await loadRelationships();
    } catch (err) {
      console.error(err);
      alert('Failed to approve relationship');
    } finally {
      setApproving(null);
    }
  }

  async function rejectRelationship(id: string) {
    const reason = rejectReason[id] || '';
    setRejecting(id);
    try {
      await api.post(`/admin/reject-relationship`, {
        relationshipId: id,
        reason: reason || 'No reason provided',
      });
      await loadRelationships();
      setShowRejectForm(prev => ({ ...prev, [id]: false }));
      setRejectReason(prev => ({ ...prev, [id]: '' }));
    } catch (err) {
      console.error(err);
      alert('Failed to reject relationship');
    } finally {
      setRejecting(null);
    }
  }

  const getRelationshipLabel = (type: string) => {
    switch (type) {
      case 'PARENT_OF':
        return 'Parent Of';
      case 'MARRIED_TO':
        return 'Married To';
      case 'SIBLING_OF':
        return 'Sibling Of';
      default:
        return type;
    }
  };

  return (
    <div>
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Back Button */}
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Pending Relationships</h1>
          <p className="text-slate-600 mb-8">Review and approve or reject relationship requests</p>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full" />
              </div>
              <p className="text-slate-600 mt-4 font-medium">Loading pending relationships...</p>
            </div>
          ) : relationships.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">All Caught Up!</h2>
              <p className="text-slate-600">There are no pending relationship requests to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {relationships.map((rel, idx) => (
                <motion.div
                  key={rel.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Main Content */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      {/* From Person */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">From</p>
                        <p className="text-lg font-semibold text-slate-900 truncate">
                          {rel.fromPerson?.name || rel.fromPersonId}
                        </p>
                        <p className="text-sm text-slate-600">Creator: {rel.creatorFrom.slice(0, 8)}...</p>
                      </div>

                      {/* Relationship Type */}
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium text-sm">
                          <ArrowRight className="w-4 h-4" />
                          {getRelationshipLabel(rel.type)}
                        </div>
                        <p className="text-xs text-slate-600 mt-2">
                          Requested by: {rel.requestedBy.slice(0, 8)}...
                        </p>
                      </div>

                      {/* To Person */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">To</p>
                        <p className="text-lg font-semibold text-slate-900 truncate">
                          {rel.toPerson?.name || rel.toPersonId}
                        </p>
                        <p className="text-sm text-slate-600">Creator: {rel.creatorTo.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Different Creators</p>
                      <p className="text-blue-700">
                        These family members were created by different users. Admin approval is required.
                      </p>
                    </div>
                  </div>

                  {/* Request Date */}
                  <p className="text-sm text-slate-500 mb-4">
                    Requested: {new Date(rel.createdAt).toLocaleDateString()} {new Date(rel.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>

                  {/* Reject Form */}
                  {showRejectForm[rel.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
                    >
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Rejection Reason (optional)
                      </label>
                      <textarea
                        value={rejectReason[rel.id] || ''}
                        onChange={e => setRejectReason(prev => ({ ...prev, [rel.id]: e.target.value }))}
                        placeholder="e.g., Duplicate relationship, incorrect information, etc."
                        className="w-full input-field mb-3"
                        rows={3}
                      />
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => approveRelationship(rel.id)}
                      disabled={approving === rel.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {approving === rel.id ? 'Approving...' : 'Approve'}
                    </motion.button>

                    {!showRejectForm[rel.id] ? (
                      <motion.button
                        onClick={() => setShowRejectForm(prev => ({ ...prev, [rel.id]: true }))}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </motion.button>
                    ) : (
                      <>
                        <motion.button
                          onClick={() => rejectRelationship(rel.id)}
                          disabled={rejecting === rel.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          {rejecting === rel.id ? 'Rejecting...' : 'Confirm Reject'}
                        </motion.button>
                        <button
                          onClick={() => setShowRejectForm(prev => ({ ...prev, [rel.id]: false }))}
                          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CheckCircle({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}
