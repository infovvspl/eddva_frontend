import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient, extractData } from "@/lib/api/client";
import { useTenant } from "@/hooks/use-tenants";
import { listEnrollments } from "@/lib/api/tenants";
import { Loader2, AlertCircle, ChevronLeft, Calendar, Users, GraduationCap, MonitorPlay, BookOpen, Clock, Activity, Layout, FileText, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CourseDetailPage = () => {
  const { id, courseId } = useParams<{ id: string, courseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "curriculum" | "content">("overview");
  
  const { data: tenantDetail, isLoading: tenantLoading, error: tenantError } = useTenant(id || "");
  const subdomain = (tenantDetail as any)?.tenant?.subdomain || (tenantDetail as any)?.subdomain;
  const analytics = (tenantDetail as any)?.courseAnalytics || (tenantDetail as any)?.tenant?.courseAnalytics || [];
  
  const course = analytics.find((c: any) => c.batch_id === courseId);

  if (!courseId || !id) return null;

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tenantError || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">Failed to load course details.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-100",
    completed: "bg-blue-50 text-blue-600 border-blue-100",
    upcoming: "bg-amber-50 text-amber-600 border-amber-100",
  };
  const statusColor = statusStyles[course.status?.toLowerCase()] || statusStyles.active;

  const tabs = [
    { id: "overview", label: "Overview", icon: Layout },
    { id: "students", label: "Students", icon: Users },
    { id: "curriculum", label: "Curriculum", icon: FileText },
    { id: "content", label: "Content", icon: PlayCircle },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-10 font-sans text-slate-900">
      <header className="max-w-7xl mx-auto mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-[11px] font-medium uppercase tracking-wider mb-5">
          <ChevronLeft className="w-4 h-4" /> Return to Institute
        </button>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl font-bold text-indigo-500 border border-indigo-100 shadow-sm shrink-0">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-[24px] md:text-[32px] lg:text-[36px] font-bold text-slate-900 tracking-tight leading-tight">{course.course_name}</h1>
                <div className={`text-[10px] font-medium px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 uppercase tracking-wider ${statusColor}`}>
                   <div className="w-1.5 h-1.5 rounded-full bg-current" />
                   {course.status || "Active"}
                </div>
              </div>
              <p className="text-slate-500 text-sm max-w-2xl">{course.description || "Course details are managed by the institute."}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-200">
        <div className="flex space-x-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                  isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto">
        {activeTab === "overview" && <OverviewTab course={course} />}
        {activeTab === "students" && <StudentsTab batchId={courseId} subdomain={subdomain} />}
        {activeTab === "curriculum" && <CurriculumTab batchId={courseId} subdomain={subdomain} />}
        {activeTab === "content" && <ContentTab batchId={courseId} subdomain={subdomain} />}
      </main>
    </div>
  );
};

// --- Overview Tab ---
const OverviewTab = ({ course }: { course: any }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard label="Enrollments" value={course.enrollments || 0} icon={Users} color="text-blue-600" bg="bg-blue-50" />
      <StatCard label="Live Classes" value={course.live_classes || 0} icon={MonitorPlay} color="text-purple-600" bg="bg-purple-50" />
      <StatCard label="Target Exam" value={course.examTarget || "N/A"} icon={Activity} color="text-indigo-600" bg="bg-indigo-50" />
      <StatCard label="Class/Grade" value={course.class || "N/A"} icon={GraduationCap} color="text-amber-600" bg="bg-amber-50" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> Course Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Teacher in Charge</p>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                {course.teacher?.fullName || "Not Assigned"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Start Date</p>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                {course.startDate ? new Date(course.startDate).toLocaleDateString() : "TBD"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">End Date</p>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                {course.endDate ? new Date(course.endDate).toLocaleDateString() : "TBD"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Created On</p>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : "Unknown"}
              </p>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Financial Overview</h3>
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Pricing Model</p>
            <div className="inline-flex px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
              {course.revenue > 0 ? "Paid Course" : "Free/Unknown"}
            </div>
          </div>
          
          <div>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Total Estimated Revenue</p>
            <p className="text-2xl font-bold text-emerald-600">
              ₹{Number(course.revenue || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Students Tab ---
const StudentsTab = ({ batchId, subdomain }: { batchId: string, subdomain?: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["super-admin", "batch-roster", batchId],
    queryFn: async () => {
      const res = await apiClient.get(`/batches/${batchId}/roster`, {
        headers: subdomain ? { "X-Tenant-Subdomain": subdomain } : undefined
      });
      return extractData<any[]>(res);
    },
    enabled: !!batchId
  });

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" /></div>;
  if (error) return (
    <div className="bg-white p-10 rounded-[28px] border border-slate-100 shadow-sm text-center">
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h3>
      <p className="text-slate-500 text-sm max-w-md mx-auto">
        The backend currently restricts Super Admins from fetching detailed student rosters for specific institutes.
      </p>
    </div>
  );

  const students = Array.isArray(data) ? data : data?.items || [];

  return (
    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900">Enrolled Students ({students.length})</h3>
      </div>
      {students.length === 0 ? (
        <div className="p-10 text-center text-slate-500">No students enrolled yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Email / Phone</th>
                <th className="px-6 py-4">Enrolled At</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s: any) => (
                <tr key={s.id || s.studentId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-900">{s.studentName || s.student?.fullName || "—"}</p>
                    <p className="text-xs text-slate-500">ID: {(s.studentId || s.student?.id || "").split('-')[0]}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">{s.studentEmail || s.student?.email || "N/A"}</p>
                    <p className="text-xs text-slate-500">{s.studentPhone || s.student?.phone || "N/A"}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : (s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "N/A")}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-semibold">
                      {s.status || "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- Curriculum Tab ---
const CurriculumTab = ({ batchId, subdomain }: { batchId: string, subdomain?: string }) => {
  const { data: subjects, isLoading, error } = useQuery({
    queryKey: ["super-admin", "subjects", batchId],
    queryFn: async () => {
      const res = await apiClient.get(`/subjects`, {
        params: { batchId },
        headers: subdomain ? { "X-Tenant-Subdomain": subdomain } : undefined
      });
      return extractData<any[]>(res);
    },
    enabled: !!batchId
  });

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" /></div>;
  if (error) return (
    <div className="bg-white p-10 rounded-[28px] border border-slate-100 shadow-sm text-center">
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h3>
      <p className="text-slate-500 text-sm max-w-md mx-auto">
        The backend currently restricts Super Admins from fetching detailed curriculum data for specific institutes.
      </p>
    </div>
  );

  return (
    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Course Curriculum</h3>
      {!subjects || subjects.length === 0 ? (
        <div className="text-center py-10 text-slate-500">No subjects found in this curriculum.</div>
      ) : (
        <div className="space-y-4">
          {subjects.map(sub => (
            <div key={sub.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 text-base">{sub.name}</h4>
                <p className="text-xs text-slate-500 mt-1">Exam Target: {sub.examTarget || "N/A"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Content Tab ---
const ContentTab = ({ batchId, subdomain }: { batchId: string, subdomain?: string }) => {
  const { data: lectures, isLoading, error } = useQuery({
    queryKey: ["super-admin", "lectures", batchId],
    queryFn: async () => {
      const res = await apiClient.get(`/lectures`, {
        params: { batchId, limit: 100 },
        headers: subdomain ? { "X-Tenant-Subdomain": subdomain } : undefined
      });
      return extractData<any>(res);
    },
    enabled: !!batchId
  });

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" /></div>;
  if (error) return (
    <div className="bg-white p-10 rounded-[28px] border border-slate-100 shadow-sm text-center">
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h3>
      <p className="text-slate-500 text-sm max-w-md mx-auto">
        The backend currently restricts Super Admins from fetching detailed lecture content for specific institutes.
      </p>
    </div>
  );

  const items = lectures?.items || lectures || [];

  return (
    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Course Content (Lectures)</h3>
      {!items || items.length === 0 ? (
        <div className="text-center py-10 text-slate-500">No lectures found for this course.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((lec: any) => (
            <div key={lec.id} className="p-4 rounded-2xl border border-slate-100 flex items-start gap-4 group hover:border-indigo-200 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                <PlayCircle className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">{lec.title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {lec.scheduledAt || lec.createdAt ? new Date(lec.scheduledAt || lec.createdAt).toLocaleDateString() : "N/A"}</span>
                  <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{lec.status || "Draft"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bg }: { label: string, value: string | number, icon: any, color: string, bg: string }) => (
  <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden">
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2.5 rounded-[12px] ${bg} ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
  </div>
);

export default CourseDetailPage;
