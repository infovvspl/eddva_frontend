// AboutStoryPage.jsx — route: /about/story
// The full "About Us" narrative, moved off the main /about page onto its own
// page — see AboutStory.jsx for the signed-off copy itself, unchanged.
// /about links out to this page instead of ending on the narrative directly.

import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import AboutStory from "../components/AboutStory";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { HeartHandshake } from "lucide-react";

const AboutStoryPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <PageHead
          id="nw-about-story-head"
          title="Our"
          accent="Story"
          lead="Why EDDVA exists, what it believes about teaching, and where it's headed."
          icon={HeartHandshake}
          color="#1a56db"
          bg="#eaf1fd"
        />
        <AboutStory />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default AboutStoryPage;
