import { Wrench, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export default function MaintenancePage() {
  const { clearAuth, user, platformName, supportEmail } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  // If tenant has default database seeder orange (#F97316), fallback to coaching portal theme blue
  const brandColor = user?.tenant?.brandColor && user.tenant.brandColor !== "#F97316"
    ? user.tenant.brandColor
    : "#2563eb"; 

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-6 relative overflow-hidden font-poppins">
      {/* Background Gradients & Soft Aura Blobs */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full blur-[120px] opacity-10" 
          style={{ backgroundColor: brandColor }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full blur-[120px] opacity-10" 
          style={{ backgroundColor: brandColor }}
        />
      </div>

      <div className="max-w-lg w-full text-center relative z-10 bg-white/80 border border-slate-200/60 rounded-[32px] p-8 md:p-12 backdrop-blur-xl shadow-xl">
        <div 
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-8 border transition-all"
          style={{ 
            backgroundColor: `${brandColor}12`, 
            borderColor: `${brandColor}25`,
            color: brandColor 
          }}
        >
          <Wrench className="w-10 h-10" />
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-slate-900 leading-tight">
          System Optimization in Progress
        </h1>

        <p className="text-slate-500 text-sm md:text-[15px] leading-relaxed mb-6 font-medium">
          We are currently performing scheduled maintenance to improve the speed, reliability, and security of {platformName}. Some features are temporarily locked.
        </p>

        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 mb-8 text-left flex gap-3 items-start max-w-sm mx-auto shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            If you are a system administrator, please log in as a super-admin to manage the platform settings and lift the maintenance status.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          {user && (
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:brightness-95 active:scale-95 transition-all shadow-md"
              style={{ backgroundColor: brandColor }}
            >
              Log Out / Switch User
            </button>
          )}
          <a
            href={`mailto:${supportEmail}`}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-8 py-3.5 rounded-2xl text-sm font-medium active:scale-95 transition-all shadow-sm"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
