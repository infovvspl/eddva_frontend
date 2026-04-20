import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as calendarApi from "@/lib/api/calendar";

export const calendarKeys = {
  feed: (year: number, month: number) => ["calendar", "feed", year, month] as const,
};

export function useCalendarFeed(year: number, month: number) {
  return useQuery({
    queryKey: calendarKeys.feed(year, month),
    queryFn: () => calendarApi.getCalendarFeed(year, month),
    staleTime: 30_000,
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.createCalendarEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
      qc.invalidateQueries({ queryKey: ["institute", "settings", "calendar"] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.deleteCalendarEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
      qc.invalidateQueries({ queryKey: ["institute", "settings", "calendar"] });
    },
  });
}
