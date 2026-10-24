// ParentSolutionPage.jsx — route: /solution/parents
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import RoleDetail from "../components/RoleDetail";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { roleSolutions, ROLE_PAGE_ACCENT } from "../data/solutions";

const parentsSource = roleSolutions.find(r => r.id === "nw-sol-parents");
const parents = parentsSource && { ...parentsSource, ...ROLE_PAGE_ACCENT };
const parentCapabilityCount = parents
  ? parents.groups.reduce((sum, group) => sum + group.items.length, 0)
  : 0;

const ParentSolutionPage = () => {
  const { t } = useTranslation("solutions");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        {parents && (
          <PageHead
            id="nw-parent-sol-head"
            title={t("pages.parents.title")}
            accent={t("pages.parents.accent")}
            lead={t("pages.parents.lead")}
            icon={parents.Icon}
            color={parents.color}
            bg={parents.bg}
            stats={[
              { value: parentCapabilityCount, label: t("pages.capabilities") },
              { value: parents.groups.length, label: t("pages.categories") },
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
