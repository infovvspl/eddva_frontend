// SolutionPage.jsx — route: /solution
// Sub-page of the new website mockup. Shares only the chrome with the other
// surfaces; the panels and stakeholder rows are built for this page.
//
// WhyChooseSection was written but never mounted on the one-pager, so it is
// unique here. SchoolsSection stays out on purpose: partner school logos
// appear once, in PartnersStrip.
import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import SolutionPanels from "../components/SolutionPanels";
import SolutionDetail from "../components/SolutionDetail";
import WhyChooseSection from "../components/WhyChooseSection";
import Footer from "../components/Footer";

const SolutionPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <PageHead
          id="nw-solution-head"
          title="Solutions for Every"
          accent="Institution"
          lead="Schools, institutes and the people inside them — each with tools built for the job."
        />
        <SolutionPanels />
        <SolutionDetail />
        <WhyChooseSection />
      </main>
      <Footer />
    </div>
  );
};

export default SolutionPage;
