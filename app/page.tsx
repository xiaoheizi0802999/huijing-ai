import { CapabilitiesSection } from "@/components/cinematic/capabilities-section"
import { CinematicHeader } from "@/components/cinematic/cinematic-header"
import { FilmGrain } from "@/components/cinematic/film-grain"
import { GallerySection } from "@/components/cinematic/gallery-section"
import { HeroSection } from "@/components/cinematic/hero-section"
import { MembershipSection } from "@/components/cinematic/membership-section"
import { ProcessSection } from "@/components/cinematic/process-section"

export default function Home() {
  return (
    <div className="cinematic-page">
      <CinematicHeader />
      <FilmGrain />
      <main>
        <HeroSection />
        <CapabilitiesSection />
        <ProcessSection />
        <GallerySection />
        <MembershipSection />
      </main>
    </div>
  )
}
