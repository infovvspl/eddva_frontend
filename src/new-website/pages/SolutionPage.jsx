// SolutionPage.jsx — route: /solution
// Shares the chrome with the other sub-pages; the audience panels and the
// stakeholder accordion are built for this page.
//
// SchoolsSection stays out on purpose: partner school logos appear once, in
// PartnersStrip.

import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import SolutionAudience from "../components/SolutionAudience";
import SolutionRoles from "../components/SolutionRoles";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { services } from "../data/services";
import { roleSolutions } from "../data/solutions";
import { Layers } from "lucide-react";
import useScrollToTopOrHash from "../hooks/useScrollToTopOrHash";

const SolutionPage = () => {
  useScrollToTopOrHash();

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
          icon={Layers}
          color="#1a56db"
          bg="#eaf1fd"
          stats={[
            { value: services.length, label: "Institution Types" },
            { value: roleSolutions.length, label: "Stakeholder Roles" },
          ]}
        />
        <SolutionAudience />
        <SolutionRoles />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default SolutionPage;
