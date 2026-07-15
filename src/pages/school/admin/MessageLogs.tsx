import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';

export default function MessageLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // We are fetching notifications here to represent the communication history
      const res = await api.get('/notifications');
      if (Array.isArray(res.data)) setLogs(res.data);
      else if (res.data?.data) setLogs(res.data.data);
      else setLogs([]);
    } catch (err) {
      toast.error('Failed to load message logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Message Logs</h1>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Download className="w-5 h-5 mr-2" />
          Export Logs
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border-none focus:ring-0"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No message logs found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        IN-APP
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.userId || 'System Broadcast'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      Delivered
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden divide-y divide-gray-100 bg-white">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm truncate max-w-[70%]">{log.title}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 shrink-0">
                    IN-APP
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-1">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold">Recipient</span>
                    <span className="font-semibold truncate block mt-0.5">{log.userId || 'System Broadcast'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold">Status</span>
                    <span className="font-bold text-green-600 block mt-0.5">Delivered</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold">Date & Time</span>
                    <span className="font-semibold block mt-0.5">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
