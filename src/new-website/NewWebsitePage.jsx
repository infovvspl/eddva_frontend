// NewWebsitePage.jsx — Main entry page for the new website mockup
// Lives at route: /
// Completely isolated from all existing eddva_frontend pages
//
// Partner schools appear once, in PartnersStrip. Stakeholders live inside
// ServicesSection rather than as a band of their own.
//
// SchoolsSection, WhoWeAreSection, WhyChooseSection and FaqSection are
// intentionally not mounted; their files are kept for easy reinstatement.

import "./new-website.css";
import TopBar from "./components/TopBar";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import TrustStrip from "./components/TrustStrip";
import PartnersStrip from "./components/PartnersStrip";
import AboutSection from "./components/AboutSection";
import AiFeaturesSection from "./components/AiFeaturesSection";
import ProductsSection from "./components/ProductsSection";
import ServicesSection from "./components/ServicesSection";
import MobileAppSection from "./components/MobileAppSection";
import AchievementsSection from "./components/AchievementsSection";
import CtaBanner from "./components/CtaBanner";
import Footer from "./components/Footer";

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
