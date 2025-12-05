/**
 * Landing Page Hero Section
 *
 * Main hero with title, subtitle, CTA buttons and dashboard preview.
 * ~100 lines - focused on first impression.
 */

import { Button } from "@/components/ui/button";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Sparkles, Check, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n/context";

interface HeroSectionProps {
  onScrollToFeatures: () => void;
}

export function HeroSection({ onScrollToFeatures }: HeroSectionProps) {
  const { t } = useTranslation();

  const benefits = [
    { key: "free_forever", label: t("landing.hero.free_forever") },
    { key: "no_credit_card", label: t("landing.hero.no_credit_card") },
    { key: "quick_setup", label: t("landing.hero.quick_setup") },
  ];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background"
      aria-labelledby="hero-title"
    >
      <div className="container mx-auto px-4 py-12 md:py-16">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>{t("landing.hero.badge")}</span>
          </div>

          {/* Title */}
          <h1
            id="hero-title"
            className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
          >
            {t("landing.hero.title")}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            {t("landing.hero.subtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              asChild
              size="lg"
              className="text-lg px-8"
              data-testid="button-hero-cta"
              aria-label={t("landing.hero.cta_primary")}
            >
              <Link href="/login">{t("landing.hero.cta_primary")}</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8"
              onClick={onScrollToFeatures}
              data-testid="button-hero-demo"
              aria-label={t("landing.hero.cta_secondary")}
            >
              {t("landing.hero.cta_secondary")}
            </Button>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
            {benefits.map((benefit) => (
              <div key={benefit.key} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
                <span>{benefit.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          className="mt-16 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <DashboardPreview />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
      </div>
    </section>
  );
}
