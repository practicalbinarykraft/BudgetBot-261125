/**
 * Landing Page Problem & Solution Sections
 *
 * Shows user pain points and how we solve them.
 * ~90 lines - focused on problem/solution narrative.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Camera, Sparkles, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n/context";
import { LucideIcon } from "lucide-react";

interface Solution {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  color: string;
}

export function ProblemSection() {
  const { t } = useTranslation();

  const pains = [
    { emoji: "😫", titleKey: "landing.problem.pain1.title", descKey: "landing.problem.pain1.desc" },
    { emoji: "🤷", titleKey: "landing.problem.pain2.title", descKey: "landing.problem.pain2.desc" },
    { emoji: "🎯", titleKey: "landing.problem.pain3.title", descKey: "landing.problem.pain3.desc" },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30" aria-labelledby="problem-title">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 id="problem-title" className="text-3xl md:text-5xl font-bold text-center mb-12 md:mb-16">
            {t("landing.problem.title")}
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {pains.map((pain, index) => (
              <Card key={index} className="hover-elevate">
                <CardContent className="p-6 md:p-8 text-center">
                  <div className="text-5xl md:text-6xl mb-4" role="img" aria-label={t(pain.titleKey)}>
                    {pain.emoji}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-3">{t(pain.titleKey)}</h3>
                  <p className="text-muted-foreground">{t(pain.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xl md:text-2xl font-semibold mt-12 md:mt-16 text-primary">
            {t("landing.problem.transition")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export function SolutionSection() {
  const { t } = useTranslation();

  const solutions: Solution[] = [
    { icon: Camera, titleKey: "landing.solution.scan.title", descKey: "landing.solution.scan.desc", color: "text-blue-500" },
    { icon: Sparkles, titleKey: "landing.solution.ai.title", descKey: "landing.solution.ai.desc", color: "text-purple-500" },
    { icon: Target, titleKey: "landing.solution.goals.title", descKey: "landing.solution.goals.desc", color: "text-green-500" },
  ];

  return (
    <section className="py-16 md:py-24" aria-labelledby="solution-title">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 id="solution-title" className="text-3xl md:text-5xl font-bold text-center mb-12 md:mb-16">
            {t("landing.solution.title")}
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {solutions.map((solution, index) => (
              <div key={index} className="text-center">
                <div className={`inline-flex p-4 rounded-2xl bg-card mb-6 ${solution.color}`}>
                  <solution.icon className="w-10 h-10 md:w-12 md:h-12" aria-hidden="true" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">{t(solution.titleKey)}</h3>
                <p className="text-muted-foreground text-base md:text-lg">{t(solution.descKey)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
