import { Navbar } from "@/components/lp/navbar";
import { HeroSection } from "@/components/lp/hero-section";
import { ProblemSection } from "@/components/lp/problem-section";
import { ConceptSection } from "@/components/lp/concept-section";
import { FeaturesSection } from "@/components/lp/features-section";
import { WhySocialOpsSection } from "@/components/lp/why-socialops-section";
import { UseCasesSection } from "@/components/lp/use-cases-section";
import { RoadmapSection } from "@/components/lp/roadmap-section";
import { FooterSection } from "@/components/lp/footer-section";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-purple-500/30">
            <Navbar />
            <main>
                <HeroSection />
                <ProblemSection />
                <ConceptSection />
                <FeaturesSection />
                <WhySocialOpsSection />
                <UseCasesSection />
                <RoadmapSection />
            </main>
            <FooterSection />
        </div>
    );
}
