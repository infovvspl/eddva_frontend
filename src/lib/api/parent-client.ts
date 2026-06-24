import { extractData } from './client';
import schoolApi from './school-client';

/**
 * Parent portal API client.
 *
 * IMPORTANT: the backend wraps every payload in an envelope
 * `{ data, message, statusCode }`. The shared axios instance does NOT unwrap
 * it, so each call must run the response through `extractData()` — the same
 * pattern the student/teacher/admin clients use. Returning `res.data` directly
 * (the old behaviour) leaked the envelope and broke every consumer.
 */

/** Centralised error logger so silent API failures become visible. */
function logParentApiError(label: string, url: string, error: unknown): never {
  const err = error as { response?: { status?: number; data?: unknown }; message?: string };
  console.error(`[ParentAPI] ${label} failed:`, {
    url,
    status: err.response?.status,
    data: err.response?.data,
    message: err.message,
  });
  throw error;
}

export const parentClient = {
  getProfile: () =>
    schoolApi.get('/parent/profile')
      .then(extractData)
      .catch((e) => logParentApiError('getProfile', '/school/parent/profile', e)),

  updateProfile: (data: unknown) =>
    schoolApi.put('/parent/profile', data)
      .then(extractData)
      .catch((e) => logParentApiError('updateProfile', '/school/parent/profile', e)),

  getChildren: () =>
    schoolApi.get('/parent/students')
      .then((res) => extractData<unknown[]>(res) ?? [])
      .catch((e) => logParentApiError('getChildren', '/school/parent/students', e)),

  getStudentSummary: (studentId: string) =>
    schoolApi.get(`/parent/students/${studentId}/summary`)
      .then(extractData)
      .catch((e) => logParentApiError('getStudentSummary', `/school/parent/students/${studentId}/summary`, e)),

  getAttendance: (studentId: string, month: string) =>
    schoolApi.get(`/parent/students/${studentId}/attendance?month=${month}`)
      .then(extractData)
      .catch((e) => logParentApiError('getAttendance', `/school/parent/students/${studentId}/attendance`, e)),

  submitLeaveRequest: (studentId: string, data: unknown) =>
    schoolApi.post(`/parent/students/${studentId}/leave-request`, data)
      .then(extractData)
      .catch((e) => logParentApiError('submitLeaveRequest', `/school/parent/students/${studentId}/leave-request`, e)),

  getMarks: (studentId: string, term?: string) =>
    schoolApi.get(`/parent/students/${studentId}/marks${term ? `?term=${term}` : ''}`)
      .then(extractData)
      .catch((e) => logParentApiError('getMarks', `/school/parent/students/${studentId}/marks`, e)),

  getHomework: (studentId: string, filter?: string) =>
    schoolApi.get(`/parent/students/${studentId}/homework${filter ? `?filter=${filter}` : ''}`)
      .then(extractData)
      .catch((e) => logParentApiError('getHomework', `/school/parent/students/${studentId}/homework`, e)),

  getTests: (studentId: string) =>
    schoolApi.get(`/parent/students/${studentId}/tests`)
      .then(extractData)
      .catch((e) => logParentApiError('getTests', `/school/parent/students/${studentId}/tests`, e)),

  getTeachers: () =>
    schoolApi.get('/parent/teachers')
      .then(extractData)
      .catch((e) => logParentApiError('getTeachers', '/school/parent/teachers', e)),

  getChatMessages: (teacherId: string) =>
    schoolApi.get(`/parent/chat/${teacherId}`)
      .then(extractData)
      .catch((e) => logParentApiError('getChatMessages', `/school/parent/chat/${teacherId}`, e)),

  sendMessage: (teacherId: string, message: string) =>
    schoolApi.post(`/parent/chat/${teacherId}`, { message })
      .then(extractData)
      .catch((e) => logParentApiError('sendMessage', `/school/parent/chat/${teacherId}`, e)),

  // ── Real-time direct messaging (shared /school/chat backend) ──────────────
  // Parents converse with school staff (teachers + admins) over the same chat
  // tables the admin Communications hub uses, so admin <-> parent is two-way.

  /** Staff a parent can message: teachers + institute admins, merged. */
  getChatContacts: () =>
    Promise.all([
      schoolApi.get('/chat/users', { params: { role: 'TEACHER' } }).then(extractData),
      schoolApi.get('/chat/users', { params: { role: 'INSTITUTE_ADMIN' } }).then(extractData),
      schoolApi.get('/chat/conversations', { params: { role: 'TEACHER' } }).then(extractData),
      schoolApi.get('/chat/conversations', { params: { role: 'INSTITUTE_ADMIN' } }).then(extractData),
    ])
      .then(([teachers, admins, teacherConvs, adminConvs]) => {
        const list = [
          ...(Array.isArray(teachers) ? teachers : []),
          ...(Array.isArray(admins) ? admins : []),
        ];
        const convs = [
          ...(Array.isArray(teacherConvs) ? teacherConvs : []),
          ...(Array.isArray(adminConvs) ? adminConvs : []),
        ];
        const convByPeer = new Map<string, any>();
        convs.forEach((c) => {
          if (c && c.peer_id) {
            convByPeer.set(c.peer_id, c);
          }
        });

        const seen = new Set<string>();
        return list
          .filter((u: { id: string }) => (seen.has(u.id) ? false : seen.add(u.id)))
          .map((u: any) => {
            const conv = convByPeer.get(u.id);
            return {
              ...u,
              lastMessage: conv?.last_message || '',
              unread: Number(conv?.unread_count || 0),
              time: conv?.created_at ? new Date(conv.created_at).toLocaleDateString() : '',
            };
          });
      })
      .catch((e) => logParentApiError('getChatContacts', '/school/chat/users', e)),

  getChatThread: (peerId: string) =>
    schoolApi.get(`/chat/messages/${peerId}`)
      .then((res) => extractData<unknown[]>(res) ?? [])
      .catch((e) => logParentApiError('getChatThread', `/school/chat/messages/${peerId}`, e)),

  sendChatMessage: (peerId: string, content: string) =>
    schoolApi.post('/chat/messages', { receiverId: peerId, content })
      .then(extractData)
      .catch((e) => logParentApiError('sendChatMessage', '/school/chat/messages', e)),

  markChatRead: (peerId: string) =>
    schoolApi.patch(`/chat/messages/${peerId}/read`)
      .then(extractData)
      .catch((e) => logParentApiError('markChatRead', `/school/chat/messages/${peerId}/read`, e)),

  getMeetingRequests: () =>
    schoolApi.get('/parent/meeting-requests')
      .then(extractData)
      .catch((e) => logParentApiError('getMeetingRequests', '/school/parent/meeting-requests', e)),

  createMeetingRequest: (data: unknown) =>
    schoolApi.post('/parent/meeting-requests', data)
      .then(extractData)
      .catch((e) => logParentApiError('createMeetingRequest', '/school/parent/meeting-requests', e)),

  cancelMeetingRequest: (id: string) =>
    schoolApi.delete(`/parent/meeting-requests/${id}`)
      .then(extractData)
      .catch((e) => logParentApiError('cancelMeetingRequest', `/school/parent/meeting-requests/${id}`, e)),

  getGrievances: (search?: string) =>
    schoolApi.get('/parent/grievances', search ? { params: { search } } : undefined)
      .then(extractData)
      .catch((e) => logParentApiError('getGrievances', '/school/parent/grievances', e)),

  submitGrievance: (data: unknown) =>
    schoolApi.post('/parent/grievances', data)
      .then(extractData)
      .catch((e) => logParentApiError('submitGrievance', '/school/parent/grievances', e)),

  reopenGrievance: (id: string) =>
    schoolApi.put(`/parent/grievances/${id}/reopen`)
      .then(extractData)
      .catch((e) => logParentApiError('reopenGrievance', `/school/parent/grievances/${id}/reopen`, e)),

  getGrievanceMessages: (id: string) =>
    schoolApi.get(`/grievances/${id}/messages`)
      .then((res) => extractData<unknown[]>(res) ?? [])
      .catch((e) => logParentApiError('getGrievanceMessages', `/school/grievances/${id}/messages`, e)),

  getNotifications: (filter?: string) =>
    schoolApi.get(`/parent/notifications${filter ? `?filter=${filter}` : ''}`)
      .then((res) => extractData<unknown[]>(res) ?? [])
      .catch((e) => logParentApiError('getNotifications', '/school/parent/notifications', e)),

  markNotificationsRead: () =>
    schoolApi.put('/parent/notifications/read')
      .then(extractData)
      .catch((e) => logParentApiError('markNotificationsRead', '/school/parent/notifications/read', e)),
};
