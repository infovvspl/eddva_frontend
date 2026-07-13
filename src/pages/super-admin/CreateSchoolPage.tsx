import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Eye, EyeOff, ImagePlus, Loader2, UploadCloud, XCircle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import schoolApi from "@/lib/api/school-client";
import { toast } from "sonner";
import { AI_FEATURES } from "@/lib/constants/aiFeatures";
import { CustomSelect } from "@/components/ui/CustomSelect";

const inputClass =
  "w-full rounded-lg border border-surface-200 bg-surface-50 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-medium text-surface-950 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100";

const emptyForm = {
  instituteName: "",
  principalName: "",
  registrationNo: "",
  email: "",
  phone: "",
  alternatePhone: "",
  adminPassword: "",
  plotNo: "",
  streetName: "",
  landMark: "",
  city: "",
  district: "",
  state: "",
  pinCode: "",
  website: "",
  tenantDomain: "",
  schoolType: "",
  board: "",
  establishedYear: "",
  affiliationNo: "",
  totalClasses: "",
  totalStudents: "",
  totalTeachers: "",
  logo: "",
  aiEnabled: false,
  aiFeatures: {
    ai_doubt_solver: true,
    ai_notes_generator: true,
    ai_quiz_generator: true,
    ai_study_planner: false,
    ai_homework_checker: false,
    ai_attendance_insights: false,
    ai_parent_reports: false,
    ai_content_recommend: false,
  },
};

function readLogoFile(file?: File) {
  return new Promise<string | null>((resolve, reject) => {
    if (!file) return resolve(null);
    if (!file.type.startsWith("image/")) return reject(new Error("Please upload an image file."));
    if (file.size > 2 * 1024 * 1024) return reject(new Error("Logo must be smaller than 2MB."));

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Logo could not be read."));
    reader.readAsDataURL(file);
  });
}

const Toggle = ({ enabled, onChange, size = "md" }: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  size?: "sm" | "md";
}) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex shrink-0 items-center rounded-full transition-colors ${size === "sm" ? "h-4 w-8" : "h-6 w-11"} ${enabled ? "bg-blue-600" : "bg-surface-200"}`}
  >
    <span className={`inline-block rounded-full bg-white shadow transition-transform ${size === "sm" ? "h-3 w-3" : "h-4 w-4"} ${enabled ? (size === "sm" ? "translate-x-4" : "translate-x-6") : "translate-x-1"}`} />
  </button>
);

const CreateSchoolPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const isSchoolAdminRoute = location.pathname.startsWith("/school/admin") || location.pathname.startsWith("/school/super-admin");
  const backPath = isSchoolAdminRoute 
    ? (location.pathname.startsWith("/school/super-admin") ? "/school/super-admin/institutes" : "/school/admin/institutes")
    : "/super-admin/school";
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    async function loadInstitute() {
      setLoading(true);
      try {
        const res = await schoolApi.get(`/institutes/${id}`);
        const data = (res.data as any)?.data || res.data;
        if (!mounted) return;
        setForm({
          ...emptyForm,
          instituteName: data?.name || data?.instituteName || "",
          principalName: data?.principalName || data?.principal_name || data?.adminName || "",
          registrationNo: data?.registrationNo || data?.registration_no || "",
          email: data?.email || data?.adminEmail || data?.admin_email || "",
          phone: data?.phone || "",
          alternatePhone: data?.alternatePhone || data?.alternate_phone || "",
          plotNo: data?.plotNo || data?.plot_no || "",
          streetName: data?.streetName || data?.street_name || "",
          landMark: data?.landMark || data?.land_mark || "",
          city: data?.city || "",
          district: data?.district || "",
          state: data?.state || "",
          pinCode: data?.pinCode || data?.pin_code || "",
          website: data?.website || "",
          tenantDomain: data?.tenantDomain || data?.tenant_domain || "",
          schoolType: data?.schoolType || data?.school_type || "",
          board: data?.board || "",
          establishedYear: data?.establishedYear || data?.established_year || "",
          affiliationNo: data?.affiliationNo || data?.affiliation_no || "",
          totalClasses: data?.totalClasses || data?.total_classes || "",
          totalStudents: data?.totalStudents || data?.total_students || "",
          totalTeachers: data?.totalTeachers || data?.total_teachers || "",
          logo: data?.logo || "",
          aiEnabled: data?.aiEnabled ?? data?.ai_enabled ?? false,
          aiFeatures: data?.aiFeatures || data?.ai_features || { ...emptyForm.aiFeatures },
          adminPassword: "",
        });
      } catch (err: any) {
        const message = err.response?.data?.message || err.response?.data?.error || "Unable to load school.";
        setError(message);
        toast.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInstitute();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const logo = await readLogoFile(event.target.files?.[0]);
      update("logo", logo || "");
      setError("");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!form.instituteName || !form.principalName || !form.email) {
      setError("School name, principal name, and admin email are required.");
      return;
    }
    if (!isEditMode && !form.adminPassword) {
      setError("Temporary password is required.");
      return;
    }
    if (form.adminPassword && form.adminPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!isEditMode && form.adminPassword !== confirmPassword) {
      setError("Passwords do not match. Please check and try again.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        instituteName: form.instituteName,
        name: form.principalName,
        principalName: form.principalName,
        adminName: form.principalName,
        adminEmail: form.email,
        email: form.email,
        adminPassword: form.adminPassword || undefined,
        password: form.adminPassword || undefined,
        tenantDomain: form.tenantDomain,
        tenant_domain: form.tenantDomain,
        phone: form.phone,
        alternatePhone: form.alternatePhone,
        registrationNo: form.registrationNo,
        plotNo: form.plotNo,
        streetName: form.streetName,
        landMark: form.landMark,
        city: form.city,
        district: form.district,
        state: form.state,
        pinCode: form.pinCode,
        website: form.website,
        logo: form.logo,
        schoolType: form.schoolType,
        board: form.board,
        establishedYear: form.establishedYear,
        affiliationNo: form.affiliationNo,
        totalClasses: form.totalClasses,
        totalStudents: form.totalStudents,
        totalTeachers: form.totalTeachers,
        aiEnabled: form.aiEnabled,
        aiFeatures: form.aiFeatures,
      };

      if (isEditMode) {
        await schoolApi.put(`/institutes/${id}`, {
          ...payload,
          name: form.instituteName,
        });
        toast.success("School updated successfully");
        navigate(backPath);
        return;
      }

      const res = await apiClient.post("/school/auth/register", {
        name: form.principalName,
        ...payload,
      });

      let newInstitute = (res.data as any)?.institute || (res.data as any)?.data || res.data;
      if (Array.isArray(newInstitute)) newInstitute = newInstitute[0];
      if (newInstitute?.id) {
        await schoolApi.put(`/institutes/${newInstitute.id}/approve`).catch(() => undefined);
      }

      toast.success("School created successfully");
      navigate(backPath);
    } catch (err: any) {
      const rawMsg = err.response?.data?.message || err.response?.data?.error || "";
      let friendlyMsg = "Unable to create school. Please try again.";
      if (rawMsg.includes("tenant_domain") || rawMsg.includes("tenantDomain") || rawMsg.includes("subdomain")) {
        friendlyMsg = "This subdomain / tenant domain is already taken. Please choose a different one.";
      } else if (rawMsg.includes("email") && rawMsg.includes("duplicate")) {
        friendlyMsg = "A school with this email already exists. Please use a different email.";
      } else if (rawMsg) {
        friendlyMsg = rawMsg;
      }
      setError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="w-full p-3 sm:p-6 md:p-8">
      <div className="w-full space-y-6">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to School Management
        </button>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-surface-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
          <div className="border-b border-surface-200 p-4 sm:p-5">
            <h1 className="font-display text-xl sm:text-2xl font-black text-surface-950">{isEditMode ? "Edit School" : "Create School"}</h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-surface-500">
              {isEditMode ? "Update school details, admin contact, and AI access." : "Onboard a school and create its first admin account."}
            </p>
          </div>

          {error && <div className="mx-4 sm:mx-5 mt-4 sm:mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[180px_1fr]">
            <div>
              <div className="flex flex-row lg:flex-col items-center justify-center gap-4 lg:gap-3 rounded-lg border border-surface-200 bg-surface-50 p-4 sm:p-5 text-center w-full">
                <div className="grid h-16 w-16 lg:h-24 lg:w-24 place-items-center overflow-hidden rounded-2xl bg-white text-xl lg:text-2xl font-black text-brand-700 shadow-sm shrink-0">
                  {form.logo ? <img src={form.logo} alt="School logo" className="h-full w-full object-cover" /> : (form.instituteName || "S").slice(0, 1)}
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-brand-700 shadow-sm border border-slate-200">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                  <ImagePlus className="h-4 w-4" />
                  Logo
                </label>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <input required className={inputClass} value={form.instituteName} onChange={(e) => update("instituteName", e.target.value)} placeholder="School name" />
                <div className="relative">
                  <input required className={`${inputClass} pr-24`} value={form.tenantDomain} onChange={(e) => update("tenantDomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="Subdomain" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">.localhost</span>
                </div>
                <CustomSelect
                  value={form.schoolType}
                  onChange={(val) => update("schoolType", val)}
                  options={[
                  { value: "", label: "Select School Type" },
                  { value: "Primary", label: "Primary" },
                  { value: "Secondary", label: "Secondary" },
                  { value: "Senior Secondary", label: "Senior Secondary" },
                  { value: "K-12", label: "K-12" },
                ]}
                  className="w-full"
                />
                <CustomSelect
                  value={form.board}
                  onChange={(val) => update("board", val)}
                  options={[
                  { value: "", label: "Select Board" },
                  { value: "CBSE", label: "CBSE" },
                  { value: "ICSE", label: "ICSE" },
                  { value: "State Board", label: "State Board" },
                  { value: "IB", label: "IB" },
                ]}
                  className="w-full"
                />
                <input className={inputClass} type="number" value={form.establishedYear} onChange={(e) => update("establishedYear", e.target.value)} placeholder="Established year" />
                <input className={inputClass} value={form.affiliationNo} onChange={(e) => update("affiliationNo", e.target.value)} placeholder="Affiliation no." />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input required className={inputClass} value={form.principalName} onChange={(e) => update("principalName", e.target.value)} placeholder="Principal / admin name" />
                <input required className={inputClass} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Admin email" />
                <div className="relative">
                  <input required={!isEditMode} type={showPassword ? "text" : "password"} value={form.adminPassword} onChange={(e) => update("adminPassword", e.target.value)} placeholder={isEditMode ? "Reset admin password" : "Temporary password"} className={`${inputClass} pr-10`} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!isEditMode && (
                  <div className="relative">
                    <input required type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className={`${inputClass} pr-10 ${confirmPassword ? form.adminPassword === confirmPassword ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100" : "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`} />
                    <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                )}
                {!isEditMode && confirmPassword && (
                  <p className={`-mt-2 flex items-center gap-1.5 text-xs font-semibold sm:col-span-2 ${form.adminPassword === confirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                    {form.adminPassword === confirmPassword ? <><CheckCircle className="h-3.5 w-3.5" /> Passwords match</> : <><XCircle className="h-3.5 w-3.5" /> Passwords do not match</>}
                  </p>
                )}
                <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone" />
                <input className={inputClass} value={form.registrationNo} onChange={(e) => update("registrationNo", e.target.value)} placeholder="Registration no. / UDISE code" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input className={inputClass} value={form.plotNo} onChange={(e) => update("plotNo", e.target.value)} placeholder="Plot no." />
                <input className={inputClass} value={form.streetName} onChange={(e) => update("streetName", e.target.value)} placeholder="Street name" />
                <input className={inputClass} value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City" />
                <input className={inputClass} value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="District" />
                <input className={inputClass} value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="State" />
                <input className={inputClass} value={form.pinCode} onChange={(e) => update("pinCode", e.target.value)} placeholder="PIN Code" />
                <input className={inputClass} value={form.totalClasses} onChange={(e) => update("totalClasses", e.target.value)} placeholder="Total classes (e.g. 1-10)" />
                <input className={inputClass} type="number" value={form.totalStudents} onChange={(e) => update("totalStudents", e.target.value)} placeholder="Total students (approx)" />
                <input className={inputClass} type="number" value={form.totalTeachers} onChange={(e) => update("totalTeachers", e.target.value)} placeholder="Total teachers (approx)" />
                <input className={inputClass} value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="Website" />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-200 bg-brand-50 p-3 sm:p-4 text-xs sm:text-sm font-semibold text-brand-700">
                <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                <UploadCloud className="h-5 w-5" />
                Upload or replace logo
              </label>

              <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-sm font-bold text-surface-950">AI Features</h3>
                    <p className="text-xs text-surface-500">Control which AI features this school can access</p>
                  </div>
                  <Toggle enabled={form.aiEnabled} onChange={(value) => update("aiEnabled", value)} />
                </div>

                {form.aiEnabled && (
                  <div className="mt-2 space-y-2 border-t border-surface-200 pt-4">
                    {AI_FEATURES.map((feature) => (
                      <div key={feature.key} className="flex items-center justify-between gap-4 py-2">
                        <div>
                          <p className={`text-sm font-medium ${form.aiFeatures?.[feature.key] ? "text-surface-800" : "text-surface-400"}`}>{feature.label}</p>
                          <p className="text-xs text-surface-400">{feature.description}</p>
                        </div>
                        <Toggle
                          enabled={!!form.aiFeatures?.[feature.key]}
                          onChange={(value) => update("aiFeatures", { ...form.aiFeatures, [feature.key]: value })}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 border-t border-surface-200 bg-surface-50 p-4 sm:p-5">
            <button type="button" onClick={() => navigate(backPath)} className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-bold text-surface-700 hover:bg-surface-100">
              Cancel
            </button>
            <button disabled={saving} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-indigo-700 disabled:opacity-60">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : isEditMode ? "Save Changes" : "Create and Approve"}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default CreateSchoolPage;
