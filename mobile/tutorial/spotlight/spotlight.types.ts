export interface SpotlightFlowStep {
  targetId: string;
  tooltipKey: string;
  navigateTo?: string;
  autoAdvanceMs?: number;
}

export interface SpotlightFlow {
  id: string;
  steps: SpotlightFlowStep[];
}
