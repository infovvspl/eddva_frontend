import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function MarksEntry() {
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
      toast.error('Failed to load test sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.student?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.mockTest?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
        <Search className="size-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search by student or exam..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border-none focus:ring-0"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading sessions...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No sessions found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-gray-200">
              <TableHeader className="bg-gray-50">
                <TableRow className="hover:bg-transparent border-b-0">
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-20 bg-gray-50 dark:bg-slate-850 shadow-sm">Student</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Score</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200 [&_tr]:border-b-0">
                {filteredSessions.map(session => (
                  <TableRow key={session.id} className="hover:bg-gray-50">
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap sticky left-0 z-20 bg-white dark:bg-slate-900">
                      <div className="text-sm font-medium text-gray-900">{session.student?.user?.name || 'Unknown Student'}</div>
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.mockTest?.title || 'Unknown Exam'}</div>
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap">
                      <Badge className={`rounded-full border-transparent text-xs font-semibold ${
                        session.status === 'submitted' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                      }`}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.totalScore !== null ? session.totalScore : 'N/A'}
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit2 className="size-4 inline" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
