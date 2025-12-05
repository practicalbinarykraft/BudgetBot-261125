/**
 * Landing Page FAQ Section
 *
 * Accordion with frequently asked questions.
 * ~50 lines - focused on answering common questions.
 */

import { motion } from "framer-motion";
import { useTranslation } from "@/i18n/context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQSection() {
  const { t } = useTranslation();

  const faqItems = [1, 2, 3, 4, 5, 6];

  return (
    <section className="py-16 md:py-24 bg-muted/30" aria-labelledby="faq-title">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 id="faq-title" className="text-3xl md:text-5xl font-bold text-center mb-12 md:mb-16">
            {t("landing.faq.title")}
          </h2>

          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            {faqItems.map((i) => (
              <AccordionItem key={i} value={`item-${i}`} data-testid={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base md:text-lg font-semibold">
                  {t(`landing.faq.q${i}`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm md:text-base">
                  {t(`landing.faq.a${i}`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
