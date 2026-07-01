import { ArrowLeft, AlertCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import ResourceViewerModal from "@/components/resources/ResourceViewerModal";

export type CoachingResourcePageState = {
  title: string;
  content?: string;
  fileUrl?: string | null;
  externalUrl?: string | null;
  type: string;
  topicId?: string;
  resourceId?: string;
  isTeacher?: boolean;
};

export default function CoachingResourcePage() {
  const navigate = useNavigate();
  const resource = useLocation().state as CoachingResourcePageState | null;

  if (!resource) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle className="h-10 w-10 text-slate-300" />
        <p className="font-semibold text-slate-600">Open this material again from its course or content page.</p>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white">
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
      </div>
    );
  }

  return <ResourceViewerModal {...resource} isFullPage onClose={() => navigate(-1)} />;
}
