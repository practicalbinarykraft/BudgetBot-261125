import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet as WalletIcon, CreditCard, Coins, Bitcoin, Settings2 } from "lucide-react";
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
import { CalibrationDialog } from "@/components/wallets/calibration-dialog";
import { useTranslation } from "@/i18n/context";

const formSchema = insertWalletSchema.extend({
  balance: z.string().min(1),
});

type FormData = z.infer<typeof formSchema>;

const walletIcons = {
  card: CreditCard,
  cash: Coins,
  crypto: Bitcoin,
};

export default function WalletsPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCalibrateDialog, setShowCalibrateDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

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
        title: t("common.success"),
        description: t("wallets.added_successfully"),
      });
      form.reset();
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
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

  const totalBalance = wallets.reduce((sum, w) => {
    const usdAmount = w.balanceUsd ? parseFloat(w.balanceUsd) : parseFloat(w.balance);
    return sum + usdAmount;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("wallets.title")}</h1>
          <p className="text-muted-foreground">{t("wallets.manage")}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCalibrateDialog(true)} 
            data-testid="button-calibrate-wallets"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {t("wallets.calibrate")}
          </Button>
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-wallet">
            <Plus className="h-4 w-4 mr-2" />
            {t("wallets.add_wallet")}
          </Button>
        </div>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="text-xl">{t("wallets.total_net_worth")}</CardTitle>
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
                  {wallet.currency === "RUB" ? "₽" : wallet.currency === "IDR" ? "Rp" : "$"}
                  {parseFloat(wallet.balance).toFixed(2)}
                </div>
                {wallet.currency !== "USD" && wallet.balanceUsd && (
                  <div className="text-sm text-muted-foreground mt-1">
                    ≈ ${parseFloat(wallet.balanceUsd).toFixed(2)}
                  </div>
                )}
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
              <p className="text-muted-foreground">{t("wallets.no_wallets")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("wallets.add_first")}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("wallets.add_wallet_dialog")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("wallets.name")}</FormLabel>
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
                    <FormLabel>{t("wallets.type")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-wallet-type">
                          <SelectValue placeholder={t("wallets.select_type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="card">{t("wallets.type_card")}</SelectItem>
                        <SelectItem value="cash">{t("wallets.type_cash")}</SelectItem>
                        <SelectItem value="crypto">{t("wallets.type_crypto")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("wallets.balance")}</FormLabel>
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

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("wallets.currency")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-wallet-currency">
                            <SelectValue placeholder={t("wallets.currency")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="RUB">RUB (₽)</SelectItem>
                          <SelectItem value="IDR">IDR (Rp)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1"
                  data-testid="button-cancel-wallet"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-wallet"
                >
                  {createMutation.isPending ? t("wallets.adding") : t("wallets.add_wallet")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CalibrationDialog
        open={showCalibrateDialog}
        onOpenChange={setShowCalibrateDialog}
      />
    </div>
  );
}
