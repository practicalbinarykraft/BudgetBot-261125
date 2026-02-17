import { InteractionManager } from "react-native";
import { showSpotlight, type SpotlightTarget } from "./spotlight-ref";

interface NavLike {
  navigate: (screen: string) => void;
  getState: () => { routes: { name: string }[]; index: number };
}

/**
 * Shows a legacy spotlight, ensuring the user is on Main/Dashboard first.
 * If the user is on a different screen, navigates to Main and waits for
 * interactions to settle before showing the spotlight.
 */
export function showSpotlightOnMain(navigation: NavLike, targetId: SpotlightTarget) {
  const state = navigation.getState();
  const currentRoute = state.routes[state.index]?.name;

  if (currentRoute !== "Main") {
    navigation.navigate("Main");
  }

  InteractionManager.runAfterInteractions(() => {
    showSpotlight(targetId);
  });
}
