import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import { getCareerPaths, type CareerPath } from '@/lib/api/career';
import { ErrorState, SkeletonBlock, streamBadge } from './_shared';

const FILTERS: { key: string; label: string; match: (c: CareerPath) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'science', label: 'Science', match: (c) => c.stream === 'science' },
  { key: 'commerce', label: 'Commerce', match: (c) => c.stream === 'commerce' },
  { key: 'arts', label: 'Arts', match: (c) => c.stream === 'arts' },
  { key: 'modern', label: 'Modern', match: (c) => c.stream === 'any' },
];

export default function CareerExplorer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const streamParam = searchParams.get('stream');
  const initialFilter = streamParam === 'any' ? 'modern' : (FILTERS.find((f) => f.key === streamParam)?.key ?? 'all');

  const [careers, setCareers] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    setError(null);
    getCareerPaths()
      .then(setCareers)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load careers'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    const activeFilter = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
    const q = search.trim().toLowerCase();
    return careers.filter((c) => activeFilter.match(c) && (!q || c.title.toLowerCase().includes(q)));
  }, [careers, filter, search]);

  return (
    <div className="w-full space-y-5 p-1">
      <div>
        <button onClick={() => navigate('/school/student/career')} className="mb-1 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600"><ArrowLeft className="h-3.5 w-3.5" /> Career Home</button>
        <h1 className="text-2xl font-black text-slate-900">Explore Careers</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search careers…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400" />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${filter === f.key ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-36 w-full" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No careers match your search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => navigate(`/school/student/career/explore/${c.id}`)}
              className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:shadow-md">
              <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
              <span className={`mt-1 w-fit rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${streamBadge(c.stream)}`}>{c.stream}</span>
              <p className="mt-2 line-clamp-2 text-xs text-slate-500">{c.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(c.exams ?? []).slice(0, 2).map((e) => <span key={e} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{e}</span>)}
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600">Learn More <ChevronRight className="h-3.5 w-3.5" /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
