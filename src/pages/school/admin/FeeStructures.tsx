import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/Modal';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function FeeStructures() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [studentId, setStudentId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/fees');
      if (Array.isArray(res.data)) setFees(res.data);
      else if (res.data?.data) setFees(res.data.data);
      else setFees([]);
    } catch (err) {
      toast.error('Failed to load fee structures');
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/fees', {
        title,
        amount: Number(amount),
        studentId,
        dueDate: new Date(dueDate).toISOString()
      });
      toast.success('Fee assigned successfully');
      setIsModalOpen(false);
      fetchFees();
    } catch (err) {
      toast.error('Failed to assign fee');
    }
  };

  const filteredFees = fees.filter(f => 
    f.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.student?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fee Assignments</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="size-5 mr-2" />
          Assign Fee
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
        <Search className="size-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search by title or student name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border-none focus:ring-0"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading fees...</div>
      ) : filteredFees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No fees found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-gray-200">
              <TableHeader className="bg-gray-50">
                <TableRow className="hover:bg-transparent border-b-0">
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-20 bg-gray-50 dark:bg-slate-850 shadow-sm">Title</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="h-auto px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200 [&_tr]:border-b-0">
                {filteredFees.map(fee => (
                  <TableRow key={fee.id} className="hover:bg-gray-50">
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 z-20 bg-white dark:bg-slate-900">{fee.title}</TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fee.student?.user?.name || 'Unknown'}</TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-sm text-gray-900">${fee.amount}</TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-sm text-gray-900">${fee.amountPaid}</TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap">
                      <Badge className={`px-2 py-1 rounded-full border-transparent text-xs leading-5 font-semibold ${
                        fee.status === 'paid' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                        fee.status === 'partial' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                        fee.status === 'overdue' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                        'bg-gray-100 text-gray-800 hover:bg-gray-100'
                      }`}>
                        {fee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(fee.dueDate).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Fee">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fee Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g. Tuition Fee Q1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID (UUID)</label>
            <input
              type="text"
              required
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="00000000-0000-0000-0000-000000000000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 mr-3">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Assign</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
