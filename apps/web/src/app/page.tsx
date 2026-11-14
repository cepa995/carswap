import { Hero } from "@/components/landing/Hero";
import { Closing, Faq, HowItWorks, SiteFooter, SiteHeader, WhyNotAnAd } from "@/components/landing/Sections";
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
