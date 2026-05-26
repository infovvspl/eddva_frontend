import React, { useState, useEffect } from 'react';
import { TrendingUp, Search } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function StudentPerformance() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessments/sessions');
      if (Array.isArray(res.data)) setSessions(res.data);
      else if (res.data?.data) setSessions(res.data.data);
      else setSessions([]);
    } catch (err) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const completedSessions = sessions.filter(s => s.status === 'submitted' || s.status === 'auto_submitted');
  const filteredSessions = completedSessions.filter(s => 
    s.student?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.mockTest?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Student Performance Analytics</h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search by student or exam..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border-none focus:ring-0"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading analytics...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No performance data found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSessions.map(session => (
            <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">
                  {session.student?.user?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{session.student?.user?.name || 'Unknown Student'}</h3>
                  <p className="text-sm text-gray-500">{session.mockTest?.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase">Score</p>
                  <p className="text-xl font-bold text-gray-900">{session.totalScore}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase">Accuracy</p>
                  <p className="text-xl font-bold text-gray-900">{session.accuracy ? `${(session.accuracy * 100).toFixed(1)}%` : 'N/A'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase">Correct</p>
                  <p className="text-xl font-bold text-green-600">{session.correctCount}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase">Incorrect</p>
                  <p className="text-xl font-bold text-red-600">{session.wrongCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
