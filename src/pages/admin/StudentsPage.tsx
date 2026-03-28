import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, Users, Search, Layout, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useBatches, useBatchRoster } from "@/hooks/use-admin";
import { useNavigate } from "react-router-dom";

// ─── Per-batch roster loader ─────────────────────────────────────────────────

function useBatchRosterSafe(batchId: string) {
  const { data, isLoading } = useBatchRoster(batchId);
  const list: any[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if ((data as any).data) return (data as any).data;
    if ((data as any).items) return (data as any).items;
    return [];
  }, [data]);
  return { list, isLoading };
}

// ─── All students aggregated across all batches ───────────────────────────────

function useAllStudents() {
  const { data: batches, isLoading: batchesLoading } = useBatches();
  const batchList = Array.isArray(batches) ? batches : [];

  // Load rosters for all batches — hooks must be called unconditionally so we
  // cap at a reasonable number and call them with empty string when not available.
  const b0 = useBatchRosterSafe(batchList[0]?.id ?? "");
  const b1 = useBatchRosterSafe(batchList[1]?.id ?? "");
  const b2 = useBatchRosterSafe(batchList[2]?.id ?? "");
  const b3 = useBatchRosterSafe(batchList[3]?.id ?? "");
  const b4 = useBatchRosterSafe(batchList[4]?.id ?? "");
  const b5 = useBatchRosterSafe(batchList[5]?.id ?? "");
  const b6 = useBatchRosterSafe(batchList[6]?.id ?? "");
  const b7 = useBatchRosterSafe(batchList[7]?.id ?? "");
  const b8 = useBatchRosterSafe(batchList[8]?.id ?? "");
  const b9 = useBatchRosterSafe(batchList[9]?.id ?? "");

  const rosters = [b0, b1, b2, b3, b4, b5, b6, b7, b8, b9];

  const isLoading = batchesLoading || rosters.slice(0, batchList.length).some(r => r.isLoading);

  const students = useMemo(() => {
    const seen = new Set<string>();
    const result: any[] = [];
    rosters.slice(0, batchList.length).forEach((r, i) => {
      const batchName = batchList[i]?.name ?? "";
      r.list.forEach(s => {
        const id = s.studentId || s.id || s.userId || s.email;
        if (id && !seen.has(id)) {
          seen.add(id);
          result.push({ ...s, _batchName: batchName });
        }
      });
    });
    return result;
  }, [batchList, ...rosters.map(r => r.list)]);

  return { students, isLoading, batchList };
}

// ─── Page ────────────────────────────────────────────────────────────────────

const StudentsPage = () => {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const limit = 20;

  const { students, isLoading, batchList } = useAllStudents();

  const filtered = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      (s.name || s.fullName || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.phone || s.phoneNumber || "").includes(q)
    );
  }, [students, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Students" subtitle={`${students.length} students across ${batchList.length} batch${batchList.length !== 1 ? "es" : ""}`} />

      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full h-11 pl-10 pr-4 bg-secondary border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary"
          />
        </div>
      </form>

      {paged.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">{search ? "No students match your search" : "No students found"}</p>
          <p className="text-sm mt-1">
            {batchList.length === 0
              ? "Create a batch first, then add students to it."
              : "Add students to your batches via Admin → Batches."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Phone / Email</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Batch</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Streak</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Last Login</th>
                  <th className="w-8 p-4"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((s: any, i) => {
                  const name = s.name || s.fullName || s.studentName || "—";
                  const phone = s.phone || s.phoneNumber || "—";
                  const email = s.email || "";
                  const id = s.studentId || s.id || i;
                  return (
                    <tr
                      key={id}
                      onClick={() => typeof id === "string" && navigate(`/admin/students/${id}`)}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground">{name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">
                        <div>{phone}</div>
                        {email && <div className="text-xs opacity-60">{email}</div>}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {s._batchName && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            <Layout className="w-3 h-3" /> {s._batchName}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm font-semibold text-foreground hidden lg:table-cell">
                        🔥 {s.streakDays ?? s.currentStreak ?? 0}d
                      </td>
                      <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                        {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Never"}
                      </td>
                      <td className="p-4 text-muted-foreground"><ChevronRight className="w-4 h-4" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-muted-foreground">{filtered.length} students total</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 text-sm bg-secondary rounded-lg disabled:opacity-40">Prev</button>
                <span className="px-3 py-1.5 text-sm text-muted-foreground">Page {page} / {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm bg-secondary rounded-lg disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default StudentsPage;
