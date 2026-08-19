import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backPath?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

export const PageHeader = ({ title, subtitle, backPath, actions, icon }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-100 border border-blue-200/80 rounded-[2rem] p-4 sm:px-6 sm:py-5 shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 mb-6"
    >
      <div className="flex items-center gap-3">
        {backPath && (
          <button
            onClick={() => navigate(backPath)}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-slate-50 hover:scale-105 transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0 flex-1 pl-1 sm:pl-0">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight whitespace-nowrap truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm font-bold text-slate-500/80 mt-0.5 whitespace-nowrap truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto sm:justify-end shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
};
