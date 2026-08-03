import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnrollmentGateProps {
  hasEnrollment: boolean;
  isLoading: boolean;
  children: ReactNode;
  message?: string;
  className?: string;
}

export function EnrollmentGate({
  hasEnrollment,
  isLoading,
  children,
  message = "No course selected — please go to Courses",
  className,
}: EnrollmentGateProps) {
  // If loading or already enrolled, render normally
  if (isLoading || hasEnrollment) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative w-full h-full min-h-[350px]", className)}>
      {/* Blurred background content */}
      <div className="w-full h-full blur-[4px] pointer-events-none select-none opacity-40">
        {children}
      </div>

      {/* Overlay lock message */}
      <div className="absolute inset-0 flex items-center justify-center p-4 bg-slate-50/10 z-[40]">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 p-8 text-center shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -mr-6 -mt-6 group-hover:bg-indigo-100/60 transition-colors" />
          <div className="relative">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight font-outfit">
              Access Restricted
            </h3>
            <p className="text-slate-500 mb-8 text-sm max-w-sm mx-auto leading-relaxed">
              {message}
            </p>
            <Link
              to="/student/learn"
              className="inline-flex w-full items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-sm"
            >
              Browse Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
