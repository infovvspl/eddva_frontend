import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Users, GraduationCap, Calendar, Mail, Globe, 
  Shield, CreditCard, BarChart3, Ban, ArrowUpCircle, Trash2,
  TrendingUp, BookOpen, Swords, ChevronLeft, Zap, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

const InstituteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Your original data structures
  const inst = {
    id: "1", name: "Elite IIT Academy", subdomain: "elite-iit", plan: "Scale",
    status: "active" as const, billingEmail: "admin@eliteiit.com", adminPhone: "+91 98765 43210",
    students: 1284, studentLimit: 2000, teachers: 24, teacherLimit: 50,
    batches: 12, activeBatches: 8, joinedAt: "2024-12-15",
    trialEndsAt: null, lastPayment: "2025-02-28", nextPayment: "2025-03-28",
    monthlyRevenue: 19999,
  };

  const stats = [
    { label: "Students", value: "1,284", trend: 12, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Teachers", value: 24, trend: 4, icon: GraduationCap, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Active Batches", value: 8, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Battles Played", value: "4.2K", trend: 22, icon: Swords, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  const teachers = [
    { name: "Dr. Rajesh Kumar", subject: "Physics", students: 342, rating: 4.8 },
    { name: "Ms. Sneha Patel", subject: "Chemistry", students: 289, rating: 4.6 },
    { name: "Mr. Arjun Singh", subject: "Mathematics", students: 378, rating: 4.9 },
    { name: "Dr. Meera Iyer", subject: "Biology", students: 275, rating: 4.7 },
  ];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "teachers", label: "Faculty" },
    { id: "billing", label: "Billing" },
    { id: "activity", label: "Logs" },
  ];

  const statusStyles = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-100",
    trial: "bg-amber-50 text-amber-600 border-amber-100",
    suspended: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-800">
      {/* Enhanced Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Institutes
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-[24px] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-2xl font-black text-indigo-600">
              {inst.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{inst.name}</h1>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusStyles[inst.status]}`}>
                  {inst.status}
                </span>
              </div>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" /> {inst.subdomain}.apexiq.in
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-2xl border-slate-200 hover:bg-white hover:border-indigo-200 transition-all h-11 px-6 font-bold text-slate-600">
              <ArrowUpCircle className="w-4 h-4 mr-2" /> Upgrade Plan
            </Button>
            <Button className="rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 h-11 px-6 font-bold shadow-none transition-all">
              <Ban className="w-4 h-4 mr-2" /> Suspend
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div 
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                {s.trend && (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    +{s.trend}%
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{s.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Custom Tab Switcher */}
        <div className="bg-white p-1.5 rounded-[20px] border border-slate-100 shadow-sm inline-flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-[14px] text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Card */}
                <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" /> Institute Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {[
                      { icon: Mail, label: "Billing Email", value: inst.billingEmail },
                      { icon: Shield, label: "Admin Contact", value: inst.adminPhone },
                      { icon: CreditCard, label: "Subscription", value: `${inst.plan} Plan` },
                      { icon: Calendar, label: "Joined Platform", value: inst.joinedAt },
                    ].map((item) => (
                      <div key={item.label} className="group">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                          <span className="text-sm font-semibold text-slate-700">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Usage Card */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Quota Usage</h3>
                  <div className="space-y-6">
                    <UsageProgress label="Student Seats" current={inst.students} total={inst.studentLimit} color="bg-indigo-600" />
                    <UsageProgress label="Faculty Slots" current={inst.teachers} total={inst.teacherLimit} color="bg-sky-500" />
                    <UsageProgress label="Active Batches" current={inst.activeBatches} total={inst.batches} color="bg-emerald-500" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "teachers" && (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Faculty Member</th>
                      <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                      <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Students</th>
                      <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teachers.map((t) => (
                      <tr key={t.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                              {t.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-500">{t.subject}</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-700">{t.students}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-sm bg-amber-50 w-fit px-2.5 py-1 rounded-lg border border-amber-100">
                            <Star className="w-3.5 h-3.5 fill-current" /> {t.rating}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* ... Other tabs follow similar Bento logic ... */}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

// Sub-component for clean progress bars
const UsageProgress = ({ label, current, total, color }: any) => {
  const percentage = (current / total) * 100;
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className="text-[10px] font-black text-slate-900">{current} / {total}</p>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`} 
        />
      </div>
    </div>
  );
};

export default InstituteDetailPage;