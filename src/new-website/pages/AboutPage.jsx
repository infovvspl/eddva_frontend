// AboutPage.jsx — route: /about
// Sub-page of the new website mockup. Shares only the chrome (TopBar, Navbar,
// PageHead, Footer) with the other surfaces — every body section here is
// built for this page. The copy is the same, pulled from src/data;
// the layouts are not the home page's.
//
// WhoWeAreSection was written but never mounted on the one-pager, so it is
// unique to this page. Its section id was "nw-about" — the same id
// AboutSection uses — and is now "nw-who".
//
// The full "About Us" narrative (AboutStory — Our Vision, Our Promise) used
// to close this page directly; it now has its own page at /about/story, and
// this page links out to it instead — see AboutStoryLink.
import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import AboutPillars from "../components/AboutPillars";
import WhoWeAreSection from "../components/WhoWeAreSection";
import AwardsTimeline from "../components/AwardsTimeline";
import AboutStoryLink from "../components/AboutStoryLink";
import PlatformStats from "../components/PlatformStats";
import Footer from "../components/Footer";
import { products } from "../data/products";
import { erpModules } from "../data/erpModules";
import { lmsModules } from "../data/lmsModules";
import { features } from "../data/features";
import { GraduationCap } from "lucide-react";

const AboutPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <PageHead
          id="nw-about-head"
          title="About"
          accent="EDDVA"
          lead="Built for the future of education — AI, automation and analytics in one platform."
          icon={GraduationCap}
          color="#1a56db"
          bg="#eaf1fd"
          stats={[
            { value: products.length, label: "Products" },
            { value: erpModules.length + lmsModules.length, label: "Modules" },
            { value: features.length, label: "AI Features" },
          ]}
        />
        <AboutPillars />
        <WhoWeAreSection />
        <PlatformStats />
        <AwardsTimeline />
        <AboutStoryLink />
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
