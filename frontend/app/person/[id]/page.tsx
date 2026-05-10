"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';
import { Edit2, Link as LinkIcon, Share2, Trees, Save, X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PersonPage() {
  const params = useParams() as any;
  const id = params.id as string;
  const [person, setPerson] = useState<any>(null);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [dod, setDod] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claimToken, setClaimToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allPeople, setAllPeople] = useState<any[]>([]);
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);
  const [relationType, setRelationType] = useState('PARENT_OF');
  const [targetPersonId, setTargetPersonId] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      setError('');
      const [personRes, peopleRes] = await Promise.all([
        api.get(`/people/${id}`),
        api.get(`/people`)
      ]);
      setPerson(personRes.data);
      setName(personRes.data.name || '');
      setDob(personRes.data.dob || '');
      setDod(personRes.data.dod || '');
      setAllPeople(peopleRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load person');
    }
  }

  async function save(e: any) {
    e.preventDefault();
    setLoading(true);
    try {
      setError('');
      await api.put(`/people/${id}`, { name, dob, dod });
      setSuccess('Changes saved!');
      setEditing(false);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  async function generateClaim() {
    setLoading(true);
    try {
      setError('');
      const res = await api.post(`/claim-link/${id}`);
      setClaimToken(res.data.token);
      setSuccess('Claim link generated!');
    } catch (err) {
      console.error(err);
      setError('Failed to generate claim link');
    } finally {
      setLoading(false);
    }
  }

  async function createRelationship(e: any) {
    e.preventDefault();
    if (!targetPersonId) {
      setError('Please select a family member');
      return;
    }

    setLoading(true);
    try {
      setError('');
      const res = await api.post('/relationship', {
        fromPersonId: id,
        toPersonId: targetPersonId,
        type: relationType,
      });
      
      setRelationshipStatus(res.data.status);
      setSuccess(
        res.data.status === 'approved' 
          ? 'Relationship created successfully!' 
          : 'Relationship pending admin approval'
      );
      
      setShowRelationshipForm(false);
      setTargetPersonId('');
      setTimeout(() => {
        setSuccess('');
        setRelationshipStatus('');
        load();
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to create relationship');
    } finally {
      setLoading(false);
    }
  }

  if (!person) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>{person.name}</h1>
          <p className="text-slate-600 mt-1">ID: {person.id}</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <X className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3>Personal Information</h3>
            </div>

            {editing ? (
              <form onSubmit={save} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full input-field"
                    disabled={loading}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      className="w-full input-field"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date of Death</label>
                    <input
                      type="date"
                      value={dod}
                      onChange={e => setDod(e.target.value)}
                      className="w-full input-field"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Name</p>
                  <p className="text-lg font-semibold text-slate-900">{person.name}</p>
                </div>
                {person.dob && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Date of Birth</p>
                    <p className="text-slate-900">{person.dob}</p>
                  </div>
                )}
                {person.dod && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Date of Death</p>
                    <p className="text-slate-900">{person.dod}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <a
                href={`/tree/${id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-linear-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-colors cursor-pointer text-blue-700 font-medium"
              >
                <Trees className="w-5 h-5" />
                <span>View Family Tree</span>
              </a>

              <button
                onClick={generateClaim}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-linear-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-colors text-orange-700 font-medium disabled:opacity-50"
              >
                <Share2 className="w-5 h-5" />
                <span>{loading ? 'Generating...' : 'Generate Claim Link'}</span>
              </button>

              <motion.button
                onClick={() => setShowRelationshipForm(!showRelationshipForm)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-linear-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors text-purple-700 font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Create Relationship</span>
              </motion.button>
            </div>
          </div>

          {claimToken && (
            <div className="card bg-amber-50 border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-3">Share This Link</h4>
              <div className="bg-white rounded p-3 mb-3 break-all text-sm text-slate-700 font-mono">
                {window.location.origin}/claim/{claimToken}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/claim/${claimToken}`);
                  alert('Copied to clipboard!');
                }}
                className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Relationship Creation Form */}
      {showRelationshipForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Create Relationship</h3>
            <button
              onClick={() => setShowRelationshipForm(false)}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={createRelationship} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">From Person</label>
                <input
                  type="text"
                  value={person?.name || ''}
                  disabled
                  className="w-full input-field bg-slate-100 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">This person (cannot change)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Relationship Type *</label>
                <select
                  value={relationType}
                  onChange={e => setRelationType(e.target.value)}
                  className="w-full input-field"
                  disabled={loading}
                >
                  <option value="PARENT_OF">Parent Of</option>
                  <option value="MARRIED_TO">Married To</option>
                  <option value="SIBLING_OF">Sibling Of</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">To Person *</label>
              {allPeople.length === 0 ? (
                <p className="text-sm text-slate-600 p-3 bg-white rounded border border-slate-200">
                  No other family members found. Create more family members first.
                </p>
              ) : (
                <select
                  value={targetPersonId}
                  onChange={e => setTargetPersonId(e.target.value)}
                  className="w-full input-field"
                  disabled={loading}
                >
                  <option value="">-- Select a family member --</option>
                  {allPeople
                    .filter(p => p.id !== id)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              )}
              <p className="text-xs text-slate-600 mt-1">
                If both people have the same creator, the relationship will be approved immediately. Otherwise, it will need admin approval.
              </p>
            </div>

            {relationshipStatus && (
              <div className={`p-3 rounded-lg text-sm font-medium ${
                relationshipStatus === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {relationshipStatus === 'approved' 
                  ? '✓ Relationship approved'
                  : '⏳ Relationship pending admin approval'}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <motion.button
                type="submit"
                disabled={loading || !targetPersonId}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {loading ? 'Creating...' : 'Create Relationship'}
              </motion.button>
              <button
                type="button"
                onClick={() => setShowRelationshipForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}
  );
}
