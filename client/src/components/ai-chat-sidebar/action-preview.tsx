import { Folder, DollarSign, Wallet, Bot } from 'lucide-react';

interface ActionPreviewProps {
  action: string;
  params: Record<string, any>;
}

export function ActionPreview({ action, params }: ActionPreviewProps) {
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
      case 'create_category': return 'Create Category';
      case 'add_transaction': return 'Add Transaction';
      case 'get_balance': return 'Check Balance';
      default: return 'Action';
    }
  };
  
  const Icon = getIcon();
  
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
          {Object.keys(params).length} parameter{Object.keys(params).length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
