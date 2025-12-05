/**
 * Landing Page
 *
 * Main marketing page for Budget Buddy.
 * Composed of smaller, focused section components.
 *
 * Junior-Friendly:
 * - ~40 lines (was 475!)
 * - Each section is a separate component (<100 lines)
 * - Easy to find and modify specific sections
 */

import {
  LandingNavbar,
  HeroSection,
  ProblemSection,
  SolutionSection,
  FeaturesSection,
  HowItWorksSection,
  FAQSection,
  CTASection,
  LandingFooter,
} from "@/components/landing/sections";

export default function LandingPage() {
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <HeroSection onScrollToFeatures={scrollToFeatures} />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
