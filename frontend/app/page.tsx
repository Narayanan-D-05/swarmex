import { MeshGradient } from "@/components/ui/mesh-gradient"
import { Navbar } from "@/components/ui/navbar"
import { HeroSection } from "@/components/sections/hero-section"
import { FeaturesSection } from "@/components/sections/features-section"
import { CtaSection } from "@/components/sections/cta-section"
import { FooterSection } from "@/components/sections/footer-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative selection:bg-emerald-500/30">
      <MeshGradient />
      <Navbar />
      <div className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <CtaSection />
        <FooterSection />
      </div>
    </main>
  )
}
