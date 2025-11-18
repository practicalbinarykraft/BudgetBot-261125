import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { ActionPreview } from './action-preview';
import { ConfirmationButtons } from './confirmation-buttons';
import { CategoryDropdown } from './category-dropdown';
import { CurrencyDropdown } from './currency-dropdown';
import { PersonalTagDropdown } from './personal-tag-dropdown';
import { EditableField } from './editable-field';

interface Settings {
  currency?: string;
  exchangeRateRUB?: string;
  exchangeRateIDR?: string;
  exchangeRateKRW?: string;
  exchangeRateEUR?: string;
  exchangeRateCNY?: string;
}

// Normalize params with defaults
function normalizeParams(params: Record<string, any>): Record<string, any> {
  return {
    ...params,
    amount: typeof params.amount === 'string' ? parseFloat(params.amount) : params.amount,
    currency: params.currency || 'USD'
  };
}

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

interface MLSuggestion {
  categoryId: number;
  categoryName: string;
  confidence: number;
}

interface PersonalTag {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

interface ConfirmationCardProps {
  action: string;
  params: Record<string, any>;
  mlSuggestion?: MLSuggestion | null;
  availableCategories?: Category[] | null;
  availablePersonalTags?: PersonalTag[] | null;
  onConfirm: (finalParams: Record<string, any>) => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmationCard({
  action,
  params,
  mlSuggestion,
  availableCategories,
  availablePersonalTags,
  onConfirm,
  onCancel
}: ConfirmationCardProps) {
  const [loading, setLoading] = useState(false);
  
  // Fetch user settings for exchange rates
  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });
  
  // Build exchange rates from user settings (only include configured rates)
  const exchangeRates = useMemo(() => {
    const rates: Record<string, number> = { USD: 1 }; // USD is always base currency
    
    if (settings?.exchangeRateRUB) {
      rates.RUB = parseFloat(settings.exchangeRateRUB);
    }
    if (settings?.exchangeRateIDR) {
      rates.IDR = parseFloat(settings.exchangeRateIDR);
    }
    if (settings?.exchangeRateKRW) {
      rates.KRW = parseFloat(settings.exchangeRateKRW);
    }
    if (settings?.exchangeRateEUR) {
      rates.EUR = parseFloat(settings.exchangeRateEUR);
    }
    if (settings?.exchangeRateCNY) {
      rates.CNY = parseFloat(settings.exchangeRateCNY);
    }
    
    return rates;
  }, [settings]);
  
  // Normalize params and compute stable signature
  const paramsSignature = useMemo(() => JSON.stringify(params), [params]);
  const normalizedParams = useMemo(() => normalizeParams(params), [paramsSignature]);
  
  const [editableParams, setEditableParams] = useState<Record<string, any>>(normalizedParams);
  const lastSyncedParamsRef = useRef<Record<string, any>>(structuredClone(normalizedParams));
  
  // Build available currencies for dropdown (always include USD + default + current transaction currency)
  const availableCurrencies = useMemo(() => {
    const currencies = new Set(['USD']); // USD always available
    
    // Add default currency even if no rate (prevents dropdown breaking)
    if (settings?.currency) {
      currencies.add(settings.currency);
    }
    
    // Add current transaction currency (prevents dropdown from hiding selected value)
    if (editableParams.currency) {
      currencies.add(editableParams.currency);
    }
    
    // Add all currencies with configured rates
    Object.keys(exchangeRates).forEach(curr => currencies.add(curr));
    
    return Array.from(currencies);
  }, [settings?.currency, editableParams.currency, exchangeRates]);
  
  // Sync editableParams when NEW params arrive (deep clone + comparison)
  useEffect(() => {
    const lastSynced = lastSyncedParamsRef.current;
    
    // Deep comparison: check all keys
    const allKeys = new Set([
      ...Object.keys(normalizedParams),
      ...Object.keys(lastSynced)
    ]);
    
    const hasChanged = Array.from(allKeys).some(key => {
      const current = normalizedParams[key];
      const last = lastSynced[key];
      
      // Deep equality for objects/arrays
      if (typeof current === 'object' && typeof last === 'object') {
        return JSON.stringify(current) !== JSON.stringify(last);
      }
      return current !== last;
    });
    
    if (hasChanged) {
      setEditableParams(normalizedParams);
      lastSyncedParamsRef.current = structuredClone(normalizedParams);
    }
  }, [normalizedParams]);
  
  const isAddTransaction = action === 'add_transaction';
  const hasCategories = availableCategories && availableCategories.length > 0;
  const hasPersonalTags = availablePersonalTags && availablePersonalTags.length > 0;
  
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(editableParams);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCategoryChange = (categoryName: string) => {
    setEditableParams({
      ...editableParams,
      category: categoryName
    });
  };
  
  const handleCurrencyChange = (currency: string) => {
    setEditableParams({
      ...editableParams,
      currency
    });
  };
  
  const handlePersonalTagChange = (tagName: string | undefined) => {
    const updated = { ...editableParams };
    if (tagName === undefined) {
      delete updated.personal_tag; // Remove field when "No tag" selected
    } else {
      updated.personal_tag = tagName;
    }
    setEditableParams(updated);
  };
  
  const handleFieldChange = (field: string, value: string | number) => {
    setEditableParams({
      ...editableParams,
      [field]: value
    });
  };
  
  return (
    <Card 
      className="border-2 border-primary bg-primary/5 
                 animate-in slide-in-from-bottom-4 duration-300"
      data-testid="card-confirmation"
    >
      <CardContent className="p-4 space-y-3">
        <ActionPreview action={action} params={editableParams} />
        
        <div className="bg-muted p-3 rounded-md text-sm space-y-2">
          {/* Editable fields for add_transaction */}
          {isAddTransaction && (
            <>
              <div className="space-y-1.5">
                <EditableField
                  label="Amount"
                  type="number"
                  value={editableParams.amount || 0}
                  onChange={(val) => handleFieldChange('amount', val)}
                  testId="input-amount"
                />
                {/* Currency display and USD conversion - always show for transactions */}
                <div className="flex items-center justify-between text-xs px-2">
                  <span className="text-muted-foreground font-medium">
                    {editableParams.currency || 'USD'}
                  </span>
                  {(editableParams.currency || 'USD') !== 'USD' && exchangeRates[editableParams.currency] && (
                    <span className="text-muted-foreground">
                      ≈ ${((editableParams.amount || 0) / exchangeRates[editableParams.currency]).toFixed(2)} USD
                    </span>
                  )}
                </div>
              </div>
              
              <EditableField
                label="Description"
                value={editableParams.description || ''}
                onChange={(val) => handleFieldChange('description', val)}
                testId="input-description"
              />
            </>
          )}
          
          {/* Category dropdown with ML suggestion */}
          {isAddTransaction && hasCategories && (
            <CategoryDropdown
              value={editableParams.category}
              availableCategories={availableCategories || []}
              mlSuggestion={mlSuggestion}
              onChange={handleCategoryChange}
            />
          )}
          
          {/* Personal Tag dropdown */}
          {isAddTransaction && hasPersonalTags && (
            <PersonalTagDropdown 
              value={editableParams.personal_tag || null}
              availableTags={availablePersonalTags || []}
              onChange={handlePersonalTagChange}
            />
          )}
          
          {/* Currency dropdown - show USD + default + current + configured */}
          {isAddTransaction && (
            <CurrencyDropdown 
              value={editableParams.currency || 'USD'}
              onChange={handleCurrencyChange}
              availableCurrencies={availableCurrencies}
            />
          )}
          
          {/* Readonly params (type, date, etc) */}
          {Object.entries(editableParams).map(([key, value]) => {
            // Skip editable/dropdown fields
            if (isAddTransaction && [
              'amount', 'description', 'category', 'currency', 'personal_tag'
            ].includes(key)) {
              return null;
            }
            
            // Readonly parameter display
            return (
              <div key={key} className="flex justify-between gap-4">
                <span className="text-muted-foreground capitalize">{key}:</span>
                <span className="font-medium text-right break-all">
                  {String(value)}
                </span>
              </div>
            );
          })}
        </div>
        
        <ConfirmationButtons
          onConfirm={handleConfirm}
          onCancel={onCancel}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
}
