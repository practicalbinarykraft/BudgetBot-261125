/**
 * Landing Page "How It Works" Section
 *
 * Shows 3 simple steps to get started.
 * ~60 lines - focused on onboarding clarity.
 */

import { Zap, Sparkles, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n/context";
import { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

export function HowItWorksSection() {
  const { t } = useTranslation();

  const steps: Step[] = [
    { icon: Zap, titleKey: "landing.how.step1.title", descKey: "landing.how.step1.desc" },
    { icon: Sparkles, titleKey: "landing.how.step2.title", descKey: "landing.how.step2.desc" },
    { icon: Target, titleKey: "landing.how.step3.title", descKey: "landing.how.step3.desc" },
  ];

  return (
    <section className="py-16 md:py-24" aria-labelledby="how-title">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 id="how-title" className="text-3xl md:text-5xl font-bold text-center mb-12 md:mb-16">
            {t("landing.how.title")}
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="inline-flex p-5 md:p-6 rounded-full bg-primary/10 mb-6">
                  <step.icon className="w-10 h-10 md:w-12 md:h-12 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">{t(step.titleKey)}</h3>
                <p className="text-muted-foreground text-base md:text-lg">{t(step.descKey)}</p>

                {/* Connector line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-1/4 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
