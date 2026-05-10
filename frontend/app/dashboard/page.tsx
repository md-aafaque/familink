"use client";
import { useEffect, useState } from 'react';
import api from '../../lib/api'
import { Plus, User, Calendar, Link as LinkIcon } from 'lucide-react';

type Person = { id: string; name: string; dob?: string | null; dod?: string | null; createdBy?: string };

export default function Dashboard() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get('/people');
      setPeople(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load people');
      setPeople([]);
    }
  }

  useEffect(() => { load(); }, []);

  async function create(e: any) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post('/people', { name });
      setName('');
      setError('');
      load();
    } catch (err) {
      console.error(err);
      setError('Failed to create person');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="mb-2">Family Members</h1>
        <p className="text-slate-600">Manage and explore your family tree</p>
      </div>

      {/* Create Form */}
      <div className="card">
        <div className="card-header">
          <h3 className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-600" />
            Add New Family Member
          </h3>
        </div>
        
        <form onSubmit={create} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter family member's name..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 input-field"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="btn-primary whitespace-nowrap flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Adding...' : 'Add Person'}
          </button>
        </form>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* People List */}
      <div>
        <h2 className="mb-4">Family Members ({people.length})</h2>
        
        {people.length === 0 ? (
          <div className="card text-center py-12">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No family members yet</p>
            <p className="text-sm text-slate-500">Add your first family member to get started</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {people.map(p => (
              <a
                key={p.id}
                href={`/person/${p.id}`}
                className="card group hover:border-primary-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-linear-to-br from-orange-100 to-blue-100 rounded-lg group-hover:from-orange-200 group-hover:to-blue-200 transition-colors">
                    <User className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
                      {p.name}
                    </h3>
                    <div className="flex flex-col gap-1 mt-2 text-sm text-slate-600">
                      {p.dob && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Born: {p.dob}</span>
                        </div>
                      )}
                      {p.dod && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Passed: {p.dod}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-blue-600 text-sm font-medium group-hover:gap-3 transition-all">
                    View Details
                    <LinkIcon className="w-4 h-4" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
