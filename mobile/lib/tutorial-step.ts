/**
 * Fire-and-forget helper for completing tutorial steps.
 * Can be called from any onSuccess callback without hook composition issues.
 */
import { api } from "./api-client";
import { queryClient } from "./query-client";
import { showTutorialRewardToast } from "./tutorial-toast-ref";

export async function completeTutorialStep(stepId: string): Promise<void> {
  try {
    const result = await api.post<{ alreadyCompleted: boolean; creditsAwarded: number }>(
      "/api/tutorial/complete-step",
      { stepId },
    );
    if (!result.alreadyCompleted && result.creditsAwarded > 0) {
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      queryClient.invalidateQueries({ queryKey: ["tutorial"] });
      showTutorialRewardToast(result.creditsAwarded);
    }
  } catch {
    // Silent fail — tutorial completion is non-critical
  }
}
