// FeaturesPage.jsx — route: /features
// Index of every AI feature, each card linking to its own page.

import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import FeatureIndex from "../components/FeatureIndex";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";

const FeaturesPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <PageHead
          id="nw-features-head"
          title="AI"
          accent="Features"
          lead="Everything EDDVA does with AI — teaching, content, practice and the reporting around them."
        />
        <FeatureIndex />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default FeaturesPage;
