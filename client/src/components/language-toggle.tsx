import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/context';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ru' : 'en';
    setLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      data-testid="button-language-toggle"
      title={language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
      className="gap-2"
    >
      <Languages className="h-4 w-4" />
      <span className="text-sm font-medium">{language.toUpperCase()}</span>
    </Button>
  );
}
