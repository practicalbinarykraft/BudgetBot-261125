import { useState, useEffect, useCallback } from "react";
import { useTutorialProgress } from "./useTutorialProgress";

export type TutorialView = "welcome" | "checklist";

export function useTutorialDialog(userId: number | undefined) {
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<TutorialView>("welcome");
  const tutorial = useTutorialProgress();

  // Auto-show on first launch (0 completed steps)
  useEffect(() => {
    if (userId && tutorial.completedSteps === 0 && !tutorial.isLoading) {
      setVisible(true);
      setView("welcome");
    }
  }, [userId, tutorial.completedSteps, tutorial.isLoading]);

  // Manual open (from menu)
  const open = useCallback(() => {
    setView(tutorial.completedSteps > 0 ? "checklist" : "welcome");
    setVisible(true);
  }, [tutorial.completedSteps]);

  const dismiss = useCallback(() => setVisible(false), []);

  return { visible, view, setView, open, dismiss, tutorial };
}
