import React, { useState } from 'react';
import { FileSpreadsheet, Download, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomReports() {
  const [reportType, setReportType] = useState('ACADEMIC');
  const [dateRange, setDateRange] = useState('LAST_30_DAYS');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Generating custom report...');
    setTimeout(() => {
      toast.success('Report downloaded successfully');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Custom Reports</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-indigo-600" />
          Report Builder
        </h2>

        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Data Type</label>
            <div className="grid grid-cols-2 gap-4">
              {['ACADEMIC', 'FINANCIAL', 'ATTENDANCE', 'BEHAVIORAL'].map((type) => (
                <div
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                    reportType === type 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <p className="font-medium text-sm">{type.charAt(0) + type.slice(1).toLowerCase()} Report</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="THIS_TERM">This Term</option>
              <option value="THIS_ACADEMIC_YEAR">This Academic Year</option>
            </select>
          </div>

          <div className="pt-4 border-t">
            <button
              type="submit"
              className="w-full flex justify-center items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
            >
              <Download className="w-5 h-5 mr-2" />
              Generate & Download Excel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
