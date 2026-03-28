import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { removeStudentFromBatch } from "@/lib/api/teacher";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  studentId: string;
  studentName: string | null;
  onSuccess?: () => void;
}

export default function RemoveStudentDialog({
  open,
  onOpenChange,
  batchId,
  studentId,
  studentName,
  onSuccess,
}: Props) {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const expectedText = "REMOVE";
  const canSubmit = confirm === expectedText;

  async function handleRemove() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await removeStudentFromBatch(batchId, studentId);
      onSuccess?.();
      onOpenChange(false);
      setConfirm("");
    } catch {
      toast.error("Failed to remove student. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <UserMinus className="w-4 h-4" />
            Remove {studentName ?? "Student"} from Batch?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              This will permanently remove the student from this batch. They will lose access to all batch content.
            </span>
            <span className="block font-medium text-foreground">
              The student will be notified immediately.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2 space-y-1.5">
          <Label className="text-sm text-muted-foreground">
            Type <span className="font-mono font-bold text-foreground">REMOVE</span> to confirm
          </Label>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.toUpperCase())}
            placeholder="REMOVE"
            className="font-mono"
          />
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={!canSubmit || loading}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserMinus className="w-4 h-4 mr-2" />}
            Remove Student
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
