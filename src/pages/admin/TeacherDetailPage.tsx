import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, Users, BookOpen, MessageSquare,
  Layout, Calendar, Mail, Phone, Clock, CheckCircle, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTeacherDetail } from "@/hooks/use-admin";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  pending_verification: "bg-amber-500/10 text-amber-600",
  suspended: "bg-red-500/10 text-red-600",
  inactive: "bg-gray-500/10 text-gray-500",
};

const batchStatusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  inactive: "bg-gray-500/10 text-gray-500",
  completed: "bg-blue-500/10 text-blue-600",
};

const TeacherDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useTeacherDetail(id || "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400 opacity-50" />
        <p className="text-muted-foreground">Teacher not found.</p>
        <Button variant="ghost" onClick={() => navigate("/admin/teachers")} className="mt-4">
          Back to Teachers
        </Button>
      </div>
    );
  }

  const { teacher, batches, stats } = data;
  const status = (teacher.status || "").toLowerCase();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/admin/teachers")}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
              {(teacher.fullName || "T").charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{teacher.fullName}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[status] || statusColors.inactive}`}>
                  {status === "pending_verification" ? "Pending" : status}
                </span>
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(teacher.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Phone className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="text-sm font-medium text-foreground">{teacher.phoneNumber}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium text-foreground">{teacher.email || "—"}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Login</p>
            <p className="text-sm font-medium text-foreground">
              {teacher.lastLoginAt
                ? new Date(teacher.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                : "Never"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Batches", value: stats.totalBatches, icon: Layout, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Active Batches", value: stats.activeBatches, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Students", value: stats.totalStudents, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Lectures", value: stats.totalLectures, icon: BookOpen, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Doubts Resolved", value: stats.resolvedDoubts, icon: CheckCircle, color: "text-teal-500", bg: "bg-teal-500/10" },
          { label: "Pending Doubts", value: stats.pendingDoubts, icon: MessageSquare, color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Assigned Batches */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Assigned Batches</h2>
        </div>
        {batches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Layout className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No batches assigned yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Batch Name</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Exam</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Class</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Duration</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-4">
                    <span className="text-sm font-medium text-foreground">{b.name}</span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell uppercase">{b.examTarget}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{b.class}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                    {b.startDate && b.endDate
                      ? `${new Date(b.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} — ${new Date(b.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
                      : "—"
                    }
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${batchStatusColors[b.status] || batchStatusColors.inactive}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};

export default TeacherDetailPage;
