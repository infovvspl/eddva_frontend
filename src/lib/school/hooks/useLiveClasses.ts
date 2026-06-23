import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/client';
import schoolApi, { unwrapSchoolList } from '@/lib/api/school-client';

export interface BaseLiveClass {
  lectureId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}

export interface RunningLiveClass extends BaseLiveClass {
  studentCount: number;
  startedAt: string;
  status: 'live';
}

export interface UpcomingLiveClass extends BaseLiveClass {
  scheduledAt: string;
  status: 'scheduled';
}

export interface CompletedLiveClass extends BaseLiveClass {
  endedAt: string;
  duration: number;
  status: 'completed';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function useRunningLiveClasses(page = 1, limit = 20, enabled = true) {
  return useQuery<PaginatedResponse<RunningLiveClass>>({
    queryKey: ['live-classes', 'running', page, limit],
    queryFn: async () => {
      const res = await api.get(`/live-class/running`, { params: { page, limit } });
      return res.data?.data || res.data;
    },
    enabled,
  });
}

export function useUpcomingLiveClasses(page = 1, limit = 20, enabled = true) {
  return useQuery<PaginatedResponse<UpcomingLiveClass>>({
    queryKey: ['live-classes', 'upcoming', page, limit],
    queryFn: async () => {
      const res = await api.get(`/live-class/upcoming`, { params: { page, limit } });
      return res.data?.data || res.data;
    },
    enabled,
  });
}

export function useCompletedLiveClasses(page = 1, limit = 20, enabled = true) {
  return useQuery<PaginatedResponse<CompletedLiveClass>>({
    queryKey: ['live-classes', 'completed', page, limit],
    queryFn: async () => {
      const res = await api.get(`/live-class/completed`, { params: { page, limit } });
      return res.data?.data || res.data;
    },
    enabled,
  });
}

export interface RecordedClass {
  recordingId: string;
  title: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  duration: number;
  recordingUrl: string;
  thumbnailUrl?: string;
  recordedAt: string;
}

export interface RecordedClassesFilters {
  page?: number;
  limit?: number;
  search?: string;
  teacherId?: string;
  classId?: string;
  subjectId?: string;
  startDate?: string;
  endDate?: string;
}



export function useRecordedClasses(filters: RecordedClassesFilters = { page: 1, limit: 20 }, enabled = true) {
  return useQuery<PaginatedResponse<RecordedClass>>({
    queryKey: ['live-classes', 'recordings', filters],
    queryFn: async () => {
      // Fetch all recordings from the school class_recordings table (same source as Teacher UI)
      const res = await schoolApi.get(`/classes/recordings`, { 
        params: {
          classId: filters.classId,
          subjectId: filters.subjectId,
          // teacherId is handled by local filtering below
        }
      });
      
      const rawData = unwrapSchoolList(res) as any[];
      
      // Filter the data locally since the backend doesn't support all Admin filters natively yet
      let filtered = rawData;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        filtered = filtered.filter((r) => 
          r.title?.toLowerCase().includes(s) || 
          r.teacher_name?.toLowerCase().includes(s) ||
          r.subject_name?.toLowerCase().includes(s)
        );
      }
      if (filters.teacherId) {
        filtered = filtered.filter(r => r.teacher_user_id === filters.teacherId);
      }
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        filtered = filtered.filter(r => new Date(r.recorded_date || r.created_at).getTime() >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime();
        filtered = filtered.filter(r => new Date(r.recorded_date || r.created_at).getTime() <= end);
      }

      // Map to the expected RecordedClass interface
      const items = filtered.map(r => ({
        recordingId: r.id,
        title: r.title || 'Recorded Class',
        teacherId: r.teacher_user_id || '',
        teacherName: r.teacher_name || 'Unknown Teacher',
        classId: r.class_id || '',
        className: r.class_name || '',
        sectionId: r.section_id || '',
        sectionName: r.section_name || '',
        subjectId: r.subject_id || '',
        subjectName: r.subject_name || '',
        duration: parseInt(r.duration || '0', 10),
        recordingUrl: r.video_url || '',
        thumbnailUrl: r.thumbnail_url || undefined,
        recordedAt: r.recorded_date || r.created_at || new Date().toISOString(),
      }));

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedItems = items.slice(startIndex, startIndex + limit);

      return {
        items: paginatedItems,
        total: items.length,
        page,
        limit,
      };
    },
    enabled,
  });
}
