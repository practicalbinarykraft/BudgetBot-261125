import { Category } from "@shared/schema";

/**
 * Получить эмодзи иконку для категории
 * Если icon === "Tag" или пустая, возвращает дефолтную иконку
 */
export function getCategoryIcon(category: Category | { icon?: string | null }): string {
  const icon = category.icon;
  
  // Если иконка не задана или это "Tag", возвращаем дефолтную
  if (!icon || icon === "Tag") {
    return "📁"; // Дефолтная иконка папки
  }
  
  // Если это эмодзи, возвращаем его
  return icon;
}

/**
 * Компонент для отображения иконки категории
 */
export function CategoryIcon({ 
  category, 
  className = "text-2xl" 
}: { 
  category: Category | { icon?: string | null }; 
  className?: string;
}) {
  const icon = getCategoryIcon(category);
  
  return <span className={className}>{icon}</span>;
}
