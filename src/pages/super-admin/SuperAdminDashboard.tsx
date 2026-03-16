import { motion } from "framer-motion";
import { Building2, Users, DollarSign, ArrowUpRight, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

// Color mapping to match your login page's accent colors
const statusStyles = {
  active: "bg-emerald-50 text-emerald-600 border-emerald-100",
  trial: "bg-amber-50 text-amber-600 border-amber-100",
  suspended: "bg-rose-50 text-rose-600 border-rose-100",
};

const SuperAdminDashboard = () => {
  // Your original data arrays
  const stats = [
    { label: "Total Institutes", value: 48, trend: 12, icon: Building2, color: "indigo" },
    { label: "Active Institutes", value: 42, trend: 5, icon: Building2, color: "emerald" },
    { label: "Total Students", value: "52.4K", trend: 18, icon: Users, color: "sky" },
    { label: "Platform MRR", value: "₹24.8L", trend: 22, icon: DollarSign, color: "amber" },
  ];

  const recentInstitutes = [
    { name: "Elite IIT Academy", subdomain: "elite-iit", plan: "Scale", students: 1284, status: "active" as const, joined: "Dec 2024" },
    { name: "MedPrep Institute", subdomain: "medprep", plan: "Growth", students: 856, status: "active" as const, joined: "Jan 2025" },
    { name: "Quantum Coaching", subdomain: "quantum", plan: "Starter", students: 234, status: "trial" as const, joined: "Feb 2025" },
    { name: "Apex Science Hub", subdomain: "apex-sci", plan: "Growth", students: 0, status: "suspended" as const, joined: "Nov 2024" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 font-sans"
    >
      {/* Header aligned with Login Page Style */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white fill-current" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Super Admin</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Platform Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Managing the APEXIQ ecosystem and institute growth.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-6 shadow-xl shadow-slate-200 transition-all font-bold">
          Add New Institute
        </Button>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
          >
             {/* Subtle decorative background circle */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-slate-50 rounded-full group-hover:scale-110 transition-transform" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-slate-50 text-slate-600`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  {s.trend}%
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{s.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="p-6 md:px-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-lg">Recent Institutes</h3>
          <button className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:gap-2 transition-all">
            VIEW ALL <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Institute</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Subdomain</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Students</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentInstitutes.map((inst) => (
                <tr key={inst.subdomain} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-bold text-slate-900 text-sm">{inst.name}</td>
                  <td className="px-8 py-5 text-slate-500 font-medium text-sm">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs">{inst.subdomain}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-slate-600 font-semibold text-sm">{inst.plan}</span>
                  </td>
                  <td className="px-8 py-5 text-slate-600 font-bold text-sm">
                    {inst.students.toLocaleString()}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusStyles[inst.status]}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-400 text-xs font-medium">{inst.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SuperAdminDashboard;