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
// AboutStory closes the page with the full "About Us" narrative — the
// signed-off copy naming Our Vision and Our Promise. It repeats the page's
// opening heading ("Empowering Education. Enriching Futures.") once more as
// the story's own headline, which is intentional in the source copy — the
// same line opens the pillars above and closes the narrative below.
import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import AboutPillars from "../components/AboutPillars";
import WhoWeAreSection from "../components/WhoWeAreSection";
import AwardsTimeline from "../components/AwardsTimeline";
import AboutStory from "../components/AboutStory";
import Footer from "../components/Footer";

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
        />
        <AboutPillars />
        <WhoWeAreSection />
        <AwardsTimeline />
        <AboutStory />
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
