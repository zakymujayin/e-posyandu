import { LandingNavbar } from "./navbar"
import { HeroSection } from "./hero-section"
import { FeaturesSection } from "./features-section"
import { HowItWorksSection } from "./how-it-works-section"
import { TicketCheckerSection } from "./ticket-checker-section"
import { FooterSection } from "./footer-section"
import type { Slide } from "@/components/shared/ibu-bupati-slider"

import type { UserRole } from "@/types/next-auth"

interface Props {
  userRole?: UserRole | null
  logoUrl?: string | null
  posyanduLogoUrl?: string | null
  sliderPhotos?: Slide[]
  bupatiPhoto?: Slide
}

export function LandingPage({ userRole, logoUrl, posyanduLogoUrl, sliderPhotos, bupatiPhoto }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar userRole={userRole} logoUrl={logoUrl} posyanduLogoUrl={posyanduLogoUrl} />
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
