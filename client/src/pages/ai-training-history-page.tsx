import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Brain, CheckCircle2, XCircle, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrainingStats } from "@shared/schema";

interface TrainingHistoryItem {
  id: number;
  transactionDescription: string;
  transactionAmount: string | null;
  categoryName: string | null;
  tagName: string | null;
  financialType: string | null;
  aiWasCorrect: boolean;
  createdAt: string;
}

export default function AiTrainingHistoryPage() {
  const { data: history, isLoading } = useQuery<TrainingHistoryItem[]>({
    queryKey: ["/api/ai/training/history"],
  });

  const { data: stats } = useQuery<TrainingStats>({
    queryKey: ["/api/ai/training-stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="ai-training-history-page">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-ai-training">
          <Brain className="h-8 w-8" />
          AI Training History
        </h1>
        <p className="text-muted-foreground mt-1">
          Every swipe teaches your personalized AI model
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Examples</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-examples">
                {stats.totalExamples || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Training data points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Correct Predictions</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-correct-predictions">
                {stats.correctPredictions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                AI learning success
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
              <Brain className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-accuracy-rate">
                {stats.totalExamples > 0
                  ? Math.round((stats.correctPredictions / stats.totalExamples) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                Model performance
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Training Sessions</CardTitle>
          <CardDescription>
            Your swipes are stored to improve future predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="empty-training-history">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No training data yet</p>
              <p className="text-sm">Start swiping to train your AI!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border hover-elevate"
                  data-testid={`training-item-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate" data-testid={`text-description-${item.id}`}>
                          {item.transactionDescription}
                        </p>
                        {item.aiWasCorrect && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        {!item.aiWasCorrect && (
                          <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                        {item.categoryName && (
                          <Badge variant="secondary" data-testid={`badge-category-${item.id}`}>
                            {item.categoryName}
                          </Badge>
                        )}
                        {item.tagName && (
                          <Badge variant="outline" data-testid={`badge-tag-${item.id}`}>
                            {item.tagName}
                          </Badge>
                        )}
                        {item.financialType && (
                          <Badge
                            variant={
                              item.financialType === "asset"
                                ? "default"
                                : item.financialType === "liability"
                                ? "destructive"
                                : "secondary"
                            }
                            data-testid={`badge-type-${item.id}`}
                          >
                            {item.financialType}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {item.transactionAmount && (
                        <p className="font-medium" data-testid={`text-amount-${item.id}`}>
                          ${item.transactionAmount}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground" data-testid={`text-date-${item.id}`}>
                        {format(new Date(item.createdAt), "MMM d, HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
