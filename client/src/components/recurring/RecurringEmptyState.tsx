import { Card, CardContent } from "@/components/ui/card";
import { Repeat } from "lucide-react";

export function RecurringEmptyState() {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Repeat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No recurring payments yet</p>
        <p className="text-sm text-muted-foreground mt-1">Add your subscriptions and regular bills</p>
      </CardContent>
    </Card>
  );
}
