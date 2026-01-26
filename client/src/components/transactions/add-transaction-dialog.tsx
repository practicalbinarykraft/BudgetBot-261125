import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/i18n/context";
import { Category, PersonalTag } from "@shared/schema";
import { Plus, Mic, Camera, Loader2 } from "lucide-react";
import { CategoryCreateDialog } from "@/components/categories/category-create-dialog";
import { TagSelector } from "@/components/tags/tag-selector";
import { useTranslateCategory } from "@/lib/category-translations";
import { VoiceRecorderAdaptive, ParsedVoiceResult } from "@/components/voice-recorder-adaptive";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPersonalTagId?: number | null;
  // Props for voice input prefill
  defaultDescription?: string;
  defaultAmount?: string;
  defaultCurrency?: string;
  defaultCategory?: string;
  defaultType?: 'income' | 'expense';
  defaultDate?: string; // For notifications - prefill date from planned transaction
  defaultCategoryId?: number | null; // For notifications - prefill categoryId
}

interface TransactionResponse {
  id: number;
  userId: number;
  date: string;
  type: string;
  amount: string;
  description: string;
  category: string | null;
  categoryId: number | null;
  currency: string | null;
  amountUsd: string;
  mlSuggested: boolean;
  mlConfidence: number;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  defaultPersonalTagId,
  defaultDescription,
  defaultAmount,
  defaultCurrency,
  defaultCategory,
  defaultType,
  defaultDate,
  defaultCategoryId,
}: AddTransactionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  const translateCategory = useTranslateCategory();
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [interimTranscription, setInterimTranscription] = useState(""); // Промежуточная транскрипция для показа в реальном времени
  const [isVoiceRecording, setIsVoiceRecording] = useState(false); // Состояние записи голоса
  const [isReceiptUploading, setIsReceiptUploading] = useState(false); // Состояние загрузки чека
  const receiptFileInputRef = useRef<HTMLInputElement>(null); // Ref для скрытого input файла

  // Client-side validation schema - simpler than server schema
  const formSchema = z.object({
    type: z.enum(["income", "expense"]),
    amount: z.string().min(1, t("transactions.amount_required")),
    description: z.string().min(1, t("transactions.description_required")),
    date: z.string().min(1),
    category: z.string().optional(),
    currency: z.string().default("USD"),
    personalTagId: z.number().nullable().optional(),
    walletId: z.number().optional(),
  });

  type FormData = z.infer<typeof formSchema>;

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: open,
  });

  const { data: tags = [] } = useQuery<PersonalTag[]>({
    queryKey: ["/api/tags"],
    enabled: open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      amount: "",
      description: "",
      category: "",
      currency: "USD",
      walletId: undefined,
      personalTagId: defaultPersonalTagId ?? null,
    },
  });

  // Prefill form when dialog opens with voice input data or notification data
  useEffect(() => {
    if (open) {
      if (defaultDescription) form.setValue("description", defaultDescription);
      if (defaultAmount) form.setValue("amount", defaultAmount);
      if (defaultCurrency) form.setValue("currency", defaultCurrency);
      if (defaultCategory) form.setValue("category", defaultCategory);
      if (defaultType) form.setValue("type", defaultType);
      if (defaultDate) form.setValue("date", defaultDate);
      // Note: defaultCategoryId is stored in component state and used in mutation
    } else {
      // Reset form when dialog closes
      form.reset({
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        amount: "",
        description: "",
        category: "",
        currency: "USD",
        walletId: undefined,
        personalTagId: defaultPersonalTagId ?? null,
      });
    }
  }, [open, defaultDescription, defaultAmount, defaultCurrency, defaultCategory, defaultType, defaultDate, defaultPersonalTagId, form]);

  // Handler for Web Speech API (plain text) - used in regular browsers
  const handleVoiceResult = (text: string) => {
    // НЕ закрываем модал, если текст пустой
    if (!text || text.trim().length === 0) {
      console.warn('Empty text received, ignoring');
      return;
    }
    
    form.setValue("description", text);
    setInterimTranscription(""); // Очищаем промежуточную транскрипцию
    setShowVoiceInput(false);
  };

  // Handler for server-side parsed result - used in Telegram Mini App
  const handleVoiceParsedResult = (result: ParsedVoiceResult) => {
    if (result.parsed.description) form.setValue("description", result.parsed.description);
    if (result.parsed.amount) form.setValue("amount", result.parsed.amount);
    if (result.parsed.currency) form.setValue("currency", result.parsed.currency);
    if (result.parsed.category) form.setValue("category", result.parsed.category);
    if (result.parsed.type) form.setValue("type", result.parsed.type);
    setInterimTranscription(""); // Очищаем промежуточную транскрипцию
    setShowVoiceInput(false);
  };

  // Handler для промежуточных результатов (транскрипция в реальном времени)
  // Теперь получаем полный текст: накопленный финальный + текущий промежуточный
  const handleInterimResult = (fullText: string) => {
    setInterimTranscription(fullText);
    setIsVoiceRecording(true); // Устанавливаем флаг записи
  };

  /**
   * Обработчик загрузки и распознавания чека
   * 
   * Junior-Friendly:
   * - Конвертирует файл в base64
   * - Отправляет на сервер для OCR
   * - Заполняет форму данными из чека
   */
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReceiptUploading(true);
    
    try {
      // Конвертируем файл в base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Убираем префикс data:image/...;base64,
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mimeType = file.type || 'image/jpeg';
      
      // Отправляем на сервер для OCR
      const response = await fetch('/api/ai/receipt-with-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          imageBase64: base64,
          mimeType: mimeType
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse receipt');
      }

      const data = await response.json();
      const receipt = data.receipt;

      // Заполняем форму данными из чека
      if (receipt.merchant) {
        form.setValue("description", receipt.merchant);
      }
      if (receipt.total) {
        form.setValue("amount", receipt.total.toString());
      }
      if (receipt.currency) {
        form.setValue("currency", receipt.currency);
      }
      if (receipt.date) {
        form.setValue("date", receipt.date);
      }
      // Тип всегда expense для чеков
      form.setValue("type", "expense");

      // Показываем успешное уведомление
      const itemsCount = data.itemsCount || 0;
      const merchant = receipt.merchant || 'receipt';
      toast({
        title: t("receipt.scanned_successfully"),
        description: t("receipt.items_found")
          .replace("{count}", itemsCount.toString())
          .replace("{merchant}", merchant),
      });
    } catch (error: any) {
      toast({
        title: t("receipt.failed_to_scan"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsReceiptUploading(false);
      // Сбрасываем input для возможности повторной загрузки
      if (receiptFileInputRef.current) {
        receiptFileInputRef.current.value = '';
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: any = {
        type: data.type,
        amount: data.amount,
        amountUsd: data.amount,
        description: data.description,
        date: data.date,
        category: data.category || undefined,
        currency: data.currency,
        personalTagId: data.personalTagId,
        walletId: data.walletId,
        source: 'manual',
      };
      // Add categoryId if provided (from notifications)
      if (defaultCategoryId) {
        payload.categoryId = defaultCategoryId;
      }
      const res = await apiRequest("POST", "/api/transactions", payload);
      return res.json() as Promise<TransactionResponse>;
    },
    onSuccess: async (transaction: TransactionResponse) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/sorting/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/unsorted"], exact: false });
      
      // If transaction was created from notification, mark notification as completed
      // Check if we have notification data (via defaultDate or other notification-specific fields)
      if (defaultDate && defaultDescription) {
        // Try to find and mark notification as completed
        try {
          const notificationsRes = await fetch("/api/notifications", {
            credentials: "include",
          });
          if (notificationsRes.ok) {
            const notifications = await notificationsRes.json();
            const matchingNotification = notifications.find((n: any) => 
              n.transactionData?.description === defaultDescription &&
              n.transactionData?.date === defaultDate &&
              n.status !== "completed"
            );
            if (matchingNotification) {
              await fetch(`/api/notifications/${matchingNotification.id}/complete`, {
                method: "PATCH",
                credentials: "include",
              });
              queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
              queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
            }
          }
        } catch (error) {
          console.error("Failed to mark notification as completed:", error);
        }
      }
      
      if (transaction.mlSuggested && transaction.category) {
        const confidence = Math.round(transaction.mlConfidence * 100);
        toast({
          title: t("transactions.smart_suggestion_applied"),
          description: t("transactions.category_auto_selected")
            .replace("{category}", transaction.category)
            .replace("{confidence}", String(confidence)),
        });
      } else {
        toast({
          title: t("common.success"),
          description: t("transactions.added_successfully"),
        });
      }
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error_occurred"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] flex flex-col !p-0 overflow-hidden">
        <DialogHeader className="px-3 pt-3 pb-2 sm:px-6 sm:pt-6 sm:pb-4 flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg">{t("transactions.add_transaction")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t("common.type")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-type" className="w-full max-w-full text-sm h-9">
                        <SelectValue placeholder={t("transactions.select_type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">{t("transactions.type.income")}</SelectItem>
                      <SelectItem value="expense">{t("transactions.type.expense")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">{t("transactions.amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-amount"
                        className="w-full text-sm h-9"
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
                    <FormLabel className="text-sm">{t("transactions.currency")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                      <SelectTrigger data-testid="select-currency" className="w-full max-w-full text-sm h-9">
                        <SelectValue placeholder={t("transactions.currency")} />
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t("transactions.description")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("transactions.placeholder_description")}
                      data-testid="input-description"
                      className="w-full text-sm h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t("transactions.category_optional")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category" className="w-full max-w-full text-sm h-9">
                        <SelectValue placeholder={t("transactions.select_category")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          <div className="flex items-center gap-2">
                            {cat.icon && cat.icon !== 'Tag' && (
                              <span className="text-base">{cat.icon}</span>
                            )}
                            <span>{translateCategory(cat.name)}</span>
                          </div>
                        </SelectItem>
                      ))}
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowCreateCategory(true);
                        }}
                        className="w-full px-2 py-1.5 text-sm text-left hover-elevate active-elevate-2 rounded-sm flex items-center gap-2 text-primary"
                        data-testid="button-create-category"
                      >
                        <Plus className="h-4 w-4" />
                        {t("transactions.create_new_category")}
                      </button>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalTagId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t("transactions.tag_optional")}</FormLabel>
                  <FormControl>
                    <TagSelector
                      value={field.value ?? null}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm">{t("transactions.date")}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      data-testid="input-date"
                      className="w-full text-sm h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            </div>
            <div className="flex gap-2 pt-2 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6 border-t flex-shrink-0">
              {/* Отмена - слева */}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 text-sm"
                data-testid="button-cancel"
              >
                {t("transactions.cancel")}
              </Button>
              
              {/* Микрофон - центр слева */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVoiceInput(true)}
                className="px-3 sm:px-4 text-sm"
                aria-label={t("voice_input.title")}
                disabled={isReceiptUploading}
              >
                <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              {/* Фотоаппарат - центр справа */}
              <Button
                type="button"
                variant="outline"
                onClick={() => receiptFileInputRef.current?.click()}
                className="px-3 sm:px-4 text-sm"
                aria-label={t("receipt.scan_label")}
                disabled={isReceiptUploading}
                data-testid="button-scan-receipt"
              >
                {isReceiptUploading ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
              
              {/* Скрытый input для файлов */}
              <Input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                ref={receiptFileInputRef}
                className="hidden"
                data-testid="input-receipt-file"
              />
              
              {/* Добавить транзакцию - справа */}
              <Button
                type="submit"
                disabled={createMutation.isPending || isReceiptUploading}
                className="flex-1 text-sm"
                data-testid="button-submit-transaction"
              >
                {createMutation.isPending ? t("transactions.adding") : t("transactions.add_transaction")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
      </Dialog>

      <CategoryCreateDialog
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
        defaultType={form.watch("type") as "income" | "expense"}
        onSuccess={(categoryName) => {
          form.setValue("category", categoryName);
        }}
      />

      {/* Voice Input Dialog - Separate Dialog to avoid z-index conflicts */}
      <Dialog open={showVoiceInput} onOpenChange={(open) => {
        setShowVoiceInput(open);
        if (!open) {
          setInterimTranscription(""); // Очищаем промежуточную транскрипцию при закрытии
          setIsVoiceRecording(false); // Сбрасываем флаг записи
        }
      }}>
        <DialogContent className="max-w-sm z-[200]">
          <DialogHeader>
            <DialogTitle>{t("voice_input.title")}</DialogTitle>
            <DialogDescription>
              {t("voice_input.instructions")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 mb-4">
            <VoiceRecorderAdaptive
              onResult={handleVoiceResult}
              onParsedResult={handleVoiceParsedResult}
              onInterimResult={handleInterimResult}
              onRecordingChange={setIsVoiceRecording}
              className="w-16 h-16"
            />
            
            {/* Показываем транскрипцию в реальном времени (как у конкурентов!) */}
            {/* Показываем поле всегда, когда идет запись или есть текст */}
            {(isVoiceRecording || interimTranscription) && (
              <div className="w-full px-4 py-3 bg-muted rounded-lg border border-border min-h-[80px] flex flex-col justify-center">
                {interimTranscription ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("voice_input.transcribing") || "Распознавание..."}
                    </p>
                    <p className="text-base font-medium break-words">
                      {interimTranscription}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    {language === 'ru' ? 'Говорите...' : 'Listening...'}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={() => {
              setShowVoiceInput(false);
              setInterimTranscription(""); // Очищаем при закрытии
            }}
            className="w-full"
          >
            {t("common.cancel")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
