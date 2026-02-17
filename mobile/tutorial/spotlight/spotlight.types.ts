export interface SpotlightFlowChoice {
  labelKey: string;
  navigateTo?: string;
  endFlow?: boolean;
}

export interface SpotlightFlowStep {
  targetId: string;
  tooltipKey: string;
  navigateTo?: string;
  navigateBefore?: string;
  autoAdvanceMs?: number;
  choices?: SpotlightFlowChoice[];
}

export interface SpotlightFlow {
  id: string;
  steps: SpotlightFlowStep[];
}
