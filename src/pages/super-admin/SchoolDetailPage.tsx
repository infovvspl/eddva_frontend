import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  Users,
  GraduationCap,
  Heart,
  Building2,
  Mail,
  Phone,
  Search,
  Globe,
  MapPin,
  Hash,
  Calendar,
  Award,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import schoolApi from "@/lib/api/school-client";
import { toast } from "sonner";
import { useConfirm } from "@/context/ConfirmContext";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENDED: "bg-rose-50 text-rose-700 border-rose-200",
};

const tabs = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "teachers", label: "Teachers", icon: GraduationCap },
  { id: "students", label: "Students", icon: Users },
  { id: "parents", label: "Parents", icon: Heart },
] as const;

type TabId = (typeof tabs)[number]["id"];

const countValue = (...values: any[]) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const getList = (res: any) => {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.data?.items)) return body.data.items;
  return [];
};

const getTotal = (res: any, fallback: number) => {
  const body = res?.data;
  return countValue(body?.total, body?.meta?.totalItems, body?.data?.total, body?.data?.meta?.totalItems, fallback);
};

const displayDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : "-");

const valueOrDash = (...values: any[]) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "-";
};

const boolLabel = (value: any) => (value === true || value === "true" ? "Enabled" : "Disabled");

const StatusPill = ({ active }: { active: boolean }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
    {active ? "Active" : "Inactive"}
  </span>
);

const EmptyRow = ({ label, colSpan }: { label: string; colSpan: number }) => (
  <tr>
    <td colSpan={colSpan} className="px-5 py-10 text-center text-sm font-semibold text-slate-400">
      {label}
    </td>
  </tr>
);

const SchoolDetailPage = () => {
  const confirm = useConfirm();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = location.pathname.startsWith("/school/admin")
    ? "/school/admin/institutes"
    : "/super-admin/school";
  const [institute, setInstitute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [search, setSearch] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [totals, setTotals] = useState({ teachers: 0, students: 0, parents: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/school/institutes/${id}`);
      const data = (res.data as any)?.data ?? res.data;
      if (data.name) {
        setInstitute(data);
      } else if (data.tenant) {
        setInstitute({
          ...data.tenant,
          email: data.adminEmail || data.tenant.billingEmail,
          phone: data.adminPhone,
          tenant_domain: data.tenant.subdomain,
          created_at: data.tenant.createdAt,
        });
      } else {
        setInstitute(data);
      }
    } catch {
      toast.error("Failed to load institute details");
    } finally {
      setLoading(false);
    }
  };

  const loadPeople = async () => {
    if (!id) return;
    setPeopleLoading(true);
    try {
      const params = { instituteId: id, page: 1, limit: 100 };
      const [teacherRes, studentRes, parentRes] = await Promise.all([
        schoolApi.get("/teachers", { params }),
        schoolApi.get("/students", { params }),
        schoolApi.get("/admin/users", { params: { ...params, role: "PARENT" } }),
      ]);
      const teacherList = getList(teacherRes);
      const studentList = getList(studentRes);
      const parentList = getList(parentRes);
      setTeachers(teacherList);
      setStudents(studentList);
      setParents(parentList);
      setTotals({
        teachers: getTotal(teacherRes, teacherList.length),
        students: getTotal(studentRes, studentList.length),
        parents: getTotal(parentRes, parentList.length),
      });
    } catch {
      toast.error("Failed to load school members");
    } finally {
      setPeopleLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      load();
      loadPeople();
    }
  }, [id]);

  const approve = async () => {
    try {
      await apiClient.put(`/school/institutes/${id}/approve`);
      toast.success("Institute approved");
      load();
    } catch {
      toast.error("Failed to approve");
    }
  };

  const reject = async () => {
    try {
      await apiClient.put(`/school/institutes/${id}/reject`);
      toast.success("Institute suspended");
      load();
    } catch {
      toast.error("Failed to suspend");
    }
  };

  const remove = async () => {
    const isConfirmed = await confirm({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this school institute? This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (!isConfirmed) return;
    try {
      await apiClient.delete(`/school/institutes/${id}`);
      toast.success("Institute deleted");
      navigate(backPath);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teachers;
    return teachers.filter((item) =>
      [item.name, item.email, item.phone, item.teacherProfile?.employeeId, item.teacherProfile?.department]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [teachers, search]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((item) =>
      [item.name, item.email, item.phone, item.studentProfile?.enrollmentNo, item.studentProfile?.rollNo]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [students, search]);

  const filteredParents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return parents;
    return parents.filter((item) =>
      [item.name, item.email, item.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [parents, search]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  if (!institute) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400 font-semibold">Institute not found.</div>;
  }

  const summaryCards = [
    {
      label: "Students",
      value: countValue(totals.students, institute.student_count, institute.studentCount),
      icon: Users,
      tone: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      label: "Teachers",
      value: countValue(totals.teachers, institute.teacher_count, institute.teacherCount),
      icon: GraduationCap,
      tone: "bg-violet-50 text-violet-700 border-violet-100",
    },
    {
      label: "Parents",
      value: countValue(totals.parents, institute.parent_count, institute.parentCount),
      icon: Heart,
      tone: "bg-rose-50 text-rose-700 border-rose-100",
    },
  ];

  const address = valueOrDash(
    institute.address,
    [
      institute.plot_no || institute.plotNo,
      institute.street_name || institute.streetName,
      institute.land_mark || institute.landMark,
      institute.city,
      institute.district,
      institute.state,
      institute.pin_code || institute.pinCode,
    ].filter(Boolean).join(", "),
  );

  const aiFeatures = institute.ai_features || institute.aiFeatures || {};
  const enabledAiFeatures = Object.entries(aiFeatures)
    .filter(([, enabled]) => enabled === true)
    .map(([key]) => key.replace(/^ai_/, "").replace(/_/g, " "));

  const overviewSections = [
    {
      title: "Contact",
      items: [
        ["Email", valueOrDash(institute.email, institute.admin_email, institute.adminEmail), Mail],
        ["Phone", valueOrDash(institute.phone), Phone],
        ["Alternate Phone", valueOrDash(institute.alternate_phone, institute.alternatePhone), Phone],
        ["Website", valueOrDash(institute.website), Globe],
      ],
    },
    {
      title: "Address",
      items: [
        ["Full Address", address, MapPin],
        ["Plot No", valueOrDash(institute.plot_no, institute.plotNo), Hash],
        ["Street", valueOrDash(institute.street_name, institute.streetName), MapPin],
        ["Landmark", valueOrDash(institute.land_mark, institute.landMark), MapPin],
        ["City", valueOrDash(institute.city), MapPin],
        ["District", valueOrDash(institute.district), MapPin],
        ["State", valueOrDash(institute.state), MapPin],
        ["PIN Code", valueOrDash(institute.pin_code, institute.pinCode), Hash],
      ],
    },
    {
      title: "Academic",
      items: [
        ["School Type", valueOrDash(institute.school_type, institute.schoolType), Building2],
        ["Board", valueOrDash(institute.board), Award],
        ["Established Year", valueOrDash(institute.established_year, institute.establishedYear), Calendar],
        ["Affiliation No", valueOrDash(institute.affiliation_no, institute.affiliationNo), Hash],
        ["Total Classes", valueOrDash(institute.total_classes, institute.totalClasses), BookOpen],
        ["Total Students", valueOrDash(institute.total_students, institute.totalStudents), Users],
        ["Total Teachers", valueOrDash(institute.total_teachers, institute.totalTeachers), GraduationCap],
      ],
    },
    {
      title: "Administration",
      items: [
        ["Principal", valueOrDash(institute.principal_name, institute.principalName, institute.admin_name, institute.adminName), Users],
        ["Admin Email", valueOrDash(institute.admin_email, institute.adminEmail, institute.email), Mail],
        ["Registration No", valueOrDash(institute.registration_no, institute.registrationNo), Hash],
        ["Tenant Domain", valueOrDash(institute.tenant_domain, institute.tenantDomain), Globe],
        ["Registered", displayDate(institute.created_at || institute.createdAt), Calendar],
      ],
    },
    {
      title: "AI",
      items: [
        ["AI Status", boolLabel(institute.ai_enabled ?? institute.aiEnabled), Sparkles],
        ["AI Features", enabledAiFeatures.length ? enabledAiFeatures.join(", ") : "-", Sparkles],
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-6">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to School Institutes
        </button>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-xl font-black text-indigo-700">
                {(institute.name || "S").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">{institute.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
                  <span>{[institute.city, institute.state].filter(Boolean).join(", ") || "Location not provided"}</span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[institute.status] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>
                    {institute.status || "ACTIVE"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {institute.status !== "ACTIVE" && (
                <button onClick={approve} className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100">
                  <CheckCircle className="h-4 w-4" /> Approve
                </button>
              )}
              {institute.status !== "SUSPENDED" && (
                <button onClick={reject} className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100">
                  <XCircle className="h-4 w-4" /> Suspend
                </button>
              )}
              <button onClick={remove} className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {summaryCards.map(({ label, value, icon: Icon, tone }) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveTab(label.toLowerCase() as TabId)}
                className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black tracking-tight">{value.toLocaleString()}</p>
              </button>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map(({ id: tabId, label, icon: Icon }) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => {
                    setActiveTab(tabId);
                    setSearch("");
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                    activeTab === tabId
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {activeTab !== "overview" && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Search ${activeTab}`}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            )}
          </div>

          <div className="p-5">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {overviewSections.map((section) => (
                  <section key={section.title}>
                    <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500">{section.title}</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {section.items.map(([label, value, Icon]) => (
                        <div key={String(label)} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            {Icon ? <Icon className="h-4 w-4" /> : null}
                            {label}
                          </div>
                          <p className="break-words text-sm font-bold capitalize text-slate-900">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {activeTab === "teachers" && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">Teacher</th>
                      <th className="px-5 py-3">Employee ID</th>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Classes</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {peopleLoading ? (
                      <EmptyRow label="Loading teachers..." colSpan={5} />
                    ) : filteredTeachers.length === 0 ? (
                      <EmptyRow label="No teachers found for this school." colSpan={5} />
                    ) : (
                      filteredTeachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-950">{teacher.name}</p>
                            <p className="text-xs font-semibold text-slate-500">{teacher.email || teacher.phone || "-"}</p>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-600">{teacher.teacherProfile?.employeeId || "-"}</td>
                          <td className="px-5 py-4 font-semibold text-slate-600">{teacher.teacherProfile?.department || teacher.teacherProfile?.role || "-"}</td>
                          <td className="px-5 py-4 font-semibold text-slate-600">{(teacher.classes || []).map((item: any) => item.name).join(", ") || "-"}</td>
                          <td className="px-5 py-4"><StatusPill active={!!teacher.isActive} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "students" && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Enrollment</th>
                      <th className="px-5 py-3">Class / Section</th>
                      <th className="px-5 py-3">Parent Contact</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {peopleLoading ? (
                      <EmptyRow label="Loading students..." colSpan={5} />
                    ) : filteredStudents.length === 0 ? (
                      <EmptyRow label="No students found for this school." colSpan={5} />
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-950">{student.name}</p>
                            <p className="text-xs font-semibold text-slate-500">{student.email || student.phone || "-"}</p>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-600">{student.studentProfile?.enrollmentNo || "-"}</td>
                          <td className="px-5 py-4 font-semibold text-slate-600">
                            {student.studentProfile?.section
                              ? `${student.studentProfile.section.class?.name || "-"} / ${student.studentProfile.section.name || "-"}`
                              : "-"}
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-600">
                            {student.studentProfile?.parentPhone || student.studentProfile?.parentEmail || "-"}
                          </td>
                          <td className="px-5 py-4"><StatusPill active={!!student.isActive} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "parents" && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">Parent</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Registered</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {peopleLoading ? (
                      <EmptyRow label="Loading parents..." colSpan={4} />
                    ) : filteredParents.length === 0 ? (
                      <EmptyRow label="No parents found for this school." colSpan={4} />
                    ) : (
                      filteredParents.map((parent) => (
                        <tr key={parent.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-950">{parent.name}</p>
                            <p className="text-xs font-semibold text-slate-500">{parent.role || "PARENT"}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-700">{parent.email || "-"}</p>
                            <p className="text-xs font-semibold text-slate-500">{parent.phone || "-"}</p>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-600">{displayDate(parent.createdAt || parent.created_at)}</td>
                          <td className="px-5 py-4"><StatusPill active={parent.is_active !== false && parent.isActive !== false} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailPage;
