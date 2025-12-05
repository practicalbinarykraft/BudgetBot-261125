/**
 * Landing Page Final CTA Section
 *
 * Final call-to-action before footer.
 * ~40 lines - focused on conversion.
 */

import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n/context";

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section
      className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background"
      aria-labelledby="cta-title"
    >
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 id="cta-title" className="text-3xl md:text-5xl font-bold mb-6">
            {t("landing.cta.title")}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            {t("landing.cta.subtitle")}
          </p>
          <Button
            asChild
            size="lg"
            className="text-lg px-12"
            data-testid="button-final-cta"
            aria-label={t("landing.cta.button")}
          >
            <Link href="/login">{t("landing.cta.button")}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
