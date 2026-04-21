import { apiClient, extractData } from "./client";

export interface InstituteCalendarEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate?: string;
  description?: string;
  color?: string;
  batchIds?: string[];
  createdAt?: string;
}

export interface LiveClassCalendarItem {
  id: string;
  kind: "live_class";
  title: string;
  date: string;
  scheduledAt: string;
  description?: string | null;
  type: "live_class";
  batchId: string;
  batchName?: string | null;
  topicName?: string | null;
  status: string;
  liveMeetingUrl?: string | null;
}

export interface CalendarFeedResponse {
  instituteEvents: InstituteCalendarEvent[];
  liveClasses: LiveClassCalendarItem[];
}

export async function getCalendarFeed(year?: number, month?: number): Promise<CalendarFeedResponse> {
  const q = new URLSearchParams();
  if (year != null) q.set("year", String(year));
  if (month != null) q.set("month", String(month));
  const qs = q.toString();
  const res = await apiClient.get(`/calendar/feed${qs ? `?${qs}` : ""}`);
  return extractData<CalendarFeedResponse>(res) ?? { instituteEvents: [], liveClasses: [] };
}

export interface CreateCalendarEventPayload {
  title: string;
  type: string;
  date: string;
  endDate?: string;
  description?: string;
  color?: string;
  batchIds?: string[];
}

export async function createCalendarEvent(payload: CreateCalendarEventPayload): Promise<InstituteCalendarEvent> {
  const res = await apiClient.post("/calendar/events", payload);
  return extractData<InstituteCalendarEvent>(res);
}

export async function deleteCalendarEvent(eventId: string): Promise<{ deleted: boolean }> {
  const res = await apiClient.delete(`/calendar/events/${eventId}`);
  return extractData(res);
}

export interface CalendarBatchOption {
  id: string;
  name: string;
}

export async function getCalendarBatches(): Promise<CalendarBatchOption[]> {
  const res = await apiClient.get('/calendar/batches');
  return extractData<CalendarBatchOption[]>(res) ?? [];
}
