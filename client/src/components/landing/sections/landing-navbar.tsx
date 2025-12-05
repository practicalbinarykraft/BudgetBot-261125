/**
 * Landing Page Navigation Bar
 *
 * Sticky navigation with logo and login button.
 * ~30 lines - focused on navigation only.
 */

import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "@/i18n/context";

export function LandingNavbar() {
  const { t } = useTranslation();

  return (
    <nav
      className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="navigation"
      aria-label={t("nav.main_navigation")}
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" aria-hidden="true" />
          <span className="font-bold text-lg">{t("landing.footer.app_name")}</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <Button
            asChild
            variant="default"
            size="sm"
            data-testid="button-nav-login"
            aria-label={t("landing.hero.cta_primary")}
          >
            <Link href="/login">{t("landing.hero.cta_primary")}</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
