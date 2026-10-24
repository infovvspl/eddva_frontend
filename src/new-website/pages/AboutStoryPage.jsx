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
import { useTranslation } from "react-i18next";

const AboutStoryPage = () => {
  const { t } = useTranslation("about");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <PageHead
          id="nw-about-story-head"
          title={t("story.pageTitle")}
          accent={t("story.pageAccent")}
          lead={t("story.pageLead")}
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
