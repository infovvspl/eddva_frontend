import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import AddStudentMultiStep from '@/components/school/admin/forms/AddStudentMultiStep';
import api from '@/lib/api/school-client';
import { notifyDataChanged } from '@/lib/school/apiData';
import { handleApiError } from '@/lib/school/errorHandler';
import { mapStudentFormToApi, mapStudentFormToApiUpdate } from '@/lib/school/onboardPayload';

export default function StudentRegistration() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;

    let mounted = true;
    async function fetchStudent() {
      setLoading(true);
      try {
        const res = await api.get(`/students/${id}`);
        const data = res.data?.data ?? res.data;
        if (mounted) setStudent(data);
      } catch (error) {
        handleApiError(error, 'Failed to load student details');
        navigate('/school/admin/students');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchStudent();
    return () => {
      mounted = false;
    };
  }, [id, isEditMode, navigate]);

  const goBack = () => navigate('/school/admin/students');

  const downloadCredentialSlip = (pdfBase64, studentName) => {
    const bytes = Uint8Array.from(window.atob(pdfBase64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(studentName || 'student').replace(/\s+/g, '-')}-login-credentials.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deliverStudentCredentials = async (studentId, channel, studentName) => {
    try {
      const res = await api.post(`/students/${studentId}/send-student-credentials`, { channel });
      const data = res.data?.data ?? res.data ?? {};
      if (channel === 'slip') {
        downloadCredentialSlip(data.pdfBase64, studentName);
        toast.success('Credential slip downloaded.');
        return;
      }
      if (data.sent) {
        toast.success(
          channel === 'parent_email'
            ? `Login details emailed to ${data.parentEmail}.`
            : `Login details emailed to ${data.studentEmail}.`
        );
      } else {
        toast.warning(`Student created, but the credentials email did not send${data.error ? `: ${data.error}` : '.'}`);
      }
    } catch (error) {
      toast.warning('Student created, but sending credentials failed — you can resend from their profile.');
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await api.put(`/students/${id}`, mapStudentFormToApiUpdate(formData));
        toast.success('Student updated successfully');
      } else {
        const res = await api.post('/students', mapStudentFormToApi(formData));
        const created = res.data?.data ?? res.data ?? {};
        toast.success('Student created successfully');

        const channel = formData.credentialDeliveryChannel;
        if (channel && channel !== 'skip' && created.id) {
          await deliverStudentCredentials(created.id, channel, created.name || formData.name);
        }
      }
      notifyDataChanged('students');
      goBack();
    } catch (error) {
      handleApiError(error, 'Failed to save student');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-1.5 py-1.5 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 sm:px-3 sm:py-2">
      <div className="flex w-full flex-col gap-2">
        {isEditMode && (
          <div className="flex rounded-[20px] border border-slate-200 bg-white/95 p-2.5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/85 sm:rounded-[24px] sm:p-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={goBack}
                className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:size-12"
                aria-label="Back to students"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 sm:text-[11px] sm:tracking-[0.22em]">
                  Edit Student
                </p>
                <h1 className="truncate font-display text-base sm:text-3xl font-black leading-tight text-slate-950 dark:text-white">
                  {student?.name || 'Edit Student Profile'}
                </h1>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none sm:rounded-[24px]">
          {loading ? (
            <div className="flex min-h-[520px] items-center justify-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
              <Loader2 className="size-5 animate-spin text-blue-600" />
              Loading student details...
            </div>
          ) : (
            <AddStudentMultiStep
              student={student}
              onSubmit={handleSubmit}
              onCancel={goBack}
              isLoading={isSubmitting}
              pageMode
            />
          )}
        </div>
      </div>
    </div>
  );
}
