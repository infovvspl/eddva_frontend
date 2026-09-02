// SolutionPage.jsx — route: /solution
// Shares the chrome with the other sub-pages; the audience panels and the
// stakeholder accordion are built for this page.
//
// WhyChooseSection — the dark counting-stats band — was written but never
// mounted on the one-pager, so it stays unique to this page and gives the
// scroll a change of tone before the closing CTA. SchoolsSection stays out on
// purpose: partner school logos appear once, in PartnersStrip.

import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import SolutionAudience from "../components/SolutionAudience";
import SolutionRoles from "../components/SolutionRoles";
import WhyChooseSection from "../components/WhyChooseSection";
import CtaBanner from "../components/CtaBanner";
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
        <SolutionAudience />
        <SolutionRoles />
        <WhyChooseSection />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default SolutionPage;
