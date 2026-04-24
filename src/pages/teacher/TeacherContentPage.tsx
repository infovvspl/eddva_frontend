import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, ChevronDown, GraduationCap,
  Users, BookOpen, Clock, ArrowRight,
  Layout, Sparkles, BookText, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyBatches } from "@/hooks/use-teacher";
import { useSubjects } from "@/hooks/use-admin";
import { AeroBackground } from "@/components/shared/AeroBackground";

// We'll reuse the curriculum management components if they are exported, 
// but for now we'll implement a clean Phase 1 (Batch Selection) for teachers.
// If a batch is selected, we'll redirect to the curriculum view which is 
// usually integrated into the batch detail or a separate shared component.

const TeacherContentPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const batchId = searchParams.get("batchId");

  const { data: batches = [], isLoading: batchesLoading } = useMyBatches();
  
  const [batchSearch, setBatchSearch] = useState("");
  const [batchStatusFilter, setBatchStatusFilter] = useState<"active" | "all" | "upcoming" | "completed">("active");

  // Sync state with URL
  useEffect(() => {
    if (batchId && batches.length > 0) {
      // If we have a batchId, we could show Phase 2
      // For now, let's keep the flow consistent
    }
  }, [batchId, batches]);

  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(batchSearch.toLowerCase());
      const matchesStatus = batchStatusFilter === "all" || 
        (batchStatusFilter === "active" && b.status === "active") ||
        (batchStatusFilter === "upcoming" && b.status === "upcoming") ||
        (batchStatusFilter === "completed" && b.status === "completed");
      return matchesSearch && matchesStatus;
    });
  }, [batches, batchSearch, batchStatusFilter]);

  const handleSelectBatch = (id: string) => {
    navigate(`/teacher/batches?batchId=${id}&tab=curriculum`);
  };

  if (batchesLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading your courses…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Content Management</h1>
              <p className="text-slate-500 font-medium">Select a course to manage curriculum and study materials</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Search your courses…"
              value={batchSearch}
              onChange={e => setBatchSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-indigo-400 transition-all text-sm font-medium shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {[
              { id: "active", label: "Ongoing" },
              { id: "all", label: "All Courses" },
              { id: "upcoming", label: "Upcoming" },
              { id: "completed", label: "Completed" },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setBatchStatusFilter(opt.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
                  batchStatusFilter === opt.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                    : "bg-white text-slate-500 border border-slate-100 hover:border-slate-200"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        {filteredBatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <motion.div
                key={batch.id}
                whileHover={{ y: -5 }}
                className="group relative bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                onClick={() => handleSelectBatch(batch.id)}
              >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-500">
                      <BookOpen className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors duration-500" />
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      batch.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
                    )}>
                      {batch.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                      {batch.name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 font-medium">
                      {batch.examTarget || "General Course"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-bold">{batch.studentCount || 0} Students</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Layout className="w-4 h-4" />
                      <span className="text-xs font-bold">{batch.subjectCount || 0} Subjects</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Manage Curriculum
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:translate-x-1 transition-all">
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No courses found</h3>
            <p className="text-slate-500 mt-1 font-medium">Try adjusting your search or filters</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default TeacherContentPage;
