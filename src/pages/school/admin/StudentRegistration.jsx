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

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await api.put(`/students/${id}`, mapStudentFormToApiUpdate(formData));
        toast.success('Student updated successfully');
      } else {
        await api.post('/students', mapStudentFormToApi(formData));
        toast.success('Student created successfully');
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
        <div className="flex rounded-[20px] border border-slate-200 bg-white/95 p-2.5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/85 sm:rounded-[24px] sm:p-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={goBack}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:h-12 sm:w-12"
              aria-label="Back to students"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 sm:text-[11px] sm:tracking-[0.22em]">
                {isEditMode ? 'Edit Student' : 'New Enrollment'}
              </p>
              <h1 className="truncate font-display text-base sm:text-3xl font-black leading-tight text-slate-950 dark:text-white">
                {isEditMode ? student?.name || 'Edit Student Profile' : 'Register New Student'}
              </h1>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none sm:rounded-[24px]">
          {loading ? (
            <div className="flex min-h-[520px] items-center justify-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
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
