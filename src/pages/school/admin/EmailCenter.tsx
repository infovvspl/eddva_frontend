import React, { useState } from 'react';
import { Mail, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';

export default function EmailCenter() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientGroup, setRecipientGroup] = useState('ALL_STUDENTS');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Sending bulk email mock
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      // In reality we would hit an endpoint like: await api.post('/mail/broadcast', { subject, body, group: recipientGroup });
      toast.success('Emails queued for sending successfully');
      setSubject('');
      setBody('');
    } catch (err) {
      toast.error('Failed to send emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Email Center</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Mail className="w-5 h-5 mr-2 text-indigo-600" />
          Compose Broadcast Email
        </h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Group</label>
            <div className="flex items-center">
              <Users className="w-5 h-5 text-gray-400 mr-2" />
              <select
                value={recipientGroup}
                onChange={e => setRecipientGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL_STUDENTS">All Students</option>
                <option value="ALL_PARENTS">All Parents</option>
                <option value="ALL_TEACHERS">All Teachers</option>
                <option value="DEFAULTERS">Fee Defaulters</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Important Update regarding Upcoming Exams"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
            <textarea
              required
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={8}
              placeholder="Type your message here..."
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Broadcast
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
