/**
 * Landing Page Features Section
 *
 * Displays 6 killer features with icons and bullet points.
 * ~100 lines - focused on feature showcase.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Camera, TrendingUp, Target, Globe2, MessageSquare, ShoppingCart, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n/context";
import { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  pointKeys: string[];
}

export function FeaturesSection() {
  const { t } = useTranslation();

  const features: Feature[] = [
    {
      icon: Camera,
      titleKey: "landing.feature1.title",
      descKey: "landing.feature1.desc",
      pointKeys: ["landing.feature1.point1", "landing.feature1.point2", "landing.feature1.point3"],
    },
    {
      icon: TrendingUp,
      titleKey: "landing.feature2.title",
      descKey: "landing.feature2.desc",
      pointKeys: ["landing.feature2.point1", "landing.feature2.point2", "landing.feature2.point3"],
    },
    {
      icon: Target,
      titleKey: "landing.feature3.title",
      descKey: "landing.feature3.desc",
      pointKeys: ["landing.feature3.point1", "landing.feature3.point2", "landing.feature3.point3"],
    },
    {
      icon: Globe2,
      titleKey: "landing.feature4.title",
      descKey: "landing.feature4.desc",
      pointKeys: ["landing.feature4.point1", "landing.feature4.point2", "landing.feature4.point3"],
    },
    {
      icon: MessageSquare,
      titleKey: "landing.feature5.title",
      descKey: "landing.feature5.desc",
      pointKeys: ["landing.feature5.point1", "landing.feature5.point2", "landing.feature5.point3"],
    },
    {
      icon: ShoppingCart,
      titleKey: "landing.feature6.title",
      descKey: "landing.feature6.desc",
      pointKeys: ["landing.feature6.point1", "landing.feature6.point2", "landing.feature6.point3"],
    },
  ];

  return (
    <section
      id="features"
      className="py-16 md:py-24 bg-muted/30"
      aria-labelledby="features-title"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 id="features-title" className="text-3xl md:text-5xl font-bold text-center mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-center text-muted-foreground text-lg md:text-xl mb-12 md:mb-16 max-w-3xl mx-auto">
            {t("landing.features.subtitle")}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover-elevate"
                data-testid={`feature-card-${index}`}
              >
                <CardContent className="p-6 md:p-8">
                  <feature.icon
                    className="w-10 h-10 md:w-12 md:h-12 text-primary mb-4"
                    aria-hidden="true"
                  />
                  <h3 className="text-xl md:text-2xl font-bold mb-3">{t(feature.titleKey)}</h3>
                  <p className="text-muted-foreground mb-4">{t(feature.descKey)}</p>
                  <ul className="space-y-2" role="list">
                    {feature.pointKeys.map((pointKey, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check
                          className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>{t(pointKey)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
