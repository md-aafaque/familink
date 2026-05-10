"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { ArrowLeft, Users, User } from 'lucide-react';

export default function TreePage() {
  const params = useParams() as any;
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      setError('');
      const res = await api.get(`/people/${id}/tree`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load family tree');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading family tree...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </button>
        <div className="card text-center py-12">
          <p className="text-red-600 font-medium mb-2">Error</p>
          <p className="text-slate-600">{error || 'Failed to load family tree'}</p>
        </div>
      </div>
    );
  }

  const personCount = 1 + (data.level1?.length || 0) + (data.level2?.length || 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1>Family Tree</h1>
        <p className="text-slate-600 mt-1">{personCount} family members found</p>
      </div>

      {/* Center Person */}
      <div className="card bg-linear-to-r from-orange-50 to-blue-50 border-orange-200">
        <div className="card-header">
          <h3 className="flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" />
            You
          </h3>
        </div>
        <div className="space-y-3">
          <a
            href={`/person/${data.person.id}`}
            className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <h4 className="font-semibold text-slate-900 text-lg mb-1">{data.person.name}</h4>
            <p className="text-sm text-slate-600">ID: {data.person.id}</p>
          </a>
        </div>
      </div>

      {/* Level 1 - Direct Relations */}
      {data.level1 && data.level1.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Direct Relations ({data.level1.length})
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.level1.map((p: any) => (
              <a
                key={p.id}
                href={`/person/${p.id}`}
                className="p-4 bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-slate-900">{p.name}</h4>
                <p className="text-xs text-slate-600 mt-1">ID: {p.id}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Level 2 - Extended Relations */}
      {data.level2 && data.level2.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              Extended Family ({data.level2.length})
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.level2.map((p: any) => (
              <a
                key={p.id}
                href={`/person/${p.id}`}
                className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-slate-900">{p.name}</h4>
                <p className="text-xs text-slate-600 mt-1">ID: {p.id}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!data.level1 || data.level1.length === 0) && (!data.level2 || data.level2.length === 0) && (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">No relatives found yet</p>
          <p className="text-sm text-slate-500">Add relationships to see family members here</p>
        </div>
      )}
    </div>
  );
}
