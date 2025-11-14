import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Trophy, Target, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface TrainingStats {
  totalExamples: number;
  accuracy: number;
  level: number;
  levelName: string;
  nextLevelAt: number;
}

export function TrainingHeader() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();

  const { data: stats } = useQuery<TrainingStats>({
    queryKey: ['/api/ai/training-stats'],
    enabled: !!user,
  });

  if (!stats) return null;

  return (
    <div className="w-full max-w-lg mx-auto mb-6" data-testid="training-header">
      <Button
        variant="outline"
        className="w-full justify-between h-auto py-3"
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="button-toggle-training-stats"
      >
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-primary" />
          <div className="text-left">
            <div className="font-semibold">AI Training Progress</div>
            <div className="text-sm text-muted-foreground">
              Level {stats.level} • {stats.levelName}
            </div>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </Button>

      {isExpanded && (
        <div className="mt-3 p-4 rounded-lg bg-muted/50 border space-y-4" data-testid="training-stats-details">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stats.totalExamples}</div>
              <div className="text-xs text-muted-foreground">Examples</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stats.accuracy.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stats.level}</div>
              <div className="text-xs text-muted-foreground">Level</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to Level {stats.level + 1}</span>
              <span className="font-medium">{stats.totalExamples} / {stats.nextLevelAt}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min((stats.totalExamples / stats.nextLevelAt) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t">
            <Badge variant="secondary" className="w-full justify-center py-2">
              {stats.levelName}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
