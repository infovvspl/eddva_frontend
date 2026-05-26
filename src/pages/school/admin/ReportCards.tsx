import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';

export default function ReportCards() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students');
      if (Array.isArray(res.data)) setStudents(res.data);
      else if (res.data?.data) setStudents(res.data.data);
      else setStudents([]);
    } catch (err) {
      toast.error('Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (studentId: string) => {
    try {
      toast.success('Generating report card...');
      // In a real app, this might call a PDF generation endpoint
      // await api.get(`/assessments/progress/report/student/${studentId}`);
    } catch (err) {
      toast.error('Failed to generate report card');
    }
  };

  const filteredStudents = students.filter(s => 
    s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Printer className="w-5 h-5 mr-2" />
          Bulk Print
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search by student name or roll number..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border-none focus:ring-0"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading students...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No students found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(student => (
            <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg mr-4">
                  {student.user?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{student.user?.name || 'Unknown Student'}</h3>
                  <p className="text-sm text-gray-500">{student.enrollmentNumber || 'No ID'}</p>
                </div>
              </div>
              <div className="mt-auto flex justify-end space-x-2 border-t pt-4">
                <button
                  onClick={() => handleGenerate(student.id)}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => handleGenerate(student.id)}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
