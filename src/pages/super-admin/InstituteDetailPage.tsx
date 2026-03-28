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
    active: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    trial: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    suspended: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
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
    { label: "Students", value: studentCount.toLocaleString(), icon: Users, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
    { label: "Teachers", value: teacherCount.toLocaleString(), icon: GraduationCap, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10" },
    { label: "Batches", value: batchCount.toLocaleString(), icon: BookOpen, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Lectures", value: lectureCount.toLocaleString(), icon: Video, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
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
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-foreground">
      <header className="max-w-7xl mx-auto mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to Institutes
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-[24px] bg-card border border-border shadow-sm flex items-center justify-center text-2xl font-black text-primary">
              {(tenant.name || "?")[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-foreground tracking-tight">{tenant.name}</h1>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusStyles[status] || statusStyles.active}`}>
                  {status}
                </span>
              </div>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" /> {tenant.subdomain}.edva.in
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-2xl border-border hover:bg-card hover:border-primary/30 transition-all h-11 px-6 font-bold text-foreground">
              <ArrowUpCircle className="w-4 h-4 mr-2" /> Upgrade Plan
            </Button>
            <Button
              onClick={handleSuspendToggle}
              disabled={suspendMutation.isPending || activateMutation.isPending}
              className={`rounded-2xl h-11 px-6 font-bold shadow-none transition-all ${
                status === "suspended"
                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400"
              }`}
            >
              <Ban className="w-4 h-4 mr-2" /> {status === "suspended" ? "Activate" : "Suspend"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card p-6 rounded-[32px] border border-border shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}><s.icon className="w-5 h-5" /></div>
              </div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{s.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-card p-1.5 rounded-[20px] border border-border shadow-sm inline-flex gap-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-2.5 rounded-[14px] text-sm font-bold transition-all ${activeTab === tab.id ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card rounded-[32px] border border-border shadow-sm p-8">
                  <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" /> Institute Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {[
                      { icon: Mail, label: "Billing Email", value: tenant.billingEmail || "—" },
                      { icon: Shield, label: "Admin Contact", value: detail?.adminPhone || "—" },
                      { icon: CreditCard, label: "Subscription", value: `${(tenant.plan || "").charAt(0).toUpperCase() + (tenant.plan || "").slice(1).toLowerCase()} Plan` },
                      { icon: Calendar, label: "Joined Platform", value: tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString("en-IN") : "—" },
                      { icon: Globe, label: "Subdomain", value: `${tenant.subdomain}.edva.in` },
                      { icon: Calendar, label: "Trial Ends", value: tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString("en-IN") : "—" },
                    ].map((item) => (
                      <div key={item.label} className="group">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-semibold text-foreground">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-[32px] border border-border shadow-sm p-8">
                  <h3 className="text-lg font-bold text-foreground mb-6">Quota Usage</h3>
                  <div className="space-y-6">
                    <UsageProgress label="Student Seats" current={studentCount} total={studentLimit} color="bg-primary" />
                    <UsageProgress label="Faculty Slots" current={teacherCount} total={teacherLimit} color="bg-sky-500" />
                  </div>
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

const UsageProgress = ({ label, current, total, color }: { label: string; current: number; total: number; color: string }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <p className="text-xs font-bold text-muted-foreground">{label}</p>
        <p className="text-[10px] font-black text-foreground">{current} / {total}</p>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${color}`} />
      </div>
    </div>
  );
};

export default InstituteDetailPage;
