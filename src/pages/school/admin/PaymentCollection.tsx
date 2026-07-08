import React, { useState, useEffect } from 'react';
import { CreditCard, Search, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/Modal';
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function PaymentCollection() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/fees');
      if (Array.isArray(res.data)) {
        setFees(res.data.filter(f => f.status !== 'paid'));
      } else if (res.data?.data) {
        setFees(res.data.data.filter((f: any) => f.status !== 'paid'));
      } else {
        setFees([]);
      }
    } catch (err) {
      toast.error('Failed to load pending fees');
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/finance/fees/${selectedFee.id}/pay`, {
        amount: Number(amount),
        paymentMethod,
        referenceNumber
      });
      toast.success('Payment recorded successfully');
      setIsModalOpen(false);
      fetchFees();
    } catch (err) {
      toast.error('Failed to record payment');
    }
  };

  const openPaymentModal = (fee: any) => {
    setSelectedFee(fee);
    setAmount((fee.amount - fee.amountPaid).toString());
    setPaymentMethod('CASH');
    setReferenceNumber('');
    setIsModalOpen(true);
  };

  const filteredFees = fees.filter(f => 
    f.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.student?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payment Collection</h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search pending fees by student or title..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border-none focus:ring-0"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading pending fees...</div>
      ) : filteredFees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No pending fees to collect.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFees.map(fee => (
            <div key={fee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-sm ring-1 ring-slate-100 transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 mr-4">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{fee.student?.user?.name || 'Unknown Student'}</h3>
                  <p className="text-sm text-gray-500">{fee.title}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="font-medium">${fee.amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid:</span>
                  <span className="font-medium text-green-600">${fee.amountPaid}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Due:</span>
                  <span className="font-medium text-red-600">${fee.amount - fee.amountPaid}</span>
                </div>
              </div>

              <button
                onClick={() => openPaymentModal(fee)}
                className="mt-auto w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex justify-center items-center font-medium"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Collect Payment
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Collect Payment">
        <form onSubmit={handlePay} className="space-y-4">
          {selectedFee && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 mb-4">
              Collecting for <strong>{selectedFee.title}</strong> - {selectedFee.student?.user?.name}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay</label>
            <input
              type="number"
              required
              max={selectedFee ? selectedFee.amount - selectedFee.amountPaid : 0}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <CustomSelect
          onChange={setPaymentMethod}
              value={paymentMethod}
              options={[
              { value: "CASH", label: "Cash" },
              { value: "BANK_TRANSFER", label: "Bank Transfer" },
              { value: "CREDIT_CARD", label: "Credit Card" },
              { value: "UPI", label: "UPI" },
            ]}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference No. (Optional)</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. TXN12345"
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
