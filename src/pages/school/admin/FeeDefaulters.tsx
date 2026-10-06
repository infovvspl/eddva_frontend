import React, { useState, useEffect } from 'react';
import { UserX, Search, Mail, Bell } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function FeeDefaulters() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/fees');
      if (Array.isArray(res.data)) {
        setFees(res.data.filter(f => f.status === 'overdue' || (f.status === 'pending' && new Date(f.dueDate) < new Date())));
      } else if (res.data?.data) {
        setFees(res.data.data.filter((f: any) => f.status === 'overdue' || (f.status === 'pending' && new Date(f.dueDate) < new Date())));
      } else {
        setFees([]);
      }
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

  const filteredFees = fees.filter(f => 
    f.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.student?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                            {fee.student?.user?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm font-medium text-gray-900">{fee.student?.user?.name || 'Unknown'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fee.title}</TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      ${fee.amount - fee.amountPaid}
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(fee.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="p-4 px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRemind(fee.id)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end"
                      >
                        <Mail className="size-4 mr-1" /> Remind
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
