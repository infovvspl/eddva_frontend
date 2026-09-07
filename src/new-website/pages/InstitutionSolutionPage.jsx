// InstitutionSolutionPage.jsx — route: /solution/institutions
// Institutes, Schools and Universities used to be split across a bare anchor
// (Institutes, on /solution) and two standalone pages (SchoolSolutionPage,
// UniversitySolutionPage). All three now stack on this one page instead — a
// long scroll rather than tabs, so a visitor arriving for one type can still
// scroll past and see the others. The nav dropdown and the /solution overview
// panels link here with a #nw-svc-<id> hash to land on the right section.
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import AudienceDetail from "../components/AudienceDetail";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { services } from "../data/services";
import { Layers } from "lucide-react";
import useScrollToTopOrHash from "../hooks/useScrollToTopOrHash";

const InstitutionSolutionPage = () => {
  useScrollToTopOrHash();

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <PageHead
          id="nw-institution-sol-head"
          title="Solutions for Every"
          accent="Institution"
          lead="Schools, coaching institutes and universities — the same platform, configured around how each one actually runs."
          icon={Layers}
          color="#1a56db"
          bg="#eaf1fd"
          stats={[{ value: services.length, label: "Institution Types" }]}
        />
        {services.map(service => (
          <AudienceDetail key={service.id} audience={service} id={service.id} />
        ))}
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default InstitutionSolutionPage;
