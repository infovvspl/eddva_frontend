import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

const CreateSchoolPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    instituteName: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    website: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.instituteName || !form.name || !form.email || !form.password) {
      toast.error("Institute name, admin name, email and password are required");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/school/auth/register", form);
      toast.success("School institute registered — status: PENDING approval");
      navigate("/super-admin/school");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, type = "text", required = false }: {
    label: string; field: keyof typeof form; type?: string; required?: boolean
  }) => (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[field]}
        onChange={set(field)}
        required={required}
        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate("/super-admin/school")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to School Institutes
        </button>

        <div className="border border-slate-100 rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Register School</h1>
          <p className="text-slate-400 text-sm mb-6">Creates the institute and a default admin account (status: PENDING).</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Institute Name" field="instituteName" required />
              <Field label="Admin Full Name" field="name" required />
              <Field label="Admin Email" field="email" type="email" required />
              <Field label="Password" field="password" type="password" required />
              <Field label="Phone" field="phone" />
              <Field label="City" field="city" />
              <Field label="State" field="state" />
              <Field label="Pincode" field="pinCode" />
            </div>
            <Field label="Address" field="address" />
            <Field label="Website" field="website" />

            <div className="pt-2">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 h-11 px-8 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Registering…</> : "Register School Institute"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSchoolPage;
