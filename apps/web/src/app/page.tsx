import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Closing, Faq, SiteFooter, SiteHeader } from "@/components/landing/Sections";
import { WhyNotAnAd } from "@/components/landing/WhyNotAnAd";
import { PageTransition } from "@/components/ui/PageTransition";

export default function LandingPage() {
  return (
    <PageTransition>
      <div className="relative">
        <SiteHeader />
        <main>
          <Hero />
          <HowItWorks />
          <WhyNotAnAd />
          <Faq />
          <Closing />
        </main>
        <SiteFooter />
      </div>
    </PageTransition>
  );
}
