import { useState, useEffect, useCallback, useRef } from "react";
import { useTutorialProgress } from "./useTutorialProgress";

export type TutorialView = "welcome" | "checklist" | "stepHelp";

export function useTutorialDialog(userId: number | undefined) {
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<TutorialView>("welcome");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const tutorial = useTutorialProgress();
  const autoShownRef = useRef(false);

  // Auto-show on first launch (0 completed steps), once per session
  useEffect(() => {
    if (userId && tutorial.completedSteps === 0 && !tutorial.isLoading && !autoShownRef.current) {
      autoShownRef.current = true;
      setVisible(true);
      setView("welcome");
    }
  }, [userId, tutorial.completedSteps, tutorial.isLoading]);

  // Manual open (from menu)
  const open = useCallback(() => {
    setView(tutorial.completedSteps > 0 ? "checklist" : "welcome");
    setSelectedStepId(null);
    setVisible(true);
  }, [tutorial.completedSteps]);

  const dismiss = useCallback(() => setVisible(false), []);

  const openStepHelp = useCallback((stepId: string) => {
    setSelectedStepId(stepId);
    setView("stepHelp");
  }, []);

  const backToChecklist = useCallback(() => {
    setSelectedStepId(null);
    setView("checklist");
  }, []);

  return { visible, view, setView, open, dismiss, tutorial, selectedStepId, openStepHelp, backToChecklist };
}
