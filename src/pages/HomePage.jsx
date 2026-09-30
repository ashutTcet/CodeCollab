import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HeroSection from '../sections/HeroSection'
import FeaturesSection from '../sections/FeaturesSection'
import HowItWorksSection from '../sections/HowItWorksSection'
import ArchitectureSection from '../sections/ArchitectureSection'
import TechStackSection from '../sections/TechStackSection'
import UserRolesSection from '../sections/UserRolesSection'
import RoadmapSection from '../sections/RoadmapSection'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-900">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ArchitectureSection />
        <TechStackSection />
        <UserRolesSection />
        <RoadmapSection />
      </main>
      <Footer />
    </div>
  )
}
