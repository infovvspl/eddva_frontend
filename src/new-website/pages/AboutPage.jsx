// AboutPage.jsx — route: /about
// Sub-page of the new website mockup. Shares only the chrome (TopBar, Navbar,
// Footer) with the other surfaces — every body section here is built for
// this page.
//
// AboutHero replaces the shared PageHead here: this page wants a photo
// banner, not PageHead's stat-strip layout. AboutPillars ("Empowering
// Education. Enriching Futures.") is the one section carried over unchanged
// from the previous draft. WhoWeAreSection, PlatformStats and AwardsTimeline
// moved out of this page (AwardsTimeline and PlatformStats are still mounted
// on the one-pager; WhoWeAreSection is now unmounted everywhere but kept —
// see that file) in favour of FounderSection, TeamSection and ValuesSection,
// matching the live dev.eddva.in design this page was out of sync with.
//
// The full "About Us" narrative (AboutStory — Our Vision, Our Promise) lives
// at /about/story; AboutHero's "Our Story" button links out to it. The
// closing "Be a Part of the Change" band (PartOfChangeCta) was removed —
// the page now ends on ValuesSection.
import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import AboutHero from "../components/AboutHero";
import AboutPillars from "../components/AboutPillars";
import FounderSection from "../components/FounderSection";
import TeamSection from "../components/TeamSection";
import ValuesSection from "../components/ValuesSection";
import Footer from "../components/Footer";

const AboutPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <AboutHero />
        <AboutPillars />
        <FounderSection />
        <TeamSection />
        <ValuesSection />
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
