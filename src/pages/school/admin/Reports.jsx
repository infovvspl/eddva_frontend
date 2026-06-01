import React, { useState, useEffect } from 'react';
import { BarChart3, Download, GraduationCap, Users, TrendingUp, CircleDollarSign, Shield } from 'lucide-react';
import Modal from '@/components/school/admin/Modal';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    // Check if a report was pre-selected from Dashboard navigation
    const preSelectedReport = localStorage.getItem('selectedReport');
    if (preSelectedReport) {
      setSelectedReport(preSelectedReport);
      localStorage.removeItem('selectedReport'); // Clean up after using
    }
  }, []);

  const reportCards = [
    { title: 'Student Attendance', description: 'View student presence trends and attendance totals.', icon: Users, accent: 'text-brand-600 bg-brand-50' },
    { title: 'Teacher Attendance', description: 'Track teacher presence and punctuality patterns.', icon: Users, accent: 'text-emerald-600 bg-emerald-50' },
    { title: 'Fees Collection', description: 'Analyze fee payments, pending dues, and collection trends.', icon: CircleDollarSign, accent: 'text-emerald-600 bg-emerald-50' },
    { title: 'Finance Overview', description: 'Comprehensive view of institute revenue and expenses.', icon: Shield, accent: 'text-blue-600 bg-blue-50' },
    { title: 'Payment Analytics', description: 'Detailed breakdown of payment methods and timings.', icon: TrendingUp, accent: 'text-violet-600 bg-violet-50' },
    { title: 'Student Performance', description: 'Monitor scores, participation, and assignment completion.', icon: GraduationCap, accent: 'text-sky-600 bg-sky-50' },
    { title: 'Exam Performance', description: 'Compare exam outcomes across score bands.', icon: BarChart3, accent: 'text-violet-600 bg-violet-50' },
  ];

  const reportDetails = {
    'Student Attendance': [
      { label: 'Present', value: '456', pct: 85 },
      { label: 'Absent', value: '56', pct: 10 },
      { label: 'Late', value: '32', pct: 6 },
      { label: 'Leave', value: '32', pct: 6 },
    ],
    'Teacher Attendance': [
      { label: 'Present', value: '98', pct: 98 },
      { label: 'Absent', value: '1', pct: 1 },
      { label: 'Late', value: '1', pct: 1 },
    ],
    'Teacher Performance': [
      { label: 'Classes Delivered', value: '128', pct: 92 },
      { label: 'On-time Delivery', value: '96%', pct: 96 },
      { label: 'Student Feedback', value: '4.8/5', pct: 96 },
      { label: 'Coverage', value: '89%', pct: 89 },
    ],
    'Student Performance': [
      { label: 'Average Score', value: '82%', pct: 82 },
      { label: 'Assignment Completion', value: '91%', pct: 91 },
      { label: 'Participation', value: '74%', pct: 74 },
      { label: 'Attendance', value: '88%', pct: 88 },
    ],
    'Exam Performance': [
      { label: 'Excellent (90-100)', value: '45', pct: 40 },
      { label: 'Good (75-89)', value: '45', pct: 40 },
      { label: 'Average (60-74)', value: '22', pct: 20 },
    ],
    'Fees Collection': [
      { label: 'Total Collected', value: '₹4,50,000', pct: 82 },
      { label: 'Pending Dues', value: '₹92,000', pct: 18 },
      { label: 'Collection Velocity', value: '+15%', pct: 100 },
      { label: 'Defaulters', value: '12', pct: 2 },
    ],
    'Finance Overview': [
      { label: 'Total Revenue', value: '₹18,20,000', pct: 100 },
      { label: 'Operating Costs', value: '₹12,40,000', pct: 68 },
      { label: 'Net Margin', value: '₹5,80,000', pct: 32 },
    ],
    'Payment Analytics': [
      { label: 'Online Payments', value: '78%', pct: 78 },
      { label: 'Cash/Offline', value: '22%', pct: 22 },
      { label: 'Avg Payment Time', value: '4 days', pct: 100 },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-surface-950">Reports & Analytics</h1>
        <p className="mt-2 text-sm text-surface-500">View attendance, teacher performance, student performance, and exam reports. Click a card to open the full report view.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((report) => (
          <div 
            key={report.title} 
            onClick={() => setSelectedReport(report.title)}
            className="rounded-lg border border-surface-200 bg-white p-6 shadow-sm hover:border-brand-300 hover:shadow-sm ring-1 ring-slate-100 transition-all cursor-pointer hover:scale-105"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${report.accent}`}>
              <report.icon className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-surface-950">{report.title}</h3>
            <p className="mt-1 text-sm text-surface-500">{report.description}</p>
            <p className="mt-3 text-xs font-semibold text-brand-600">Click to view →</p>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!selectedReport}
        title={selectedReport || ''}
        onClose={() => setSelectedReport(null)}
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {(reportDetails[selectedReport] || []).map((item) => (
                <div key={item.label} className="rounded-lg border border-surface-200 p-4">
                  <p className="text-sm font-semibold text-surface-600">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-surface-950">{item.value}</p>
                  <p className="mt-1 text-xs text-surface-500">{item.pct}% of total</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => alert('Report will be downloaded as PDF')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
