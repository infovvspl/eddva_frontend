import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";

const AttendanceReportsPage = () => {
  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-7 md:mb-10 border-b border-slate-100 pb-6 md:pb-8">
          <h2 className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Super Admin</h2>
          <h1 className="text-[26px] md:text-[34px] lg:text-[40px] font-bold text-slate-900 tracking-tight leading-tight">Attendance Reports</h1>
          <p className="text-slate-400 text-sm md:text-[15px] mt-1 font-semibold">System-wide attendance analytics.</p>
        </header>

        <div className="flex h-[60vh] flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 text-center shadow-sm">
          <ClipboardList className="mb-4 h-16 w-16 text-slate-200" />
          <h3 className="text-xl font-bold text-slate-900">Coming Soon</h3>
          <p className="mt-2 font-medium text-slate-500">This feature is under development.</p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReportsPage;
