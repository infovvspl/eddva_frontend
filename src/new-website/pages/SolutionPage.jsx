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
import { useTranslation } from "react-i18next";

import useScrollToTopOrHash from "../hooks/useScrollToTopOrHash";

const SolutionPage = () => {
  const { t } = useTranslation("solutions");
  useScrollToTopOrHash();

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <PageHead
          id="nw-solution-head"
          title={t("pages.solution.title")}
          accent={t("pages.solution.accent")}
          lead={t("pages.solution.lead")}
          icon={Layers}
          color="#1a56db"
          bg="#eaf1fd"
          stats={[
            { value: services.length, label: t("pages.institutionTypes") },
            { value: roleSolutions.length, label: t("pages.stakeholderRoles") },
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
