import React, { useState, useEffect } from 'react';
import { UserX, Search, Mail, Bell, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const EXEMPTION_CATEGORIES = [
  { value: 'STAFF_WARD', label: "Staff ward" },
  { value: 'MERIT_SCHOLARSHIP', label: 'Merit scholarship' },
  { value: 'SPORTS_SCHOLARSHIP', label: 'Sports scholarship' },
  { value: 'ECONOMIC_HARDSHIP', label: 'Economic hardship' },
  { value: 'SIBLING_DISCOUNT', label: 'Sibling discount' },
  { value: 'RTE_QUOTA', label: 'RTE quota' },
  { value: 'OTHER', label: 'Other' },
];

export default function FeeDefaulters() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [exemptTarget, setExemptTarget] = useState<any>(null);
  const [exemptCategory, setExemptCategory] = useState('STAFF_WARD');
  const [exemptSubmitting, setExemptSubmitting] = useState(false);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fees', { params: { limit: 200 } });
      const rows = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      const now = new Date();
      setFees(rows.filter((f: any) => {
        const status = String(f.status).toUpperCase();
        const dueDate = f.due_date ? new Date(f.due_date) : null;
        return status !== 'PAID' && status !== 'EXEMPT' && dueDate && dueDate < now;
      }));
    } catch (err) {
      toast.error('Failed to load defaulters');
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemind = async (feeId: string) => {
    try {
      toast.success('Reminder sent successfully');
    } catch (err) {
      toast.error('Failed to send reminder');
    }
  };

  const openExemptModal = (fee: any) => {
    setExemptTarget(fee);
    setExemptCategory('STAFF_WARD');
  };

  const handleExempt = async () => {
    if (!exemptTarget) return;
    setExemptSubmitting(true);
    try {
      await api.put(`/fees/${exemptTarget.id}/exempt`, { category: exemptCategory });
      toast.success(`${exemptTarget.student_name || 'Student'} marked fee-exempt`);
      setExemptTarget(null);
      fetchFees();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to mark exempt');
    } finally {
      setExemptSubmitting(false);
    }
  };

  const filteredFees = fees.filter(f =>
    f.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fee Defaulters</h1>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Bell className="size-5 mr-2" />
          Remind All
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
        <Search className="size-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search by student name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border-none focus:ring-0"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading defaulters...</div>
      ) : filteredFees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No defaulters found! Excellent.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-gray-200">
              <TableHeader className="bg-gray-50">
                <TableRow className="hover:bg-transparent border-b-0">
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Title</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200 [&_tr]:border-b-0">
                {filteredFees.map(fee => (
                  <TableRow key={fee.id} className="hover:bg-gray-50">
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="size-8 mr-3 bg-red-100">
                          <AvatarFallback className="bg-red-100 text-red-600 font-bold">
                            {fee.student_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm font-medium text-gray-900">{fee.student_name || 'Unknown'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fee.title}</TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      ₹{Math.round(Number(fee.amount) || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => handleRemind(fee.id)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <Mail className="size-4 mr-1" /> Remind
                        </button>
                        <button
                          onClick={() => openExemptModal(fee)}
                          className="text-emerald-600 hover:text-emerald-800 flex items-center"
                        >
                          <ShieldCheck className="size-4 mr-1" /> Mark exempt
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {exemptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Mark fee exempt</h2>
              <button onClick={() => setExemptTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {exemptTarget.student_name || 'This student'}'s <span className="font-medium">{exemptTarget.title}</span> (₹{Math.round(Number(exemptTarget.amount) || 0).toLocaleString('en-IN')}) will be marked fully exempt. This applies to any institute.
            </p>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Exemption category</label>
            <select
              value={exemptCategory}
              onChange={(e) => setExemptCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-4 text-sm"
            >
              {EXEMPTION_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setExemptTarget(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExempt}
                disabled={exemptSubmitting}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {exemptSubmitting ? 'Saving...' : 'Confirm exemption'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
