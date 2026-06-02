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

  getGrievances: () =>
    schoolApi.get('/parent/grievances')
      .then(extractData)
      .catch((e) => logParentApiError('getGrievances', '/school/parent/grievances', e)),

  submitGrievance: (data: unknown) =>
    schoolApi.post('/parent/grievances', data)
      .then(extractData)
      .catch((e) => logParentApiError('submitGrievance', '/school/parent/grievances', e)),

  getNotifications: (filter?: string) =>
    schoolApi.get(`/parent/notifications${filter ? `?filter=${filter}` : ''}`)
      .then((res) => extractData<unknown[]>(res) ?? [])
      .catch((e) => logParentApiError('getNotifications', '/school/parent/notifications', e)),

  markNotificationsRead: () =>
    schoolApi.put('/parent/notifications/read')
      .then(extractData)
      .catch((e) => logParentApiError('markNotificationsRead', '/school/parent/notifications/read', e)),
};
