/**
 * Landing Page Footer
 *
 * Footer with links and copyright.
 * ~70 lines - focused on navigation and legal.
 */

import { Shield, Clock } from "lucide-react";
import { useTranslation } from "@/i18n/context";

export function LandingFooter() {
  const { t } = useTranslation();

  const footerLinks = {
    product: [
      { key: "features", href: "#features" },
      { key: "pricing", href: "#pricing" },
      { key: "faq", href: "#faq" },
    ],
    company: [
      { key: "about", href: "#about" },
      { key: "blog", href: "#blog" },
      { key: "contact", href: "#contact" },
    ],
    legal: [
      { key: "privacy", href: "#privacy" },
      { key: "terms", href: "#terms" },
    ],
  };

  return (
    <footer className="border-t bg-card" role="contentinfo">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t("landing.footer.app_name")}</h3>
            <p className="text-sm text-muted-foreground">{t("landing.footer.tagline")}</p>
          </div>

          {/* Product Links */}
          <nav aria-label={t("landing.footer.product")}>
            <h4 className="font-semibold mb-4">{t("landing.footer.product")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.product.map((link) => (
                <li key={link.key}>
                  <a href={link.href} className="hover:text-foreground transition">
                    {t(`landing.footer.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company Links */}
          <nav aria-label={t("landing.footer.company")}>
            <h4 className="font-semibold mb-4">{t("landing.footer.company")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.company.map((link) => (
                <li key={link.key}>
                  <a href={link.href} className="hover:text-foreground transition">
                    {t(`landing.footer.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal Links */}
          <nav aria-label={t("landing.footer.legal")}>
            <h4 className="font-semibold mb-4">{t("landing.footer.legal")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.legal.map((link) => (
                <li key={link.key}>
                  <a href={link.href} className="hover:text-foreground transition">
                    {t(`landing.footer.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Copyright */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 {t("landing.footer.app_name")}. {t("landing.footer.rights")}
          </p>
          <div className="flex gap-4" aria-label="Security badges">
            <Shield className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            <Clock className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
      </div>
    </footer>
  );
}
