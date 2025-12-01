import { HeroSection } from "@/components/lp/hero-section";
import { ProblemSolutionSection } from "@/components/lp/problem-solution";
import { FeatureCalendar } from "@/components/lp/feature-calendar";
import { FeatureChat } from "@/components/lp/feature-chat";
import { FeatureSecurity } from "@/components/lp/feature-security";
import { CTASection } from "@/components/lp/cta-section";
import { FooterSection } from "@/components/lp/footer-section";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] selection:bg-blue-500/30 font-sans">
            <main className="flex flex-col gap-0">
                <HeroSection />
                <ProblemSolutionSection />
                <FeatureCalendar />
                <FeatureChat />
                <FeatureSecurity />
                <CTASection />
            </main>
            <FooterSection />
        </div>
    );
}
