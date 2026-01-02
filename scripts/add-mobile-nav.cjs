#!/usr/bin/env node
/**
 * Скрипт для автоматического добавления мобильной навигации ко всем страницам
 */

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../client/src/pages');

// Страницы которые НЕ нужно обновлять
const skipPages = [
  'auth-page.tsx',
  'landing-page.tsx',
  'not-found.tsx',
  'dashboard-mobile-demo-page.tsx',
  'dashboard-page.tsx', // Уже обновлена вручную
];

// Находим все .tsx файлы в pages
const pageFiles = fs.readdirSync(pagesDir)
  .filter(file => file.endsWith('.tsx') && !skipPages.includes(file));

console.log(`📱 Найдено ${pageFiles.length} страниц для обновления:`);
pageFiles.forEach(file => console.log(`  - ${file}`));

let successCount = 0;
let skipCount = 0;

pageFiles.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Проверяем что файл еще не обновлен
  if (content.includes('MobileBottomNav') || content.includes('MobileMenuSheet')) {
    console.log(`⏭️  Пропускаем ${file} - уже содержит мобильную навигацию`);
    skipCount++;
    return;
  }

  try {
    // 1. Добавляем импорты после последнего импорта
    const lastImportIndex = content.lastIndexOf('import ');
    const lastImportEnd = content.indexOf('\n', lastImportIndex);

    const newImports = `import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";\n`;

    content = content.slice(0, lastImportEnd + 1) + newImports + content.slice(lastImportEnd + 1);

    // 2. Добавляем useState для меню после первого useState
    const firstExportMatch = content.match(/export default function \w+\(\)[\s\S]*?\{/);
    if (!firstExportMatch) {
      console.log(`⚠️  Не найдена функция экспорта в ${file}`);
      skipCount++;
      return;
    }

    const exportStart = firstExportMatch.index + firstExportMatch[0].length;
    const firstStateMatch = content.slice(exportStart).match(/const \[/);

    if (firstStateMatch) {
      const firstStateEnd = content.indexOf('\n', exportStart + firstStateMatch.index);
      const mobileStates = `\n  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();`;
      content = content.slice(0, firstStateEnd + 1) + mobileStates + content.slice(firstStateEnd + 1);
    }

    // 3. Оборачиваем return в <> и </> и добавляем pb-20 sm:pb-6
    content = content.replace(/return \(\s*<div className="(space-y-\d+)"/g,
      'return (\n    <>\n      <div className="$1 pb-20 sm:pb-6"');

    content = content.replace(/return \(\s*<>\s*<div className="(space-y-\d+)"/g,
      'return (\n    <>\n      <div className="$1 pb-20 sm:pb-6"');

    // 4. Добавляем мобильную навигацию перед последним </div> или </>
    const mobileNavCode = `
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileBottomNav
          onMenuClick={() => setShowMobileMenu(true)}
          onAddClick={() => {
            toast({
              title: "Добавить транзакцию",
              description: "Функция скоро будет доступна!",
            });
          }}
          onAiChatClick={() => {
            toast({
              title: "AI Chat",
              description: "Функция AI чата скоро будет доступна!",
            });
          }}
        />
      )}

      <MobileMenuSheet
        open={showMobileMenu}
        onOpenChange={setShowMobileMenu}
      />
    </>;
  );
}`;

    // Находим последний return блок
    const lastReturnMatch = content.lastIndexOf('return (');
    const closingMatch = content.indexOf('  );\n}', lastReturnMatch);

    if (closingMatch > 0) {
      content = content.slice(0, closingMatch) + mobileNavCode.replace('    </>;', '') + content.slice(closingMatch);
    }

    // Записываем файл
    fs.writeFileSync(filePath, content);
    console.log(`✅ Обновлен ${file}`);
    successCount++;

  } catch (error) {
    console.error(`❌ Ошибка при обработке ${file}:`, error.message);
    skipCount++;
  }
});

console.log(`\n📊 Итого:`);
console.log(`  ✅ Обновлено: ${successCount}`);
console.log(`  ⏭️  Пропущено: ${skipCount}`);
console.log(`  📝 Всего обработано: ${pageFiles.length}`);
