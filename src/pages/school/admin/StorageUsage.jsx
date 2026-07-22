import React, { useEffect, useState } from 'react';
import { HardDrive, FileText, Presentation, Video, RefreshCw, Building2 } from 'lucide-react';
import api from '@/lib/api/school-client';

function fmtStorage(kb) {
  if (kb >= 1024 * 1024) return (kb / 1024 / 1024).toFixed(2) + ' GB';
  if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB';
  return kb + ' KB';
}

function StorageBar({ pptKb, docKb, videoKb, totalKb }) {
  if (!totalKb) return <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800" />;
  const pctDoc = (docKb / totalKb) * 100;
  const pctPpt = (pptKb / totalKb) * 100;
  const pctVid = (videoKb / totalKb) * 100;
  return (
    <div className="h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800">
      <div style={{ width: `${pctDoc}%` }} className="bg-blue-500" title={`Documents: ${fmtStorage(docKb)}`} />
      <div style={{ width: `${pctPpt}%` }} className="bg-purple-500" title={`PPTs: ${fmtStorage(pptKb)}`} />
      <div style={{ width: `${pctVid}%` }} className="bg-orange-500" title={`Videos: ${fmtStorage(videoKb)}`} />
    </div>
  );
}

export default function StorageUsage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/institutes/storage-usage');
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load storage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const maxKb = data?.institutes?.[0]?.totalKb || 1;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Storage Usage</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Files, documents, PPTs and videos across all schools</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            icon={<HardDrive size={18} className="text-indigo-500" />}
            label="Total Storage"
            value={fmtStorage(data.platformTotalKb)}
            bg="bg-indigo-50 dark:bg-indigo-900/20"
          />
          <SummaryCard
            icon={<Building2 size={18} className="text-emerald-500" />}
            label="Schools"
            value={data.institutes.length}
            bg="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <SummaryCard
            icon={<FileText size={18} className="text-blue-500" />}
            label="Total Files"
            value={data.institutes.reduce((a, i) => a + i.fileCount, 0).toLocaleString()}
            bg="bg-blue-50 dark:bg-blue-900/20"
          />
          <SummaryCard
            icon={<Video size={18} className="text-orange-500" />}
            label="Largest School"
            value={data.institutes[0] ? fmtStorage(data.institutes[0].totalKb) : '—'}
            bg="bg-orange-50 dark:bg-orange-900/20"
          />
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />Documents / PDFs</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" />Presentations (PPT)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" />Videos</span>
      </div>

      {/* Table */}
      {loading && !data ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : data?.institutes?.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <HardDrive size={40} className="mx-auto mb-3 opacity-30" />
          <p>No storage data yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Desktop table */}
          <table className="hidden sm:table w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">School</th>
                <th className="px-4 py-3 text-right">Storage</th>
                <th className="px-4 py-3 text-right">Files</th>
                <th className="px-4 py-3 text-right">
                  <FileText size={12} className="inline mr-1 text-blue-500" />Docs
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="inline-block w-2 h-2 rounded-sm bg-purple-500 mr-1" />PPTs
                </th>
                <th className="px-4 py-3 text-right">
                  <Video size={12} className="inline mr-1 text-orange-500" />Videos
                </th>
                <th className="px-4 py-3 text-left w-40">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {data?.institutes?.map((inst) => (
                <tr key={inst.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{inst.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{inst.status?.toLowerCase()}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                    {fmtStorage(inst.totalKb)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{inst.fileCount}</td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                    {inst.breakdown.documents.count}
                    <span className="text-xs text-gray-400 ml-1">({fmtStorage(inst.breakdown.documents.storageKb)})</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                    {inst.breakdown.presentations.count}
                    <span className="text-xs text-gray-400 ml-1">({fmtStorage(inst.breakdown.presentations.storageKb)})</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                    {inst.breakdown.videos.count}
                    <span className="text-xs text-gray-400 ml-1">({fmtStorage(inst.breakdown.videos.storageKb)})</span>
                  </td>
                  <td className="px-4 py-3 w-40">
                    <div className="mb-1">
                      <StorageBar
                        pptKb={inst.breakdown.presentations.storageKb}
                        docKb={inst.breakdown.documents.storageKb}
                        videoKb={inst.breakdown.videos.storageKb}
                        totalKb={inst.totalKb}
                      />
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      {maxKb ? Math.round((inst.totalKb / maxKb) * 100) : 0}% of largest
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
            {data?.institutes?.map((inst) => (
              <div key={inst.id} className="p-4 bg-white dark:bg-gray-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{inst.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{inst.status?.toLowerCase()}</p>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{fmtStorage(inst.totalKb)}</span>
                </div>
                <StorageBar
                  pptKb={inst.breakdown.presentations.storageKb}
                  docKb={inst.breakdown.documents.storageKb}
                  videoKb={inst.breakdown.videos.storageKb}
                  totalKb={inst.totalKb}
                />
                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="text-blue-500">{inst.breakdown.documents.count} docs</span>
                  <span className="text-purple-500">{inst.breakdown.presentations.count} PPTs</span>
                  <span className="text-orange-500">{inst.breakdown.videos.count} videos</span>
                  <span className="ml-auto">{inst.fileCount} total files</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, bg }) {
  return (
    <div className={`rounded-xl p-4 ${bg} border border-transparent`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500 dark:text-gray-400">{label}</span></div>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
