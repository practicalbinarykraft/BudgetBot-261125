import { useTranslation } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageToggle } from "@/components/language-toggle";
import { 
  Camera, 
  TrendingUp, 
  Target, 
  Globe2, 
  MessageSquare, 
  ShoppingCart,
  Sparkles,
  Check,
  ChevronDown,
  Zap,
  Shield,
  Clock
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LandingPage() {
  const { t } = useTranslation();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">{t("landing.footer.app_name")}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Button asChild variant="default" size="sm" data-testid="button-nav-login">
              <Link href="/login">{t("landing.hero.cta_primary")}</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>{t("landing.hero.badge")}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t("landing.hero.title")}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              {t("landing.hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="text-lg px-8" data-testid="button-hero-cta">
                <Link href="/login">
                  {t("landing.hero.cta_primary")}
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8"
                onClick={() => scrollToSection('features')}
                data-testid="button-hero-demo"
              >
                {t("landing.hero.cta_secondary")}
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>{t("landing.hero.free_forever")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>{t("landing.hero.no_credit_card")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>{t("landing.hero.quick_setup")}</span>
              </div>
            </div>
          </motion.div>

          {/* Animated mockup placeholder */}
          <motion.div 
            className="mt-16 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative rounded-2xl overflow-hidden border bg-card shadow-2xl">
              <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
                  <p className="text-muted-foreground">{t("landing.hero.preview")}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              {t("landing.problem.title")}
            </h2>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  emoji: "😫",
                  title: t("landing.problem.pain1.title"),
                  desc: t("landing.problem.pain1.desc"),
                },
                {
                  emoji: "🤷",
                  title: t("landing.problem.pain2.title"),
                  desc: t("landing.problem.pain2.desc"),
                },
                {
                  emoji: "🎯",
                  title: t("landing.problem.pain3.title"),
                  desc: t("landing.problem.pain3.desc"),
                },
              ].map((pain, index) => (
                <Card key={index} className="hover-elevate">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">{pain.emoji}</div>
                    <h3 className="text-xl font-bold mb-3">{pain.title}</h3>
                    <p className="text-muted-foreground">{pain.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-center text-2xl font-semibold mt-16 text-primary">
              {t("landing.problem.transition")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Solution Overview */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              {t("landing.solution.title")}
            </h2>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Camera,
                  title: t("landing.solution.scan.title"),
                  desc: t("landing.solution.scan.desc"),
                  color: "text-blue-500",
                },
                {
                  icon: Sparkles,
                  title: t("landing.solution.ai.title"),
                  desc: t("landing.solution.ai.desc"),
                  color: "text-purple-500",
                },
                {
                  icon: Target,
                  title: t("landing.solution.goals.title"),
                  desc: t("landing.solution.goals.desc"),
                  color: "text-green-500",
                },
              ].map((solution, index) => (
                <div key={index} className="text-center">
                  <div className={`inline-flex p-4 rounded-2xl bg-card mb-6 ${solution.color}`}>
                    <solution.icon className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{solution.title}</h3>
                  <p className="text-muted-foreground text-lg">{solution.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Killer Features */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
              {t("landing.features.title")}
            </h2>
            <p className="text-center text-muted-foreground text-xl mb-16 max-w-3xl mx-auto">
              {t("landing.features.subtitle")}
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[
                {
                  icon: Camera,
                  title: t("landing.feature1.title"),
                  desc: t("landing.feature1.desc"),
                  points: [
                    t("landing.feature1.point1"),
                    t("landing.feature1.point2"),
                    t("landing.feature1.point3"),
                  ],
                },
                {
                  icon: TrendingUp,
                  title: t("landing.feature2.title"),
                  desc: t("landing.feature2.desc"),
                  points: [
                    t("landing.feature2.point1"),
                    t("landing.feature2.point2"),
                    t("landing.feature2.point3"),
                  ],
                },
                {
                  icon: Target,
                  title: t("landing.feature3.title"),
                  desc: t("landing.feature3.desc"),
                  points: [
                    t("landing.feature3.point1"),
                    t("landing.feature3.point2"),
                    t("landing.feature3.point3"),
                  ],
                },
                {
                  icon: Globe2,
                  title: t("landing.feature4.title"),
                  desc: t("landing.feature4.desc"),
                  points: [
                    t("landing.feature4.point1"),
                    t("landing.feature4.point2"),
                    t("landing.feature4.point3"),
                  ],
                },
                {
                  icon: MessageSquare,
                  title: t("landing.feature5.title"),
                  desc: t("landing.feature5.desc"),
                  points: [
                    t("landing.feature5.point1"),
                    t("landing.feature5.point2"),
                    t("landing.feature5.point3"),
                  ],
                },
                {
                  icon: ShoppingCart,
                  title: t("landing.feature6.title"),
                  desc: t("landing.feature6.desc"),
                  points: [
                    t("landing.feature6.point1"),
                    t("landing.feature6.point2"),
                    t("landing.feature6.point3"),
                  ],
                },
              ].map((feature, index) => (
                <Card key={index} className="hover-elevate" data-testid={`feature-card-${index}`}>
                  <CardContent className="p-8">
                    <feature.icon className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground mb-4">{feature.desc}</p>
                    <ul className="space-y-2">
                      {feature.points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{point}</span>
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

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              {t("landing.how.title")}
            </h2>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Zap,
                  title: t("landing.how.step1.title"),
                  desc: t("landing.how.step1.desc"),
                },
                {
                  icon: Sparkles,
                  title: t("landing.how.step2.title"),
                  desc: t("landing.how.step2.desc"),
                },
                {
                  icon: Target,
                  title: t("landing.how.step3.title"),
                  desc: t("landing.how.step3.desc"),
                },
              ].map((step, index) => (
                <div key={index} className="relative">
                  <div className="text-center">
                    <div className="inline-flex p-6 rounded-full bg-primary/10 mb-6">
                      <step.icon className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                    <p className="text-muted-foreground text-lg">{step.desc}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/4 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              {t("landing.faq.title")}
            </h2>

            <Accordion type="single" collapsible className="max-w-3xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <AccordionItem key={i} value={`item-${i}`} data-testid={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {t(`landing.faq.q${i}`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    {t(`landing.faq.a${i}`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t("landing.cta.title")}
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              {t("landing.cta.subtitle")}
            </p>
            <Button asChild size="lg" className="text-lg px-12" data-testid="button-final-cta">
              <Link href="/login">
                {t("landing.cta.button")}
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">{t("landing.footer.app_name")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("landing.footer.tagline")}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t("landing.footer.product")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition">{t("landing.footer.features")}</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition">{t("landing.footer.pricing")}</a></li>
                <li><a href="#faq" className="hover:text-foreground transition">{t("landing.footer.faq")}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t("landing.footer.company")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-foreground transition">{t("landing.footer.about")}</a></li>
                <li><a href="#blog" className="hover:text-foreground transition">{t("landing.footer.blog")}</a></li>
                <li><a href="#contact" className="hover:text-foreground transition">{t("landing.footer.contact")}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t("landing.footer.legal")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#privacy" className="hover:text-foreground transition">{t("landing.footer.privacy")}</a></li>
                <li><a href="#terms" className="hover:text-foreground transition">{t("landing.footer.terms")}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 {t("landing.footer.app_name")}. {t("landing.footer.rights")}
            </p>
            <div className="flex gap-4">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
