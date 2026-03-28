import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import ProgressReportTree from "@/components/shared/ProgressReportTree";
import { Button } from "@/components/ui/button";

export default function AdminStudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  if (!studentId) {
    return <div className="p-8 text-center text-muted-foreground">No student ID provided.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Student Progress Report</h1>
          <p className="text-sm text-muted-foreground">Full subject → chapter → topic breakdown</p>
        </div>
      </div>

      <ProgressReportTree studentId={studentId} />
    </div>
  );
}
