import { LandingNavbar } from "./navbar"
import { HeroSection } from "./hero-section"
import { FeaturesSection } from "./features-section"
import { HowItWorksSection } from "./how-it-works-section"
import { TicketCheckerSection } from "./ticket-checker-section"
import { FooterSection } from "./footer-section"
import type { Slide } from "@/components/shared/ibu-bupati-slider"

interface Props {
  logoUrl?: string | null
  posyanduLogoUrl?: string | null
  sliderPhotos?: Slide[]
  bupatiPhoto?: Slide
}

export function LandingPage({ logoUrl, posyanduLogoUrl, sliderPhotos, bupatiPhoto }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar logoUrl={logoUrl} posyanduLogoUrl={posyanduLogoUrl} />
      <main id="main-content" className="flex-1">
        <HeroSection slides={sliderPhotos} bupatiPhoto={bupatiPhoto} />
        <FeaturesSection />
        <HowItWorksSection />
        <TicketCheckerSection />
      </main>
      <FooterSection logoUrl={logoUrl} posyanduLogoUrl={posyanduLogoUrl} />
    </div>
  )
}
