// NewWebsitePage.jsx — Main entry page for the new website mockup
// Lives at route: /new-website
// Completely isolated from all existing eddva_frontend pages
//
// Partner schools appear once, in PartnersStrip. Stakeholders live inside
// ServicesSection rather than as a band of their own.
//
// SchoolsSection, WhoWeAreSection, WhyChooseSection and FaqSection are
// intentionally not mounted; their files are kept for easy reinstatement.

import "../new-website/new-website.css";
import TopBar from "../new-website/components/TopBar";
import Navbar from "../new-website/components/Navbar";
import HeroSection from "../new-website/components/HeroSection";
import TrustStrip from "../new-website/components/TrustStrip";
import PartnersStrip from "../new-website/components/PartnersStrip";
import AboutSection from "../new-website/components/AboutSection";
import AiFeaturesSection from "../new-website/components/AiFeaturesSection";
import ProductsSection from "../new-website/components/ProductsSection";
import ServicesSection from "../new-website/components/ServicesSection";
import MobileAppSection from "../new-website/components/MobileAppSection";
import AchievementsSection from "../new-website/components/AchievementsSection";
import CtaBanner from "../new-website/components/CtaBanner";
import Footer from "../new-website/components/Footer";

const NewWebsitePage = () => {
  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <HeroSection />
        <TrustStrip />
        <PartnersStrip />
        <AboutSection />
        <ServicesSection />
        <ProductsSection />
        <AiFeaturesSection />
        <AchievementsSection />
        <MobileAppSection />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default NewWebsitePage;
