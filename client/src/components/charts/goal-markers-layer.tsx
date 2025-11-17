import { ReferenceDot } from "recharts";
import { GoalTimelineMarker } from "@/components/budget/goal-timeline-marker";
import { NormalizedGoalMarker } from "@/lib/normalize-goal-markers";

interface TrendDataPoint {
  date: string;
  capital?: number | null;
}

interface GoalMarkersLayerProps {
  goals: NormalizedGoalMarker[];
  trendData: TrendDataPoint[];
  onGoalHover: (goalId: string, x: number, y: number) => void;
  onGoalLeave: () => void;
  onGoalClick: (status: string) => void;
}

function findCapitalValue(trendData: TrendDataPoint[], targetDate: string): number {
  const datePoint = trendData.find(d => d.date === targetDate || d.date.startsWith(targetDate));
  if (!datePoint) return 0;

  let yValue = datePoint.capital;
  if (yValue == null || yValue === 0) {
    const index = trendData.findIndex(d => d.date === datePoint.date);
    for (let i = index - 1; i >= 0; i--) {
      if (trendData[i].capital != null && trendData[i].capital !== 0) {
        yValue = trendData[i].capital;
        break;
      }
    }
    if (yValue == null) yValue = 0;
  }
  
  return yValue;
}

export function GoalMarkersLayer({
  goals,
  trendData,
  onGoalHover,
  onGoalLeave,
  onGoalClick,
}: GoalMarkersLayerProps) {
  return (
    <>
      {goals.map((goal) => {
        if (!goal.prediction?.affordableDate) return null;
        
        const targetDate = goal.prediction.affordableDate;
        const datePoint = trendData.find(d => 
          d.date === targetDate || d.date.startsWith(targetDate)
        );
        
        if (!datePoint) {
          console.warn(`Goal "${goal.name}" affordableDate ${targetDate} not found in trend data`);
          return null;
        }
        
        const yValue = findCapitalValue(trendData, targetDate);
        
        return (
          <ReferenceDot
            key={goal.id}
            x={datePoint.date}
            y={yValue}
            shape={(props) => (
              <g
                onMouseEnter={(e: React.MouseEvent) => {
                  onGoalHover(goal.id, e.clientX, e.clientY);
                }}
                onMouseMove={(e: React.MouseEvent) => {
                  onGoalHover(goal.id, e.clientX, e.clientY);
                }}
                onMouseLeave={onGoalLeave}
              >
                <GoalTimelineMarker
                  {...props}
                  priority={goal.priority}
                  onClick={() => onGoalClick(goal.status)}
                />
              </g>
            )}
          />
        );
      })}
    </>
  );
}
