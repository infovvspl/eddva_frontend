import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Building2, GraduationCap, Loader2 } from "lucide-react";
import { openErp } from "@/lib/erpSso";
import { EddvaLogo } from "@/components/branding/EddvaLogo";

interface LocationState {
  lmsPath?: string;
}

/**
 * Shown right after a school login, only when the institute has BOTH ERP
 * and LMS enabled (see redirectUser in LoginPage.tsx — a single-platform
 * institute skips this page entirely and goes straight in).
 */
export default function SelectModulePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lmsPath = "/school/admin" } = (location.state as LocationState) || {};
  const [openingErp, setOpeningErp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenErp = async () => {
    setError(null);
    setOpeningErp(true);
    try {
      await openErp("/dashboard");
      // openErp navigates the whole page away on success; nothing left to do here.
    } catch {
      setError("Could not open EDDVA ERP. Please try again.");
      setOpeningErp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="select-module-title"
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.45)]"
      >
        {/* Soft brand-color wash across the top of the card — light, not a dark backdrop. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-br from-[#008BE9]/10 via-purple-100/40 to-transparent" />

        <div className="relative px-8 pb-9 pt-9 text-center sm:px-10 sm:pt-10">
          <EddvaLogo className="mx-auto h-8 w-auto" />

          <h1 id="select-module-title" className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Where would you like to go?
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your institute has access to both EDDVA ERP and EDDVA LMS.
          </p>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <motion.button
            type="button"
            onClick={handleOpenErp}
            disabled={openingErp}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all hover:-translate-y-0.5 hover:border-[#008BE9]/40 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#008BE9]/10 text-[#008BE9] transition-transform group-hover:scale-110">
                <Building2 className="h-6 w-6" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#008BE9]" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900">EDDVA ERP</h2>
            <p className="mt-0.5 text-xs text-slate-500">School Administration</p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#008BE9] px-4 py-1.5 text-xs font-semibold text-white">
              {openingErp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Open ERP
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => navigate(lmsPath)}
            disabled={openingErp}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all hover:-translate-y-0.5 hover:border-purple-400/40 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 transition-transform group-hover:scale-110">
                <GraduationCap className="h-6 w-6" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-purple-600" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900">EDDVA LMS</h2>
            <p className="mt-0.5 text-xs text-slate-500">AI Learning Management</p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white">
              Open LMS
            </div>
          </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
