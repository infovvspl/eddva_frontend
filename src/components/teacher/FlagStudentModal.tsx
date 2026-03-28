import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { flagStudent, type FlagReason } from "@/lib/api/teacher";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  studentId: string;
  studentName: string | null;
  onSuccess?: () => void;
}

const REASONS: { value: FlagReason; label: string; description: string }[] = [
  {
    value: "missed_classes",
    label: "Missed Classes",
    description: "Student has not been watching lectures regularly",
  },
  {
    value: "score_drop",
    label: "Score Drop",
    description: "Recent test scores have dropped significantly",
  },
  {
    value: "not_engaging",
    label: "Not Engaging",
    description: "Low engagement — rewinding often, idle, or not attempting quizzes",
  },
];

export default function FlagStudentModal({
  open,
  onOpenChange,
  batchId,
  studentId,
  studentName,
  onSuccess,
}: Props) {
  const [reason, setReason] = useState<FlagReason>("missed_classes");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      const result = await flagStudent(batchId, studentId, { reason, note: note.trim() || undefined });
      onSuccess?.();
      onOpenChange(false);
      setNote("");

      // Show what was triggered
      const details = [
        "Student notified in-app",
        result.parentNotified ? "Parent notified via WhatsApp" : null,
        result.adminsNotified > 0 ? `${result.adminsNotified} admin(s) notified` : null,
      ].filter(Boolean).join(" · ");

      toast.success("Student flagged", { description: details });
    } catch {
      toast.error("Failed to flag student. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-orange-400" />
            Flag {studentName ?? "Student"}
          </DialogTitle>
          <DialogDescription>
            Select a reason. This will automatically alert the student, their parent (WhatsApp), and admins.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <RadioGroup value={reason} onValueChange={(v) => setReason(v as FlagReason)} className="space-y-3">
            {REASONS.map((r) => (
              <label
                key={r.value}
                htmlFor={r.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${reason === r.value
                    ? "border-orange-500/60 bg-orange-500/10"
                    : "border-border hover:border-border/80 hover:bg-muted/30"
                  }`}
              >
                <RadioGroupItem value={r.value} id={r.value} className="mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-foreground">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Additional note (optional)</Label>
            <Textarea
              placeholder="Add a personal note for the student or parent..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={300}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{note.length}/300</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Flag className="w-4 h-4 mr-2" />}
            Send Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
