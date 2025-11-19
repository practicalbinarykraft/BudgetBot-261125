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
      case 'create_category': return t('analysis.action_create_category');
      case 'add_transaction': return t('analysis.action_add_transaction');
      case 'get_balance': return t('analysis.action_get_balance');
      default: return action;
    }
  };
  
  const Icon = getIcon();
  const paramCount = Object.keys(params).length;
  const paramText = paramCount === 1 ? t('analysis.parameter') : t('analysis.parameters');
  
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
