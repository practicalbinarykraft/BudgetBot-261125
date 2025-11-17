import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartLoadingState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[400px]" />
      </CardContent>
    </Card>
  );
}

export function ChartErrorState({ error }: { error: Error }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-destructive">
          <p>Failed to load chart data</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartEmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>No data yet</p>
          <p className="text-sm mt-1">Add some transactions to see your financial trend</p>
        </div>
      </CardContent>
    </Card>
  );
}
