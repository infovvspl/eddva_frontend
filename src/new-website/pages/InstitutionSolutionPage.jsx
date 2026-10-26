// InstitutionSolutionPage.jsx — route: /solution/institutions
// This used to duplicate the institution-*type* breakdown (Schools /
// Institutes / Universities) already shown on /solution — the exact same
// cards, just restyled, with nothing here that wasn't already on the
// overview page. It's the fourth stakeholder-role page (alongside Teachers,
// Students, Parents), so it now follows that same pattern instead: the
// Institute Admin role's own capability breakdown from data/solutions.js
// (nw-sol-admin), via RoleDetail — matching TeacherSolutionPage /
// StudentSolutionPage / ParentSolutionPage exactly.
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

const adminSource = roleSolutions.find(r => r.id === "nw-sol-admin");
const admin = adminSource && { ...adminSource, ...ROLE_PAGE_ACCENT };
const adminCapabilityCount = admin
  ? admin.groups.reduce((sum, group) => sum + group.items.length, 0)
  : 0;

const InstitutionSolutionPage = () => {
  const { t } = useTranslation("solutions");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        {admin && (
          <PageHead
            id="nw-institution-sol-head"
            title={t("pages.institutions.title")}
            accent={t("pages.institutions.accent")}
            lead={t("pages.institutions.lead")}
            icon={admin.Icon}
            color={admin.color}
            bg={admin.bg}
            stats={[
              { value: adminCapabilityCount, label: t("pages.capabilities") },
              { value: admin.groups.length, label: t("pages.categories") },
            ]}
          />
        )}
        {admin && <RoleDetail role={admin} />}
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default InstitutionSolutionPage;
