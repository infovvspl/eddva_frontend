// StudentSolutionPage.jsx — route: /solution/students
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

const studentsSource = roleSolutions.find(r => r.id === "nw-sol-students");
const students = studentsSource && { ...studentsSource, ...ROLE_PAGE_ACCENT };
const studentCapabilityCount = students
  ? students.groups.reduce((sum, group) => sum + group.items.length, 0)
  : 0;

const StudentSolutionPage = () => {
  const { t } = useTranslation("solutions");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        {students && (
          <PageHead
            id="nw-student-sol-head"
            title={t("pages.students.title")}
            accent={t("pages.students.accent")}
            lead={t("pages.students.lead")}
            icon={students.Icon}
            color={students.color}
            bg={students.bg}
            stats={[
              { value: studentCapabilityCount, label: t("pages.capabilities") },
              { value: students.groups.length, label: t("pages.categories") },
            ]}
          />
        )}
        {students && <RoleDetail role={students} />}
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default StudentSolutionPage;
