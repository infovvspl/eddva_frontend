import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Users, GraduationCap, Calendar, Mail, Globe,
  Shield, CreditCard, BookOpen, Ban, ArrowUpCircle,
  Swords, ChevronLeft, Loader2, AlertCircle, Video, ClipboardList,
  Activity, DollarSign, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant, useTenantStats, useSuspendTenant, useActivateTenant } from "@/hooks/use-tenants";

const InstituteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: detailData, isLoading, error } = useTenant(id || "");
  const { data: statsData } = useTenantStats(id || "");
  const suspendMutation = useSuspendTenant();
  const activateMutation = useActivateTenant();

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "stats", label: "Deep Stats" },
    { id: "billing", label: "Billing" },
    { id: "activity", label: "Logs" },
  ];

  const statusStyles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.05)]",
    trial: "bg-amber-50 text-amber-600 border-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.05)]",
    suspended: "bg-rose-50 text-rose-600 border-rose-100 shadow-[0_0_12px_rgba(225,29,72,0.05)]",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Handle both nested { tenant, studentCount, ... } and flat response
  const detail = detailData as any;
  const tenant = detail?.tenant || detail;
  const stats = statsData as any;

  if (error || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">Failed to load institute details.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const status = (tenant.status || "active") as string;
  const studentCount = detail?.studentCount ?? tenant.studentCount ?? 0;
  const teacherCount = detail?.teacherCount ?? tenant.teacherCount ?? 0;
  const batchCount = detail?.batchCount ?? 0;
  const lectureCount = detail?.lectureCount ?? 0;
  const testSessionCount = detail?.testSessionCount ?? 0;
  const monthlyActiveStudents = detail?.monthlyActiveStudents ?? 0;
  const totalRevenue = detail?.totalRevenue ?? 0;
  const studentLimit = tenant.maxStudents ?? 500;
  const teacherLimit = tenant.maxTeachers ?? 50;

  const statsCards = [
    { label: "Students", value: studentCount.toLocaleString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Teachers", value: teacherCount.toLocaleString(), icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Batches", value: batchCount.toLocaleString(), icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Lectures", value: lectureCount.toLocaleString(), icon: Video, color: "text-slate-900", bg: "bg-slate-100" },
  ];

  const handleSuspendToggle = async () => {
    if (!id) return;
    if (status === "suspended") {
      await activateMutation.mutateAsync(id);
    } else {
      await suspendMutation.mutateAsync(id);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-10 font-sans text-slate-900">
      <header className="max-w-7xl mx-auto mb-7 md:mb-10 border-b border-slate-100 pb-6 md:pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-[11px] font-black uppercase tracking-[0.2em] mb-5">
          <ChevronLeft className="w-4 h-4" /> Return to Directory
        </button>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-18 md:h-18 rounded-[20px] bg-slate-100 flex items-center justify-center text-2xl md:text-[28px] font-black text-slate-400 border border-slate-50 shadow-sm shrink-0">
              {(tenant.name || "?")[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h1 className="text-[24px] md:text-[32px] lg:text-[38px] font-black text-slate-900 tracking-tight leading-tight">{tenant.name}</h1>
                <div className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 uppercase tracking-[0.15em] ${statusStyles[status] || statusStyles.active}`}>
                   <div className="w-1.5 h-1.5 rounded-full bg-current" />
                   {status === 'active' ? 'Operational' : status === 'trial' ? 'Trial Hub' : 'Suspended'}
                </div>
              </div>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-tight flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-indigo-500" /> {tenant.subdomain}<span className="opacity-40">.edva.in</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-10 md:h-12 px-5 md:px-8 rounded-[20px] border-2 border-slate-100 font-black text-slate-600 hover:bg-slate-50 transition-all text-sm">
              <ArrowUpCircle className="w-4 h-4 mr-2" /> Upgrade Quota
            </Button>
            <Button
              onClick={handleSuspendToggle}
              disabled={suspendMutation.isPending || activateMutation.isPending}
              className={`h-10 md:h-12 px-5 md:px-8 rounded-[20px] font-black shadow-2xl transition-all text-sm ${
                status === "suspended"
                  ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                  : "bg-white text-gray-900 hover:bg-gray-100 shadow-slate-900/20"
              }`}
            >
              {status === "suspended" ? <Shield className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
              {status === "suspended" ? "Reinstate Hub" : "Revoke Access"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-5">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statsCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-5 md:p-7 rounded-[24px] md:rounded-[36px] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-[16px] ${s.bg} ${s.color} transition-transform group-hover:scale-110`}><s.icon className="w-5 h-5" /></div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{s.label}</p>
              <h3 className="text-xl md:text-[28px] font-black text-slate-900 mt-1 leading-none">{s.value}</h3>
              <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-50/30 opacity-0 group-hover:opacity-100 blur-[40px] transition-opacity translate-x-12 -translate-y-12" />
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-slate-50 p-1.5 rounded-[24px] border border-slate-100 inline-flex gap-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-8 py-3.5 rounded-[18px] text-[13px] font-black uppercase tracking-tight transition-all ${activeTab === tab.id ? "bg-white text-gray-900 shadow-xl shadow-slate-900/10" : "text-slate-400 hover:text-slate-900"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-7">
                <div className="lg:col-span-2 bg-white rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm p-5 md:p-8">
                  <h3 className="text-base md:text-lg font-black text-slate-900 mb-7 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" /> Administrative Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                    {[
                      { icon: Mail, label: "Master Billing", value: tenant.billingEmail || "—" },
                      { icon: Shield, label: "Governance Contact", value: detail?.adminPhone || "—" },
                      { icon: CreditCard, label: "Platform Tier", value: `${(tenant.plan || "").charAt(0).toUpperCase() + (tenant.plan || "").slice(1).toLowerCase()} Tier` },
                      { icon: Calendar, label: "Deployment Date", value: tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : "—" },
                      { icon: Globe, label: "Access Hub", value: `${tenant.subdomain}.edva.in` },
                      { icon: Calendar, label: "Compliance Deadline", value: tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : "—" },
                    ].map((item) => (
                      <div key={item.label} className="group">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{item.label}</p>
                        <div className="flex items-center gap-4">
                          <item.icon className="w-5 h-5 text-gray-800 group-hover:text-indigo-600 transition-colors" />
                          <span className="text-[16px] font-black text-slate-800">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-[28px] md:rounded-[44px] p-5 md:p-8 text-gray-900 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
                  <h3 className="text-base md:text-lg font-black mb-7 relative z-10">Quota Intelligence</h3>
                  <div className="space-y-7 relative z-10">
                    <UsageProgress label="Active Learner Hub" current={studentCount} total={studentLimit} color="bg-indigo-500" inverse />
                    <UsageProgress label="Faculty Hub Slots" current={teacherCount} total={teacherLimit} color="bg-purple-500" inverse />
                  </div>
                  <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500 opacity-10 blur-[60px] translate-x-12 -translate-y-12" />
                </div>
              </div>
            )}

            {activeTab === "stats" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: "Test Sessions", value: (stats?.testSessionCount ?? testSessionCount).toLocaleString(), icon: ClipboardList, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                  { label: "Monthly Active Students", value: (stats?.monthlyActiveStudents ?? monthlyActiveStudents).toLocaleString(), icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                  { label: "Total Revenue", value: `₹${((stats?.totalRevenue ?? totalRevenue) / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
                  { label: "Lectures", value: (stats?.lectureCount ?? lectureCount).toLocaleString(), icon: Video, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
                  { label: "Batches", value: (stats?.batchCount ?? batchCount).toLocaleString(), icon: BookOpen, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10" },
                  { label: "Teachers", value: (stats?.teacherCount ?? teacherCount).toLocaleString(), icon: GraduationCap, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-card p-6 rounded-[32px] border border-border shadow-sm">
                    <div className={`p-3 rounded-2xl ${s.bg} ${s.color} w-fit mb-4`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                    <h3 className="text-2xl font-black text-foreground mt-1">{s.value}</h3>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === "billing" && (
              <div className="bg-card rounded-[32px] border border-border shadow-sm p-8">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" /> Billing Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-secondary/50 rounded-2xl p-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Plan</p>
                    <p className="text-xl font-black text-foreground capitalize">{tenant.plan}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-2xl p-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Revenue</p>
                    <p className="text-xl font-black text-foreground">₹{totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-2xl p-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Trial Ends</p>
                    <p className="text-xl font-black text-foreground">{tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString("en-IN") : "—"}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="bg-card rounded-[32px] border border-border shadow-sm p-8 text-center text-muted-foreground">
                Activity logs will be displayed here once the audit log API is connected.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const UsageProgress = ({ label, current, total, color, inverse = false }: { label: string; current: number; total: number; color: string; inverse?: boolean }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-end mb-3">
        <p className={`text-[11px] font-black uppercase tracking-widest ${inverse ? 'text-white/40' : 'text-slate-400'}`}>{label}</p>
        <p className={`text-[12px] font-black ${inverse ? 'text-white' : 'text-slate-900'}`}>{current.toLocaleString()} <span className={inverse ? 'text-white/30' : 'text-gray-600'}>/ {total.toLocaleString()}</span></p>
      </div>
      <div className={`h-2.5 rounded-full overflow-hidden ${inverse ? 'bg-white/5' : 'bg-slate-100'}`}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${color} shadow-[0_0_12px_rgba(0,0,0,0.1)]`} />
      </div>
    </div>
  );
};

export default InstituteDetailPage;
