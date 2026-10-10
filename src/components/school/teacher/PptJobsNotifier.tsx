import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useOnPptJobFinished, usePptJobs, type PptJob } from '@/lib/pptJobs';
import { pptStudioJobPath } from '@/pages/school/teacher/PptStudioPage';

/** Where a background deck opens: its studio page, resuming the job. */
export function pptJobOpenPath(job: PptJob): string {
  return pptStudioJobPath(job.pagePath || '/school/teacher/ppt-studio', job.jobId);
}

/** The studio page to try a failed deck again (the same scope, no job). */
export function pptJobRetryPath(job: PptJob): string {
  return job.pagePath || '/school/teacher/ppt-studio';
}

/**
 * Mounted beside the teacher layout: keeps the background-deck list polled
 * and says when a deck is ready - on whatever page the teacher is working.
 * Renders nothing.
 */
export default function PptJobsNotifier() {
  const navigate = useNavigate();
  usePptJobs();   // keep the shared poller running while a teacher page is open

  const onFinished = useCallback((job: PptJob) => {
    const what = job.title || job.topicName || job.topic || 'Your presentation';
    if (job.status === 'done') {
      toast.success(`Presentation ready: ${what}`, {
        description: job.slides ? `${job.slides} slides, generated in the background.` : undefined,
        duration: 15_000,
        action: { label: 'Open', onClick: () => navigate(pptJobOpenPath(job)) },
      });
    } else if (job.status === 'failed') {
      toast.error(`Presentation could not be generated: ${what}`, {
        description: job.error || 'Please try again.',
        duration: 15_000,
        action: { label: 'Try again', onClick: () => navigate(pptJobRetryPath(job)) },
      });
    }
  }, [navigate]);
  useOnPptJobFinished(onFinished);
  return null;
}
