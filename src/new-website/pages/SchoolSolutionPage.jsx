// SchoolSolutionPage.jsx — route: /solution/schools
import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import AudienceDetail from "../components/AudienceDetail";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { services } from "../data/services";

const schools = services.find(s => s.id === "nw-svc-schools");

const SchoolSolutionPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        {schools && (
          <PageHead
            id="nw-school-sol-head"
            title="EDDVA for"
            accent="Schools"
            lead="Everything your school needs to manage operations, engage parents and enhance learning."
            icon={schools.Icon}
            color={schools.color}
            bg={schools.bg}
            stats={[
              { value: schools.covers.length, label: "Focus Areas" },
            ]}
          />
        )}
        {schools && <AudienceDetail audience={schools} />}
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default SchoolSolutionPage;
