import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText, CheckCircle2, XCircle, Clock, BookOpen, Search, X } from "lucide-react";
import { parentClient } from "@/lib/api/parent-client";
import { useParentContext } from "@/components/school/parent/ParentAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function ParentChild() {
  const { activeChildId } = useParentContext();
  const [activeTab, setActiveTab] = useState<"attendance" | "marks" | "homework" | "tests">("attendance");

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Academic Progress</h2>
        <p className="text-sm font-semibold text-slate-500">View detailed reports for your child</p>
      </div>

      <div className="flex overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm border border-slate-100 no-scrollbar">
        {[
          { id: "attendance", label: "Attendance" },
          { id: "marks", label: "Marks" },
          { id: "homework", label: "Homework" },
          { id: "tests", label: "Tests" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] bg-white p-4 sm:p-6 shadow-sm border border-slate-100 min-h-[400px]">
        {activeTab === "attendance" && <AttendanceTab studentId={activeChildId} />}
        {activeTab === "marks" && <MarksTab studentId={activeChildId} />}
        {activeTab === "homework" && <HomeworkTab studentId={activeChildId} />}
        {activeTab === "tests" && <TestsTab studentId={activeChildId} />}
      </div>
    </div>
  );
}

function AttendanceTab({ studentId }: { studentId: string | null }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['parent-attendance', studentId, month],
    queryFn: () => studentId ? parentClient.getAttendance(studentId, month) : null,
    enabled: !!studentId,
    retry: 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-black text-slate-900">Attendance Record</h3>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
          />
          <button
            onClick={() => setShowLeaveModal(true)}
            className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-200 transition-colors"
          >
            Apply Leave
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : data?.records?.length ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 rounded-2xl bg-slate-50 p-3 sm:p-4 border border-slate-100">
            <div className="text-center">
              <p className="text-[10px] sm:text-xs font-black uppercase text-slate-400">Present</p>
              <p className="text-lg sm:text-2xl font-black text-emerald-600">{data.present ?? 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] sm:text-xs font-black uppercase text-slate-400">Absent</p>
              <p className="text-lg sm:text-2xl font-black text-red-500">{data.absent ?? 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] sm:text-xs font-black uppercase text-slate-400">Late</p>
              <p className="text-lg sm:text-2xl font-black text-amber-500">{data.late ?? 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[9px] sm:text-[10px] font-black uppercase text-slate-400 py-1 sm:py-2">{d}</div>
            ))}
            {data.records.map((day: any, i: number) => (
              <div
                key={i}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg sm:rounded-xl border sm:border-2 text-[10px] sm:text-sm font-bold ${
                  day.status === 'present' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' :
                  day.status === 'absent' ? 'border-red-100 bg-red-50 text-red-700' :
                  day.status === 'late' ? 'border-amber-100 bg-amber-50 text-amber-700' :
                  day.status === 'holiday' ? 'border-slate-100 bg-slate-100 text-slate-400' :
                  'border-transparent bg-transparent text-slate-400 opacity-50'
                }`}
              >
                {day.date?.split('-')[2] ?? ''}
                {day.status === 'present' && <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3 mt-0.5 sm:mt-1 text-emerald-500" />}
                {day.status === 'absent' && <XCircle className="h-2 w-2 sm:h-3 sm:w-3 mt-0.5 sm:mt-1 text-red-500" />}
                {day.status === 'late' && <Clock className="h-2 w-2 sm:h-3 sm:w-3 mt-0.5 sm:mt-1 text-amber-500" />}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center opacity-50 py-12">
          <Calendar className="h-12 w-12 text-slate-400 mb-3" />
          <p className="text-sm font-bold text-slate-600">No attendance data for this month</p>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900">Apply for Leave</h3>
              <button onClick={() => setShowLeaveModal(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowLeaveModal(false); }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400">From Date</label>
                  <input type="date" required className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400">To Date</label>
                  <input type="date" required className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400">Reason</label>
                <textarea required rows={3} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 resize-none" placeholder="Enter reason for leave..." />
              </div>
              <button type="submit" className="w-full rounded-xl bg-blue-600 py-3.5 text-[15px] font-black text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MarksTab({ studentId }: { studentId: string | null }) {
  const [term, setTerm] = useState("Term 1");

  const { data, isLoading } = useQuery({
    queryKey: ['parent-marks', studentId, term],
    queryFn: () => studentId ? parentClient.getMarks(studentId, term) : null,
    enabled: !!studentId,
    retry: 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">Academic Marks</h3>
        <CustomSelect
          onChange={setTerm}
          value={term}
          options={[
          { value: "Term 1", label: "Term 1" },
          { value: "Term 2", label: "Term 2" },
          { value: "Annual", label: "Annual" },
        ]}
          className="w-full"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : data?.results?.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="pb-3 pl-4">Test</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Marks</th>
                <th className="pb-3 pr-4 text-right">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.results.map((res: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-4 pl-4">
                    <p className="font-black text-slate-900">{res.testName}</p>
                    {res.type && <p className="text-xs font-semibold text-slate-500 capitalize">{res.type}</p>}
                  </td>
                  <td className="py-4 font-semibold text-slate-500">{res.date || "—"}</td>
                  <td className="py-4 font-black text-slate-900">{res.isAbsent ? "Absent" : res.marks}</td>
                  <td className="py-4 pr-4 text-right">
                    <span className={`inline-flex items-center justify-center rounded-lg px-2 py-1 text-xs font-black ${
                      ['A+', 'A'].includes(res.grade) ? 'bg-emerald-100 text-emerald-700' :
                      ['B+', 'B'].includes(res.grade) ? 'bg-blue-100 text-blue-700' :
                      ['C', 'D'].includes(res.grade) ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {res.grade || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {typeof data.average === "number" && (
              <tfoot>
                <tr className="border-t-2 border-slate-100 bg-slate-50">
                  <td className="py-4 pl-4 font-black text-slate-900 uppercase text-xs tracking-wider" colSpan={2}>Average</td>
                  <td className="py-4 font-black text-blue-600" colSpan={2}>{data.average}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center opacity-50 py-12">
          <BookOpen className="h-12 w-12 text-slate-400 mb-3" />
          <p className="text-sm font-bold text-slate-600">No marks recorded yet</p>
        </div>
      )}
    </div>
  );
}

function HomeworkTab({ studentId }: { studentId: string | null }) {
  const [filter, setFilter] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ['parent-homework', studentId, filter],
    queryFn: () => studentId ? parentClient.getHomework(studentId, filter) : null,
    enabled: !!studentId,
    retry: 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {["All", "Pending", "Submitted", "Overdue"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${
              filter === f ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : data?.homework?.length > 0 ? (
        <div className="space-y-4">
          {data.homework.map((hw: any, i: number) => (
            <div key={hw.id ?? i} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 transition-colors">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 font-black text-xs uppercase">
                  {(hw.subject ?? hw.title ?? "?").toString().substring(0, 3)}
                </div>
                <div>
                  <h4 className="text-[15px] font-black text-slate-900">{hw.title}</h4>
                  {hw.subject && <p className="text-xs font-semibold text-slate-500 mt-1">{hw.subject}</p>}
                  {hw.dueDate && (
                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      Due: {new Date(hw.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="sm:text-right">
                {hw.status === 'submitted' ? (
                  <span className="inline-flex items-center rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">
                    Submitted
                  </span>
                ) : hw.status === 'overdue' ? (
                  <span className="inline-flex items-center rounded-lg bg-red-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-red-700">
                    Overdue
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-700">
                    Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center opacity-50 py-12">
          <FileText className="h-12 w-12 text-slate-400 mb-3" />
          <p className="text-sm font-bold text-slate-600">No homework found for "{filter}"</p>
        </div>
      )}
    </div>
  );
}

function TestsTab({ studentId }: { studentId: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ['parent-tests', studentId],
    queryFn: () => studentId ? parentClient.getTests(studentId) : null,
    enabled: !!studentId,
    retry: 1,
  });

  return (
    <div className="space-y-8">
      {/* UPCOMING */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Upcoming Tests</h3>
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-2xl" />
        ) : data?.upcoming?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.upcoming.map((test: any, i: number) => (
              <div key={test.id ?? i} className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg shadow-indigo-500/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-lg bg-white/20 px-2 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                    {test.type || "Test"}
                  </span>
                  <span className="text-xs font-bold text-indigo-100">{test.date ? new Date(test.date).toLocaleDateString() : ""}</span>
                </div>
                <h4 className="text-lg font-black leading-tight mb-2">{test.title}</h4>
                {typeof test.totalMarks === "number" && (
                  <p className="text-xs font-medium text-indigo-100 opacity-90">Total marks: {test.totalMarks}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-bold text-slate-500">No upcoming tests scheduled</p>
          </div>
        )}
      </div>

      {/* COMPLETED */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Completed Tests</h3>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : data?.past?.length > 0 ? (
          <div className="space-y-3">
            {data.past.map((test: any, i: number) => (
              <div key={test.id ?? i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <h4 className="text-[15px] font-black text-slate-900">{test.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-400 capitalize">{test.type || "Test"}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-400">{test.date ? new Date(test.date).toLocaleDateString() : ""}</span>
                  </div>
                </div>
                <div className="text-right">
                  {typeof test.totalMarks === "number" && (
                    <span className="text-lg font-black text-slate-900">{test.totalMarks} marks</span>
                  )}
                  {test.status && (
                    <p className="text-[10px] font-black tracking-wider text-slate-400 capitalize">{test.status}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-bold text-slate-500">No completed tests yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
