import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { learningApi, type ThreadView } from "@/lib/api/learning-path";

export const learningKeys = {
  home: ["learning", "home"] as const,
  threads: ["learning", "threads"] as const,
  thread: (id: string) => ["learning", "thread", id] as const,
  quiz: (instanceId: string) => ["learning", "quiz", instanceId] as const,
  engagement: ["learning", "engagement", "me"] as const,
};

/** Home summary + mind map. Polls while roadmaps are still being generated. */
export function useLearningHome() {
  return useQuery({
    queryKey: learningKeys.home,
    queryFn: learningApi.home,
    staleTime: 30_000,
    refetchInterval: (q) => (q.state.data?.roadmapsPending ? 10_000 : false),
  });
}

export function useLearningThreads() {
  return useQuery({ queryKey: learningKeys.threads, queryFn: learningApi.threads, staleTime: 15_000 });
}

/**
 * A thread's path and messages. The first page carries the path and resume
 * state; older messages load in pages with the cursor.
 */
export function useLearningThread(threadId: string | undefined) {
  return useInfiniteQuery({
    queryKey: learningKeys.thread(threadId ?? ""),
    queryFn: ({ pageParam }) => learningApi.thread(threadId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: ThreadView) => last.nextCursor ?? undefined,
    enabled: !!threadId,
    staleTime: 10_000,
  });
}

export function useOpenThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: learningApi.openThread,
    onSuccess: (view) => {
      qc.setQueryData(learningKeys.thread(view.thread.id), { pages: [view], pageParams: [undefined] });
      qc.invalidateQueries({ queryKey: learningKeys.threads });
      qc.invalidateQueries({ queryKey: learningKeys.home });
    },
  });
}

/** Refresh everything a thread change can affect. */
function useRefreshThread() {
  const qc = useQueryClient();
  return (threadId: string) => {
    qc.invalidateQueries({ queryKey: learningKeys.thread(threadId) });
    qc.invalidateQueries({ queryKey: learningKeys.threads });
  };
}

export function usePostThreadMessage(threadId: string) {
  const refresh = useRefreshThread();
  return useMutation({
    mutationFn: (input: string | { text: string; mode?: "chat" | "quiz" }) =>
      typeof input === "string" ? learningApi.postMessage(threadId, input) : learningApi.postMessage(threadId, input.text, input.mode),
    onSuccess: () => refresh(threadId),
  });
}

export function useOpenStep(threadId: string) {
  const refresh = useRefreshThread();
  return useMutation({
    mutationFn: ({ stepId, retake }: { stepId: string; retake?: boolean }) => learningApi.openStep(threadId, stepId, retake),
    onSuccess: () => refresh(threadId),
  });
}

export function useStepProgress(threadId: string) {
  const refresh = useRefreshThread();
  return useMutation({
    mutationFn: ({ stepId, ...body }: { stepId: string; watchedVideoIds?: string[]; videosDone?: boolean; notesDone?: boolean }) =>
      learningApi.stepProgress(threadId, stepId, body),
    onSuccess: () => refresh(threadId),
  });
}

export function useSubmitQuiz(threadId: string | null) {
  const qc = useQueryClient();
  const refresh = useRefreshThread();
  return useMutation({
    mutationFn: ({ instanceId, answers }: { instanceId: string; answers: Record<string, string> }) =>
      learningApi.submitQuiz(instanceId, answers),
    onSuccess: (result) => {
      qc.setQueryData(learningKeys.quiz(result.instanceId), result);
      if (threadId) refresh(threadId);
      qc.invalidateQueries({ queryKey: learningKeys.home });
    },
  });
}

export function useMyEngagement() {
  return useQuery({ queryKey: learningKeys.engagement, queryFn: learningApi.myEngagement, staleTime: 60_000 });
}
