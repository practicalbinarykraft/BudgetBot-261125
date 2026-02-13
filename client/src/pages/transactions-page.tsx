import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Transaction, Category, PersonalTag } from "@shared/schema";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { Button } from "@/components/ui/button";
import { Plus, Shuffle, X, Filter } from "lucide-react";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog";
import { TransactionFilters } from "@/components/transactions/transactions-filters-types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Tag, FolderOpen, ArrowUpDown, Check } from "lucide-react";
import { apiRequest, selectData } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/context";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/tags/tag-badge";
import { useTranslateCategory } from "@/lib/category-translations";

export default function TransactionsPage() {
  const { t } = useTranslation();
  const translateCategory = useTranslateCategory();
  const [location, setLocation] = useLocation();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFiltersPopover, setShowFiltersPopover] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Получаем все фильтры из URL параметров
  const getFiltersFromURL = (): TransactionFilters => {
    const searchParams = new URLSearchParams(window.location.search);
    
    // Получаем множественные значения для каждого типа фильтра
    const categoryIds = searchParams.getAll('categoryId').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const personalTagIds = searchParams.getAll('personalTagId').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const types = searchParams.getAll('type').filter(t => t === 'income' || t === 'expense') as ('income' | 'expense')[];
    
    return {
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      personalTagIds: personalTagIds.length > 0 ? personalTagIds : undefined,
      types: types.length > 0 ? types : undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
    };
  };
  
  // Локальное состояние для выбранных значений фильтров (до применения)
  // Для селекторов используем одно значение, которое будет добавлено к существующим
  const [pendingFilter, setPendingFilter] = useState<{
    categoryId?: number | null;
    personalTagId?: number | null;
    type?: 'income' | 'expense' | null;
    from?: string | null;
    to?: string | null;
  }>({
    categoryId: null,
    personalTagId: null,
    type: null,
    from: null,
    to: null,
  });

  // Локальное состояние для текущих фильтров (для немедленного обновления UI)
  const [localCurrentFilters, setLocalCurrentFilters] = useState<TransactionFilters>(() => getFiltersFromURL());
  
  // Используем useMemo для получения актуальных фильтров из URL
  const urlFilters = useMemo(() => getFiltersFromURL(), [location]);
  
  // Синхронизируем локальное состояние с URL фильтрами
  useEffect(() => {
    setLocalCurrentFilters(urlFilters);
  }, [urlFilters]);
  
  // Используем локальное состояние для немедленного обновления UI
  const currentFilters = localCurrentFilters;

  // Сбрасываем pendingFilter при открытии Popover
  useEffect(() => {
    if (showFiltersPopover) {
      setPendingFilter({
        categoryId: null,
        personalTagId: null,
        type: null,
        from: null,
        to: null,
      });
    }
  }, [showFiltersPopover]);

  // Загружаем категории и теги для отображения названий фильтров
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: !!user,
    select: (data: unknown) => selectData<Category>(data),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["/api/tags"],
    enabled: !!user,
    select: (data: unknown) => selectData<PersonalTag>(data),
  });

  // Формируем URL с фильтрами
  const buildTransactionsURL = (filters: TransactionFilters): string => {
    const params = new URLSearchParams();
    if (filters.categoryIds) {
      filters.categoryIds.forEach(id => params.append('categoryId', id.toString()));
    }
    if (filters.personalTagIds) {
      filters.personalTagIds.forEach(id => params.append('personalTagId', id.toString()));
    }
    if (filters.types) {
      filters.types.forEach(type => params.append('type', type));
    }
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    
    const queryString = params.toString();
    return queryString ? `/api/transactions?${queryString}` : '/api/transactions';
  };

  const { data: transactionsResponse, isLoading } = useQuery<{
    data: Transaction[];
    pagination: { total: number; limit: number; offset: number };
  }>({
    queryKey: ["/api/transactions", currentFilters],
    queryFn: async () => {
      const url = buildTransactionsURL(currentFilters);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
    enabled: !!user,
  });

  const transactions = transactionsResponse?.data ?? [];

  // Применение фильтров - обновляем URL
  const handleApplyFilters = (filters: TransactionFilters) => {
    // Немедленно обновляем локальное состояние для мгновенного обновления UI
    setLocalCurrentFilters(filters);
    
    const params = new URLSearchParams();
    if (filters.categoryIds) {
      filters.categoryIds.forEach(id => params.append('categoryId', id.toString()));
    }
    if (filters.personalTagIds) {
      filters.personalTagIds.forEach(id => params.append('personalTagId', id.toString()));
    }
    if (filters.types) {
      filters.types.forEach(type => params.append('type', type));
    }
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    
    const queryString = params.toString();
    const newPath = queryString ? `/app/transactions?${queryString}` : '/app/transactions';
    
    // Обновляем URL через wouter
    setLocation(newPath);
    
    // Инвалидируем запросы для обновления данных
    queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
  };

  // Применение выбранного фильтра по нажатию кнопки с галочкой
  // Добавляет новое значение к существующим фильтрам того же типа
  const applyPendingFilter = (filterType: 'categoryId' | 'personalTagId' | 'type' | 'from' | 'to') => {
    const pendingValue = pendingFilter[filterType];
    
    if (pendingValue === null || pendingValue === undefined) {
      return; // Не применяем пустые значения
    }
    
    const newFilters = { ...currentFilters };
    
    if (filterType === 'categoryId') {
      const value = pendingValue as number;
      const existingIds = currentFilters.categoryIds || [];
      if (!existingIds.includes(value)) {
        newFilters.categoryIds = [...existingIds, value];
      } else {
        // Если уже есть, не добавляем повторно
        return;
      }
    } else if (filterType === 'personalTagId') {
      const value = pendingValue as number;
      const existingIds = currentFilters.personalTagIds || [];
      if (!existingIds.includes(value)) {
        newFilters.personalTagIds = [...existingIds, value];
      } else {
        // Если уже есть, не добавляем повторно
        return;
      }
    } else if (filterType === 'type') {
      const value = pendingValue as 'income' | 'expense';
      const existingTypes = currentFilters.types || [];
      if (!existingTypes.includes(value)) {
        newFilters.types = [...existingTypes, value];
      } else {
        // Если уже есть, не добавляем повторно
        return;
      }
    } else if (filterType === 'from') {
      newFilters.from = pendingValue as string;
    } else if (filterType === 'to') {
      newFilters.to = pendingValue as string;
    }
    
    handleApplyFilters(newFilters);
    // Сбрасываем pendingFilter для этого типа после применения
    setPendingFilter({ ...pendingFilter, [filterType]: null });
  };

  // Проверка, можно ли применить фильтр (значение выбрано и еще не добавлено)
  const canApplyFilter = (filterType: 'categoryId' | 'personalTagId' | 'type' | 'from' | 'to'): boolean => {
    const pendingValue = pendingFilter[filterType];
    if (pendingValue === null || pendingValue === undefined) {
      return false;
    }
    
    if (filterType === 'categoryId') {
      const value = pendingValue as number;
      const existingIds = currentFilters.categoryIds || [];
      return !existingIds.includes(value);
    } else if (filterType === 'personalTagId') {
      const value = pendingValue as number;
      const existingIds = currentFilters.personalTagIds || [];
      return !existingIds.includes(value);
    } else if (filterType === 'type') {
      const value = pendingValue as 'income' | 'expense';
      const existingTypes = currentFilters.types || [];
      return !existingTypes.includes(value);
    } else if (filterType === 'from') {
      return (pendingValue as string) !== currentFilters.from;
    } else if (filterType === 'to') {
      return (pendingValue as string) !== currentFilters.to;
    }
    
    return false;
  };

  // Удаление конкретного фильтра по значению
  const removeFilter = (filterType: 'categoryId' | 'personalTagId' | 'type' | 'from' | 'to', value?: number | string) => {
    const newFilters = { ...currentFilters };
    
    if (filterType === 'categoryId' && value !== undefined) {
      const existingIds = currentFilters.categoryIds || [];
      newFilters.categoryIds = existingIds.filter(id => id !== value);
      if (newFilters.categoryIds.length === 0) {
        delete newFilters.categoryIds;
      }
    } else if (filterType === 'personalTagId' && value !== undefined) {
      const existingIds = currentFilters.personalTagIds || [];
      newFilters.personalTagIds = existingIds.filter(id => id !== value);
      if (newFilters.personalTagIds.length === 0) {
        delete newFilters.personalTagIds;
      }
    } else if (filterType === 'type' && value !== undefined) {
      const existingTypes = currentFilters.types || [];
      newFilters.types = existingTypes.filter(t => t !== value);
      if (newFilters.types.length === 0) {
        delete newFilters.types;
      }
    } else if (filterType === 'from') {
      delete newFilters.from;
    } else if (filterType === 'to') {
      delete newFilters.to;
    }
    
    handleApplyFilters(newFilters);
  };

  // Очистка всех фильтров
  const clearAllFilters = () => {
    handleApplyFilters({});
  };

  // Получаем активные фильтры для отображения
  const activeFilters = useMemo(() => {
    const filters: Array<{ 
      key: 'categoryId' | 'personalTagId' | 'type' | 'from' | 'to'; 
      label: string; 
      value: string;
      filterValue: number | string;
    }> = [];
    
    // Категории
    if (currentFilters.categoryIds) {
      currentFilters.categoryIds.forEach(categoryId => {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          filters.push({
            key: 'categoryId',
            label: t("transactions.filter_by_category") || "Категория",
            value: translateCategory(category.name),
            filterValue: categoryId,
          });
        }
      });
    }
    
    // Теги
    if (currentFilters.personalTagIds) {
      currentFilters.personalTagIds.forEach(tagId => {
        const tag = tags.find(t => t.id === tagId);
        if (tag) {
          filters.push({
            key: 'personalTagId',
            label: t("transactions.filter_by_tag") || "Тег",
            value: tag.name,
            filterValue: tagId,
          });
        }
      });
    }
    
    // Типы
    if (currentFilters.types) {
      currentFilters.types.forEach(type => {
        filters.push({
          key: 'type',
          label: t("transactions.filter_by_type") || "Тип",
          value: type === 'income' 
            ? (t("transactions.type.income") || "Доход")
            : (t("transactions.type.expense") || "Расход"),
          filterValue: type,
        });
      });
    }
    
    // Даты
    if (currentFilters.from) {
      filters.push({
        key: 'from',
        label: t("transactions.filter_by_date_from") || "Дата от",
        value: currentFilters.from,
        filterValue: currentFilters.from,
      });
    }
    
    if (currentFilters.to) {
      filters.push({
        key: 'to',
        label: t("transactions.filter_by_date_to") || "Дата до",
        value: currentFilters.to,
        filterValue: currentFilters.to,
      });
    }
    
    return filters;
  }, [currentFilters, categories, tags, t, translateCategory]);

  const { data: sortingStats } = useQuery<{ unsortedCount: number }>({
    queryKey: ['/api/sorting/stats'],
    enabled: !!user,
  });

  const unsortedCount = sortingStats?.unsortedCount ?? 0;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sorting/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/unsorted"], exact: false });
      toast({
        title: t("common.success"),
        description: t("transactions.deleted_successfully"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 sm:pb-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-first header: stack on mobile, row on desktop */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">{t("transactions.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("transactions.manage")}</p>
          {/* Показываем активные фильтры как бейджи */}
          {activeFilters.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter, index) => {
                const tag = filter.key === 'personalTagId' ? tags.find(t => t.id === filter.filterValue) : null;
                return (
                  <div key={`${filter.key}-${filter.filterValue}-${index}`} className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      {filter.key === 'personalTagId' && tag ? (
                        <>
                          {tag.icon && tag.icon !== 'User' && (
                            <span className="text-xs">{tag.icon}</span>
                          )}
                          <span style={{ color: tag.color || undefined }}>
                            {filter.label}: {filter.value}
                          </span>
                        </>
                      ) : (
                        <>
                          {filter.label}: {filter.value}
                        </>
                      )}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1"
                      onClick={() => removeFilter(filter.key, filter.filterValue)}
                      aria-label={`Удалить фильтр ${filter.label}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
              {activeFilters.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={clearAllFilters}
                  aria-label="Очистить все фильтры"
                >
                  {t("transactions.clear_filters")}
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Popover open={showFiltersPopover} onOpenChange={setShowFiltersPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                data-testid="button-filters-transactions"
              >
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("transactions.filters")}</span>
                <span className="sm:hidden">{t("transactions.filters")}</span>
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4" align="start">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">{t("transactions.filters")}</h4>
                  <p className="text-xs text-muted-foreground mb-1">
                    Фильтры применяются автоматически при выборе
                  </p>
                  {activeFilters.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {activeFilters.map((filter) => (
                        <Badge key={filter.key} variant="secondary" className="text-xs">
                          {filter.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Фильтр по типу */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <ArrowUpDown className="h-3 w-3" />
                    {t("transactions.filter_by_type")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={pendingFilter.type || "all"}
                      onValueChange={(value) => {
                        setPendingFilter({ ...pendingFilter, type: value === "all" ? null : (value as 'income' | 'expense') });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Выберите тип..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        <SelectItem value="income">{t("transactions.type.income")}</SelectItem>
                        <SelectItem value="expense">{t("transactions.type.expense")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => applyPendingFilter('type')}
                      disabled={!canApplyFilter('type')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Фильтр по категории */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <FolderOpen className="h-3 w-3" />
                    {t("transactions.filter_by_category")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={pendingFilter.categoryId?.toString() || "all"}
                      onValueChange={(value) => {
                        setPendingFilter({ ...pendingFilter, categoryId: value === "all" ? null : parseInt(value) });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder={t("transactions.select_category")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            <div className="flex items-center gap-2">
                              {category.icon && category.icon !== 'Tag' && (
                                <span className="text-xs">{category.icon}</span>
                              )}
                              {(!category.icon || category.icon === 'Tag') && category.color && (
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                              <span className="text-xs">{translateCategory(category.name)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => applyPendingFilter('categoryId')}
                      disabled={!canApplyFilter('categoryId')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Фильтр по тегу */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    {t("transactions.filter_by_tag")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={pendingFilter.personalTagId?.toString() || "all"}
                      onValueChange={(value) => {
                        setPendingFilter({ ...pendingFilter, personalTagId: value === "all" ? null : parseInt(value) });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder={t("transactions.select_tag")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id.toString()}>
                            <TagBadge tag={tag} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => applyPendingFilter('personalTagId')}
                      disabled={!canApplyFilter('personalTagId')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Фильтр по дате "от" */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {t("transactions.filter_by_date_from")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={pendingFilter.from || ""}
                      onChange={(e) => {
                        setPendingFilter({ ...pendingFilter, from: e.target.value || null });
                      }}
                      className="h-8 text-xs flex-1"
                      placeholder="Выберите дату..."
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => applyPendingFilter('from')}
                      disabled={!canApplyFilter('from')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Фильтр по дате "до" */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {t("transactions.filter_by_date_to")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={pendingFilter.to || ""}
                      onChange={(e) => {
                        setPendingFilter({ ...pendingFilter, to: e.target.value || null });
                      }}
                      className="h-8 text-xs flex-1"
                      placeholder="Выберите дату..."
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => applyPendingFilter('to')}
                      disabled={!canApplyFilter('to')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {activeFilters.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 h-8 text-xs"
                    onClick={() => {
                      clearAllFilters();
                      setShowFiltersPopover(false);
                    }}
                  >
                    {t("transactions.clear_filters")}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          {unsortedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => setLocation('/transactions/sort')}
              data-testid="button-sort-transactions"
            >
              <Shuffle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("transactions.sort_button")}</span>
              <span className="sm:hidden">({unsortedCount})</span>
              <span className="hidden sm:inline"> ({unsortedCount})</span>
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-transaction-page"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("transactions.add_transaction")}</span>
            <span className="sm:hidden">{t("common.add")}</span>
          </Button>
        </div>
      </div>

      <TransactionList
        transactions={transactions}
        onEdit={(transaction) => setEditingTransaction(transaction)}
        onDelete={(id) => deleteMutation.mutate(id)}
        showEdit={true}
        showDelete={true}
      />

      <AddTransactionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      <EditTransactionDialog
        transaction={editingTransaction}
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      />

      <MobileMenuSheet
        open={showMobileMenu}
        onOpenChange={setShowMobileMenu}
      />
    </div>
  );
}
