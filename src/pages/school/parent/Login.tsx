import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as authApi from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth-store";
import { EddvaLogo } from "@/components/branding/EddvaLogo";
import { getSubdomain } from "@/lib/tenant";
import { resolveTenant, PublicTenantInfo } from "@/lib/api/public-tenant";

export default function ParentLogin() {
  const navigate = useNavigate();
  const { setUser, setTenantType } = useAuthStore();
  const [tenantInfo, setTenantInfo] = useState<PublicTenantInfo | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    let strictSubdomain = null;

    if (parts.length === 2 && parts[1] === "localhost") {
      strictSubdomain = parts[0];
    } else if (parts.length >= 3 && !["localhost", "edva.in", "www"].includes(parts[0])) {
      strictSubdomain = parts[0];
    }

    if (strictSubdomain) {
      resolveTenant(strictSubdomain).then(setTenantInfo).catch(console.error);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setError("");
    setLoading(true);

    try {
      const isEmail = identifier.includes("@");
      const rawPhone = identifier.trim().replace(/[^\d+]/g, "");
      const formattedPhone = rawPhone.startsWith("+") ? rawPhone : `+91${rawPhone}`;

      const payload = isEmail
        ? { email: identifier.trim(), password }
        : { phone: formattedPhone, password };

      const res = await authApi.loginSchoolWithPassword(payload);

      const userToStore = {
        id: res.user.id,
        name: res.user.name,
        phone: res.user.phone ?? "",
        email: res.user.email,
        role: "PARENT" as const, // Force parent role for this portal
        avatar: res.user.photo ?? undefined,
        tenantId: res.user.instituteId ?? undefined,
        tenantName: res.institute?.name ?? undefined,
        isFirstLogin: false,
        onboardingRequired: false,
        teacherProfile: null,
        studentProfile: null,
      };

      setTenantType("school");
      setUser(userToStore);
      navigate("/school/parent/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-14 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[15px] font-semibold text-slate-800 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 shadow-sm";

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 px-4 py-12 font-sans sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"
      >
        <div className="flex flex-col items-center text-center">
          {tenantInfo?.logoUrl ? (
            <img src={tenantInfo.logoUrl} alt={tenantInfo.name} className="h-12 object-contain mb-6" />
          ) : (
            <EddvaLogo className="mb-6 h-8" />
          )}
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Parent Portal</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Sign in to monitor your child</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 overflow-hidden rounded-xl border border-red-100 bg-red-50 p-4"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm font-medium leading-tight text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="ml-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                <Mail className="h-3.5 w-3.5" /> Email or Phone
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={inputClass}
                placeholder="Enter email or phone number"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="ml-1 flex items-center justify-between">
                <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                  <Lock className="h-3.5 w-3.5" /> Password
                </label>
                <a href="#" className="text-[11px] font-black tracking-wider text-blue-600 uppercase hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading || !identifier || !password}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-blue-600 text-[16px] font-black text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
          </motion.button>
        </form>

        <p className="text-center text-sm font-semibold text-slate-500">
          Having trouble? <span className="font-bold text-slate-700">Contact school admin</span>
        </p>
      </motion.div>
    </div>
  );
}
