import React, { useState, useEffect } from 'react';
import { Award, Search, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';

export default function Results() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessments/sessions');
      if (Array.isArray(res.data)) setSessions(res.data);
      else if (res.data?.data) setSessions(res.data.data);
      else setSessions([]);
    } catch (err) {
      toast.error('Failed to load results');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const completedSessions = sessions.filter(s => s.status === 'submitted' || s.status === 'auto_submitted');
  const filteredResults = completedSessions.filter(s => 
    s.student?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.mockTest?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Download className="w-5 h-5 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search by student or exam name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border-none focus:ring-0"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading results...</div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No results found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map(session => (
            <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-sm ring-1 ring-slate-100 transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <Award className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  {new Date(session.submittedAt || session.startedAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{session.mockTest?.title || 'Unknown Exam'}</h3>
              <p className="text-sm text-gray-500 mb-4">{session.student?.user?.name || 'Unknown Student'}</p>
              <div className="flex justify-between items-center text-sm border-t pt-4">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wider">Score</span>
                  <span className="font-bold text-gray-900 text-lg">{session.totalScore !== null ? session.totalScore : 'N/A'}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-gray-500 text-xs uppercase tracking-wider">Accuracy</span>
                  <span className="font-bold text-gray-900 text-lg">{session.accuracy ? `${(session.accuracy * 100).toFixed(1)}%` : 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
