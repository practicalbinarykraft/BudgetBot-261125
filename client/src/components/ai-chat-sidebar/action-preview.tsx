import { Folder, DollarSign, Wallet, Bot } from 'lucide-react';
import { useTranslation } from '@/i18n/context';

interface ActionPreviewProps {
  action: string;
  params: Record<string, any>;
}

export function ActionPreview({ action, params }: ActionPreviewProps) {
  const { t } = useTranslation();
  
  const getIcon = () => {
    switch (action) {
      case 'create_category': return Folder;
      case 'add_transaction': return DollarSign;
      case 'get_balance': return Wallet;
      default: return Bot;
    }
  };
  
  const getTitle = () => {
    switch (action) {
      case 'create_category': return t('ai_tools.create_category');
      case 'add_transaction': return t('ai_tools.add_transaction');
      case 'get_balance': return t('ai_tools.get_balance');
      default: return action;
    }
  };
  
  const Icon = getIcon();
  const paramCount = Object.keys(params).length;
  
  // Russian plural forms: 1 параметр, 2-4 параметра, 5+ параметров
  const getParamText = () => {
    if (paramCount === 1) return t('ai_tools.parameter_one');
    if (paramCount >= 2 && paramCount <= 4) return t('ai_tools.parameter_few');
    return t('ai_tools.parameter_many');
  };
  
  const paramText = getParamText();
  
  return (
    <div className="flex items-center gap-3" data-testid={`preview-${action}`}>
      <div className="w-10 h-10 rounded-full bg-primary
                      flex items-center justify-center text-primary-foreground">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm" data-testid="text-action-title">
          {getTitle()}
        </h4>
        <p className="text-xs text-muted-foreground" data-testid="text-param-count">
          {paramCount} {paramText}
        </p>
      </div>
    </div>
  );
}
