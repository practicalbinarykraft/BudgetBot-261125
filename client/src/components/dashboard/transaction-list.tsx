import { Transaction } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
// ⏰ parseISO prevents timezone bugs when parsing date strings from DB
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: number) => void;
  onEdit?: (transaction: Transaction) => void;
  showDelete?: boolean;
  showEdit?: boolean;
}

export function TransactionList({ transactions, onDelete, onEdit, showDelete = false, showEdit = false }: TransactionListProps) {
  if (!transactions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Add your first transaction to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between py-3 px-4 rounded-md border hover-elevate"
            data-testid={`transaction-${transaction.id}`}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-1">
                <p className="font-medium">{transaction.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {/* ⏰ parseISO prevents timezone bugs */}
                    {format(parseISO(transaction.date), "MMM dd, yyyy")}
                  </p>
                  {transaction.category && (
                    <Badge variant="secondary" className="text-xs">
                      {transaction.category}
                    </Badge>
                  )}
                  {transaction.source !== "manual" && (
                    <Badge variant="outline" className="text-xs">
                      {transaction.source}
                    </Badge>
                  )}
                </div>
              </div>
              <div className={cn(
                "font-mono font-semibold text-lg",
                transaction.type === "income" 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}
              data-testid={`amount-${transaction.id}`}
              >
                {transaction.type === "income" ? "+" : "-"}${transaction.amountUsd}
              </div>
            </div>
            <div className="flex gap-1">
              {showEdit && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(transaction)}
                  data-testid={`button-edit-${transaction.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {showDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(transaction.id)}
                  data-testid={`button-delete-${transaction.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
