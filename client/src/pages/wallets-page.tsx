import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet as WalletIcon, CreditCard, Coins, Bitcoin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWalletSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = insertWalletSchema.extend({
  balance: z.string().min(1, "Balance is required"),
});

type FormData = z.infer<typeof formSchema>;

const walletIcons = {
  card: CreditCard,
  cash: Coins,
  crypto: Bitcoin,
};

export default function WalletsPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wallets = [], isLoading } = useQuery<Wallet[]>({
    queryKey: ["/api/wallets"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: user?.id || 0,
      name: "",
      type: "card",
      balance: "",
      currency: "USD",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/wallets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Success",
        description: "Wallet added successfully",
      });
      form.reset();
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallets</h1>
          <p className="text-muted-foreground">Manage your accounts and balances</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-wallet">
          <Plus className="h-4 w-4 mr-2" />
          Add Wallet
        </Button>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="text-xl">Total Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-mono font-bold" data-testid="total-balance">
            ${totalBalance.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {wallets.map((wallet) => {
          const Icon = walletIcons[wallet.type as keyof typeof walletIcons] || WalletIcon;
          return (
            <Card key={wallet.id} className="hover-elevate" data-testid={`wallet-${wallet.id}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {wallet.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold">
                  ${parseFloat(wallet.balance).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {wallet.type} • {wallet.currency}
                </p>
              </CardContent>
            </Card>
          );
        })}

        {wallets.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <WalletIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No wallets yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first wallet to start tracking balances</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Wallet</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. My Bank Account" data-testid="input-wallet-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-wallet-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Balance</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-wallet-balance"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1"
                  data-testid="button-cancel-wallet"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-wallet"
                >
                  {createMutation.isPending ? "Adding..." : "Add Wallet"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
