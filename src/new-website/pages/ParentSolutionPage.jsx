// ParentSolutionPage.jsx — route: /solution/parents
import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import RoleDetail from "../components/RoleDetail";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { roleSolutions } from "../data/solutions";

const parents = roleSolutions.find(r => r.id === "nw-sol-parents");
const parentCapabilityCount = parents
  ? parents.groups.reduce((sum, group) => sum + group.items.length, 0)
  : 0;

const ParentSolutionPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        {parents && (
          <PageHead
            id="nw-parent-sol-head"
            title="EDDVA for"
            accent="Parents"
            lead="Real-time updates, direct communication with school and teachers, and a clear view of your child's progress."
            icon={parents.Icon}
            color={parents.color}
            bg={parents.bg}
            stats={[
              { value: parentCapabilityCount, label: "Capabilities" },
              { value: parents.groups.length, label: "Categories" },
            ]}
          />
        )}
        {parents && <RoleDetail role={parents} />}
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default ParentSolutionPage;
