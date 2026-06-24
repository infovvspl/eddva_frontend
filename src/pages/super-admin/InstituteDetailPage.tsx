import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Users, GraduationCap, Calendar, Mail, Globe,
  Shield, CreditCard, BookOpen, Ban, ArrowUpCircle,
  Swords, ChevronLeft, Loader2, AlertCircle, Video, ClipboardList,
  Activity, DollarSign, TrendingUp, Sparkles, Check, MapPin, Palette, LayoutDashboard, MonitorPlay
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant, useTenantStats, useSuspendTenant, useActivateTenant, useUpdateTenant } from "@/hooks/use-tenants";
import { toast } from "sonner";
import { useConfirm } from "@/context/ConfirmContext";

const AI_FEATURE_OPTIONS = [
  { key: "ai_study_assistant", label: "AI Study Assistant", desc: "AI tutor & interactive study sessions" },
  { key: "ai_study_plan", label: "AI Study Plan", desc: "Personalized AI study roadmaps" },
  { key: "ai_battle_arena", label: "Battle Arena", desc: "AI adaptive practice battles" },
  { key: "ai_analytics", label: "AI Analytics", desc: "Weak topic detection & insights" },
  { key: "ai_doubt_resolution", label: "AI Doubt Resolution", desc: "Instant AI answers to questions" },
  { key: "ai_content_generation", label: "AI Content Generation", desc: "Auto-generate questions & quizzes" },
  { key: "ai_speech_to_text", label: "Speech-to-Text Notes", desc: "Transcribe lectures into notes" },
] as const;

const InstituteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: detailData, isLoading, error } = useTenant(id || "");
  const { data: statsData } = useTenantStats(id || "");
  const suspendMutation = useSuspendTenant();
  const activateMutation = useActivateTenant();
  const updateMutation = useUpdateTenant();

  // AI feature management local state
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiFeatures, setAiFeatures] = useState<string[]>([]);
  const [aiDirty, setAiDirty] = useState(false);

  // Sync AI state once tenant data loads (only when not dirty, to avoid clobbering edits)
  useEffect(() => {
    const t = (detailData as any)?.tenant || (detailData as any);
    if (t && !aiDirty) {
      setAiEnabled(!!t.aiEnabled);
      setAiFeatures(Array.isArray(t.aiFeatures) ? t.aiFeatures : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailData]);

  const handleSaveAi = async () => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        id,
        aiEnabled,
        aiFeatures: aiEnabled ? aiFeatures : [],
      } as any);
      setAiDirty(false);
      toast.success("AI features updated successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update AI features");
    }
  };

  const toggleAiFeature = (key: string) => {
    setAiDirty(true);
    setAiFeatures((prev) => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]);
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "courses", label: "Course Analytics" },
    { id: "ai", label: "AI Features" },
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
      const isConfirmed = await confirm({
        title: "Reactivate Institute",
        message: `Are you sure you want to reinstate access for "${tenant.name}"?`,
        confirmLabel: "Reactivate",
        cancelLabel: "Cancel",
      });
      if (isConfirmed) {
        await activateMutation.mutateAsync(id);
        toast.success("Institute reactivated");
      }
    } else {
      const isConfirmed = await confirm({
        title: "Suspend Institute",
        message: `Are you sure you want to suspend "${tenant.name}"? This will restrict access.`,
        confirmLabel: "Suspend",
        cancelLabel: "Cancel",
      });
      if (isConfirmed) {
        await suspendMutation.mutateAsync(id);
        toast.success("Institute suspended");
      }
    }
  };

  const handlePromoteToActive = async () => {
    if (!id) return;
    const isConfirmed = await confirm({
      title: "Confirm Promotion",
      message: `Are you sure you want to promote "${tenant.name}" to Active status?`,
      confirmLabel: "Promote",
      cancelLabel: "Cancel",
    });
    if (!isConfirmed) return;
    try {
      await updateMutation.mutateAsync({
        id,
        status: "active",
      } as any);
      toast.success("Tenant promoted to active status successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to promote tenant");
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-10 font-sans text-slate-900">
      <header className="max-w-7xl mx-auto mb-7 md:mb-10 border-b border-slate-100 pb-6 md:pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-[11px] font-medium uppercase tracking-wider mb-5">
          <ChevronLeft className="w-4 h-4" /> Return to Directory
        </button>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-18 md:h-18 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl md:text-[28px] font-bold text-slate-400 border border-slate-50 shadow-sm shrink-0">
              {(tenant.name || "?")[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h1 className="text-[24px] md:text-[32px] lg:text-[38px] font-bold text-slate-900 tracking-tight leading-tight">{tenant.name}</h1>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize tracking-wide ${statusStyles[status] || "border-slate-200 bg-slate-50 text-slate-600"}`}>
                  {status}
                </span>
              </div>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-tight flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-indigo-500" /> {tenant.subdomain}<span className="opacity-40">.edva.in</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status === "trial" && (
              <Button
                onClick={handlePromoteToActive}
                disabled={updateMutation.isPending}
                className="h-10 md:h-12 px-5 md:px-8 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 font-semibold transition-all text-sm flex items-center"
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" /> Promote to Active
              </Button>
            )}

            <Button
              onClick={handleSuspendToggle}
              disabled={suspendMutation.isPending || activateMutation.isPending}
              className={`h-10 md:h-12 px-5 md:px-8 rounded-2xl font-semibold shadow-lg transition-all text-sm ${status === "suspended"
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
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-5 md:p-7 rounded-2xl md:rounded-[36px] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-[16px] ${s.bg} ${s.color} transition-transform group-hover:scale-110`}><s.icon className="w-5 h-5" /></div>
              </div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{s.label}</p>
              <h3 className="text-xl md:text-[28px] font-bold text-slate-900 mt-1 leading-none">{s.value}</h3>
              <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-50/30 opacity-0 group-hover:opacity-100 blur-[40px] transition-opacity translate-x-12 -translate-y-12" />
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 inline-flex gap-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-8 py-3.5 rounded-xl text-[13px] font-medium uppercase tracking-tight transition-all ${activeTab === tab.id ? "bg-white text-gray-900 shadow-md shadow-slate-200" : "text-slate-400 hover:text-slate-900"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-7">
                <div className="lg:col-span-2 space-y-5 md:space-y-7">
                  {/* Administrative Profile */}
                  <div className="bg-white rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm p-5 md:p-8">
                    <h3 className="text-base md:text-lg font-bold text-slate-900 mb-7 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-600" /> Administrative Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                      {[
                        { icon: Mail, label: "Master Billing", value: tenant.billingEmail || "—" },
                        { icon: Shield, label: "Governance Contact", value: detail?.adminPhone || "—" },
                        { icon: Globe, label: "Access Hub", value: `${tenant.subdomain}.edva.in` },
                        { icon: Calendar, label: "Deployment Date", value: tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : "—" },
                        { icon: LayoutDashboard, label: "Institute Type", value: tenant.type ? tenant.type.charAt(0).toUpperCase() + tenant.type.slice(1) : "—" },
                      ].map((item) => (
                        <div key={item.label} className="group">
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">{item.label}</p>
                          <div className="flex items-center gap-4">
                            <item.icon className="w-5 h-5 text-gray-800 group-hover:text-indigo-600 transition-colors" />
                            <span className="text-[16px] font-semibold text-slate-800">{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Location & Customization Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
                    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
                      <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-500" /> Location Details
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Address</p>
                          <p className="text-sm font-semibold text-slate-800">{tenant.address || "—"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">City</p>
                            <p className="text-sm font-semibold text-slate-800 capitalize">{tenant.city || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">State</p>
                            <p className="text-sm font-semibold text-slate-800 capitalize">{tenant.state || "—"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Pincode</p>
                          <p className="text-sm font-semibold text-slate-800">{tenant.pincode || "—"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
                      <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-amber-500" /> Branding & Onboarding
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Brand Color</p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md shadow-sm border border-slate-200" style={{ backgroundColor: tenant.brandColor || '#F97316' }} />
                            <p className="text-sm font-semibold text-slate-800">{tenant.brandColor || "Default (Orange)"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Logo Status</p>
                          <p className="text-sm font-semibold text-slate-800">{tenant.logoUrl ? "Custom Logo Uploaded" : "No Custom Logo"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Onboarding Status</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${tenant.onboardingComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <p className="text-sm font-semibold text-slate-800">{tenant.onboardingComplete ? "Completed" : "Pending"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 md:space-y-7">
                  {status === "suspended" && tenant.suspensionReason && (
                    <div className="bg-rose-50 rounded-[28px] p-6 border border-rose-100">
                      <h3 className="text-sm font-bold text-rose-900 mb-2 flex items-center gap-2">
                        <Ban className="w-4 h-4 text-rose-600" /> Suspension Reason
                      </h3>
                      <p className="text-sm text-rose-800 font-medium leading-relaxed">{tenant.suspensionReason}</p>
                    </div>
                  )}

                  <div className="bg-white rounded-[28px] md:rounded-[44px] p-5 md:p-8 text-gray-900 shadow-lg shadow-slate-900/40 relative overflow-hidden">
                    <h3 className="text-base md:text-lg font-bold mb-7 relative z-10">Quota Intelligence</h3>
                    <div className="space-y-7 relative z-10">
                      <UsageProgress label="Active Learner Hub" current={studentCount} total={studentLimit} color="bg-indigo-500" inverse />
                      <UsageProgress label="Faculty Hub Slots" current={teacherCount} total={teacherLimit} color="bg-purple-500" inverse />
                    </div>
                    <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500 opacity-10 blur-[60px] translate-x-12 -translate-y-12" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "courses" && (
              <div className="bg-white rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm p-5 md:p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <MonitorPlay className="w-5 h-5 text-indigo-600" /> Course-Wise Analytics
                </h3>

                {(!detail?.courseAnalytics || detail.courseAnalytics.length === 0) ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-500">No courses found for this institute.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Course Name</th>
                          <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Enrollments</th>
                          <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Live Classes</th>
                          <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.courseAnalytics.map((course: any) => (
                          <tr
                            key={course.batch_id}
                            onClick={() => navigate(`/super-admin/tenants/${id}/courses/${course.batch_id}`)}
                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                          >
                            <td className="py-4 px-4 relative">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{course.course_name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">ID: {course.batch_id.split('-')[0]}</p>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                                {course.enrollments.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">
                                {course.live_classes.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <p className="text-sm font-bold text-emerald-600">₹{Number(course.revenue).toLocaleString()}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ai" && (
              <div className="bg-white rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm p-5 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">AI Features</h3>
                      <p className="text-xs font-semibold text-slate-400">Control AI-powered tools for this institute</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAiDirty(true); setAiEnabled((v) => { const nv = !v; if (!nv) setAiFeatures([]); return nv; }); }}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 shrink-0 ${aiEnabled ? "bg-indigo-600" : "bg-slate-200"}`}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${aiEnabled ? "translate-x-7" : ""}`} />
                  </button>
                </div>

                {aiEnabled ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AI_FEATURE_OPTIONS.map((feat) => {
                      const checked = aiFeatures.includes(feat.key);
                      return (
                        <button
                          key={feat.key}
                          type="button"
                          onClick={() => toggleAiFeature(feat.key)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${checked ? "border-indigo-500 bg-indigo-50" : "border-slate-100 bg-white hover:border-slate-200"
                            }`}
                        >
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                            }`}>
                            {checked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{feat.label}</p>
                            <p className="text-[11px] font-semibold text-slate-400">{feat.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-sm font-semibold text-slate-400">AI features are disabled for this institute.</p>
                    <p className="text-xs font-medium text-slate-300 mt-1">Toggle the switch above to enable AI-powered tools.</p>
                  </div>
                )}

                {aiDirty && (
                  <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const t = (detailData as any)?.tenant || (detailData as any);
                        setAiEnabled(!!t?.aiEnabled);
                        setAiFeatures(Array.isArray(t?.aiFeatures) ? t.aiFeatures : []);
                        setAiDirty(false);
                      }}
                      className="h-11 px-6 rounded-xl border border-slate-200 font-semibold text-slate-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveAi}
                      disabled={updateMutation.isPending}
                      className="h-11 px-8 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/20 flex gap-2"
                    >
                      {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                      Save Changes
                    </Button>
                  </div>
                )}
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
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{s.value}</h3>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === "billing" && (
              <div className="bg-card rounded-[32px] border border-border shadow-sm p-8">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" /> Billing Summary
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-secondary/50 rounded-2xl p-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Current Plan</p>
                    <p className="text-xl font-bold text-foreground capitalize">{tenant.plan}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-2xl p-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Revenue</p>
                    <p className="text-xl font-bold text-foreground">₹{totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-2xl p-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Trial Ends</p>
                    <p className="text-xl font-bold text-foreground">{tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString("en-IN") : "—"}</p>
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
        <p className={`text-[11px] font-medium uppercase tracking-wider ${inverse ? 'text-white/40' : 'text-slate-400'}`}>{label}</p>
        <p className={`text-[12px] font-medium ${inverse ? 'text-white' : 'text-slate-900'}`}>{current.toLocaleString()} <span className={inverse ? 'text-white/30' : 'text-gray-600'}>/ {total.toLocaleString()}</span></p>
      </div>
      <div className={`h-2.5 rounded-full overflow-hidden ${inverse ? 'bg-white/5' : 'bg-slate-100'}`}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${color} shadow-[0_0_12px_rgba(0,0,0,0.1)]`} />
      </div>
    </div>
  );
};

export default InstituteDetailPage;
