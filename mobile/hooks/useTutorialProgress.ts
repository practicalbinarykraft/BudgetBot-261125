import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { showTutorialRewardToast } from "../lib/tutorial-toast-ref";

interface TutorialProgressData {
  steps: Array<{ stepId: string; completedAt: string }>;
  totalCreditsEarned: number;
  totalSteps: number;
  completedSteps: number;
}

export function useTutorialProgress() {
  const { data, isLoading } = useQuery<TutorialProgressData>({
    queryKey: ["tutorial"],
    queryFn: () => api.get<TutorialProgressData>("/api/tutorial"),
  });

  const completeMutation = useMutation({
    mutationFn: (stepId: string) =>
      api.post<{ alreadyCompleted: boolean; creditsAwarded: number }>(
        "/api/tutorial/complete-step",
        { stepId },
      ),
    onSuccess: (result) => {
      if (!result.alreadyCompleted && result.creditsAwarded > 0) {
        queryClient.invalidateQueries({ queryKey: ["credits"] });
        showTutorialRewardToast(result.creditsAwarded);
      }
      queryClient.invalidateQueries({ queryKey: ["tutorial"] });
    },
  });

  return {
    steps: data?.steps ?? [],
    totalSteps: data?.totalSteps ?? 8,
    completedSteps: data?.completedSteps ?? 0,
    totalCreditsEarned: data?.totalCreditsEarned ?? 0,
    isLoading,
    isStepCompleted: (stepId: string) =>
      (data?.steps ?? []).some((s) => s.stepId === stepId),
    completeStep: (stepId: string) => completeMutation.mutate(stepId),
  };
}
