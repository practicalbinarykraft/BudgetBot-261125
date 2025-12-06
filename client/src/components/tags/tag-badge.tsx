import type { PersonalTag } from '@shared/schema';
import { User, Heart, Home, Users, Baby, UserPlus, Briefcase, Gift, Dog, Cat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '@/i18n/context';

interface TagBadgeProps {
  tag: Pick<PersonalTag, 'icon' | 'name' | 'color'>;
  className?: string;
}

// Default tag names that need translation
const DEFAULT_TAG_NAMES = ['Personal', 'Shared'];

const ICON_MAP: Record<string, LucideIcon> = {
  User,
  Heart,
  Home,
  Users,
  Baby,
  UserPlus,
  Briefcase,
  Gift,
  Dog,
  Cat,
};

export function TagBadge({ tag, className = '' }: TagBadgeProps) {
  const { t } = useTranslation();
  const IconComponent = ICON_MAP[tag.icon || 'User'] || User;

  // Translate default tag names
  const displayName = DEFAULT_TAG_NAMES.includes(tag.name)
    ? t(`tags.default_name.${tag.name}`)
    : tag.name;

  return (
    <span
      className={`inline-flex items-center gap-1 max-w-full ${className}`}
      style={{ color: tag.color || '#3b82f6' }}
      data-testid={`tag-badge-${tag.name}`}
    >
      <IconComponent className="h-4 w-4 flex-shrink-0" data-testid={`tag-icon-${tag.name}`} />
      <span className="text-sm font-medium truncate" data-testid={`tag-name-${tag.name}`}>
        {displayName}
      </span>
    </span>
  );
}
